import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compareSync, hashSync } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "crypto";
import type { Role } from "@imizi/types";
import type { UserRecord } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService, private readonly db: DatabaseService) {}

  async register(input: { email: string; phone: string; password: string; fullName: string; locale?: string }) {
    const existing = await this.db.findUserByIdentifier(input.email) ?? await this.db.findUserByIdentifier(input.phone);
    if (existing) throw new ConflictException("Account already exists");
    const user: UserRecord = {
      id: randomUUID(), email: input.email.toLowerCase(), phone: input.phone,
      passwordHash: hashSync(input.password, 12), fullName: input.fullName, locale: input.locale ?? "rw",
      roles: ["USER" as Role], status: "ACTIVE", mfaEnabled: false, createdAt: new Date().toISOString(),
    };
    const created = await this.db.createUser(user);
    await this.db.auditLog(created.id, "USER_REGISTERED", "user", created.id);
    return this.issue(created);
  }

  async login(identifier: string, password: string, ip?: string) {
    const user = await this.db.findUserByIdentifier(identifier);
    if (!user || !compareSync(password, user.passwordHash)) {
      await this.db.auditLog(undefined, "LOGIN_FAILED", "auth", identifier, undefined, undefined, ip);
      throw new UnauthorizedException("Invalid credentials");
    }
    await this.db.auditLog(user.id, "LOGIN_SUCCESS", "user", user.id, undefined, undefined, ip);
    return this.issue(user, undefined, ip);
  }

  async refresh(refreshToken: string) {
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    const userId = await this.db.consumeRefreshToken(hash);
    if (!userId) throw new UnauthorizedException("Refresh token expired");
    const user = await this.db.findUserById(userId);
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedException();
    return this.issue(user);
  }

  private async issue(user: UserRecord, userAgent?: string, ip?: string) {
    const accessToken = this.jwt.sign({ sub: user.id, roles: user.roles });
    const refreshToken = randomBytes(48).toString("hex");
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    await this.db.createSession(user.id, hash, Date.now() + 30 * 86400_000, userAgent, ip);
    return { accessToken, refreshToken, user: this.publicUser(user) };
  }

  publicUser(user: UserRecord) {
    return { id:user.id,email:user.email,phone:user.phone,fullName:user.fullName,locale:user.locale,roles:user.roles,organizationId:user.organizationId };
  }
}
