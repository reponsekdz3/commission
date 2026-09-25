import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compareSync, hashSync } from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import type { Role } from "@imizi/types";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly store: PlatformStore,
  ) {}

  register(input: { email: string; phone: string; password: string; fullName: string; locale?: string }) {
    if (this.store.userByEmailOrPhone(input.email) || this.store.userByEmailOrPhone(input.phone)) {
      throw new ConflictException("Account already exists");
    }
    const user: UserRecord = {
      id: this.store.id(),
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash: hashSync(input.password, 12),
      fullName: input.fullName,
      locale: input.locale ?? "rw",
      roles: ["USER"],
      status: "ACTIVE",
      mfaEnabled: false,
      createdAt: this.store.now(),
    };
    this.store.users.set(user.id, user);
    this.store.consents.push({ userId: user.id, purpose: "account-creation", granted: true, at: this.store.now() });
    this.store.auditLog({ actorId: user.id, action: "USER_REGISTERED", subjectType: "user", subjectId: user.id });
    return this.issue(user);
  }

  login(identifier: string, password: string, ip?: string) {
    const user = this.store.userByEmailOrPhone(identifier);
    if (!user || !compareSync(password, user.passwordHash)) {
      this.store.auditLog({ action: "LOGIN_FAILED", subjectType: "auth", subjectId: identifier, ip });
      throw new UnauthorizedException("Invalid credentials");
    }
    this.store.auditLog({ actorId: user.id, action: "LOGIN_SUCCESS", subjectType: "user", subjectId: user.id, ip });
    return this.issue(user);
  }

  refresh(refreshToken: string) {
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    const session = this.store.refreshByHash.get(hash);
    if (!session || session.expiresAt < Date.now()) {
      throw new UnauthorizedException("Refresh token expired");
    }
    this.store.refreshByHash.delete(hash);
    const user = this.store.users.get(session.userId);
    if (!user) throw new UnauthorizedException();
    return this.issue(user);
  }

  private issue(user: UserRecord) {
    const accessToken = this.jwt.sign({ sub: user.id, roles: user.roles });
    const refreshToken = randomBytes(48).toString("hex");
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    this.store.refreshByHash.set(hash, { userId: user.id, expiresAt: Date.now() + 30 * 86400_000 });
    return {
      accessToken,
      refreshToken,
      user: this.publicUser(user),
    };
  }

  publicUser(user: UserRecord) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      locale: user.locale,
      roles: user.roles as Role[],
      organizationId: user.organizationId,
    };
  }
}
