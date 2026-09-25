import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compareSync, hashSync } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "crypto";
import type { Role } from "@imizi/types";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "@imizi/auth";
import type { UserRecord } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";
import { FeatureService } from "../../infra/feature.service";

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService, private readonly db: DatabaseService, private readonly features: FeatureService) {}

  async register(input: { email: string; phone: string; password: string; fullName: string; locale?: string }) {
    const existing = await this.db.findUserByIdentifier(input.email) ?? await this.db.findUserByIdentifier(input.phone);
    if (existing) throw new ConflictException("Account already exists");
    const user: UserRecord = {
      id: randomUUID(), email: input.email.toLowerCase(), phone: input.phone,
      passwordHash: hashSync(input.password, 12), fullName: input.fullName, locale: input.locale ?? "rw",
      roles: ["USER" as Role], status: "ACTIVE", mfaEnabled: false, createdAt: new Date().toISOString(),
    };
    const created = await this.db.createUser(user);
    await this.features.audit(created.id, "USER_REGISTERED", "user", created.id);
    return this.issue(created);
  }

  async login(identifier: string, password: string, mfaCode?: string, ip?: string, userAgent?: string) {
    const user = await this.db.findUserByIdentifier(identifier);
    if (!user || !compareSync(password, user.passwordHash)) {
      await this.features.audit(undefined, "LOGIN_FAILED", "auth", identifier, undefined, undefined, ip);
      throw new UnauthorizedException("Invalid credentials");
    }
    if(user.mfaEnabled){
      if(!mfaCode) throw new UnauthorizedException({code:"MFA_REQUIRED",message:"Multi-factor authentication code required"});
      const secret=await this.db.getMfaSecret(user.id);
      if(!secret?.secret || !verifyTotp(secret.secret,mfaCode)) throw new UnauthorizedException("Invalid MFA code");
    }
    await this.features.audit(user.id, "LOGIN_SUCCESS", "user", user.id, undefined, undefined, ip);
    return this.issue(user, userAgent, ip);
  }


  async setupMfa(user:UserRecord){
    const secret=generateTotpSecret();
    await this.db.setMfaSecret(user.id,secret);
    return {secret,otpauthUrl:otpauthUrl(secret,user.email)};
  }

  async enableMfa(user:UserRecord,code:string){
    const secret=await this.db.getMfaSecret(user.id);
    if(!secret?.secret || !verifyTotp(secret.secret,code)) throw new UnauthorizedException("Invalid MFA code");
    await this.db.setMfaEnabled(user.id,true);
    await this.features.audit(user.id,"MFA_ENABLED","user",user.id);
    return {enabled:true};
  }

  async disableMfa(user:UserRecord,code:string){
    const secret=await this.db.getMfaSecret(user.id);
    if(!secret?.secret || !verifyTotp(secret.secret,code)) throw new UnauthorizedException("Invalid MFA code");
    await this.db.setMfaEnabled(user.id,false);
    await this.db.setMfaSecret(user.id,"");
    await this.features.audit(user.id,"MFA_DISABLED","user",user.id);
    return {enabled:false};
  }

  async reauthenticate(user:UserRecord,password:string,action:string,mfaCode?:string){
    if(!compareSync(password,user.passwordHash)) throw new UnauthorizedException("Invalid password");
    if(user.mfaEnabled){
      const secret=await this.db.getMfaSecret(user.id);
      if(!mfaCode || !secret?.secret || !verifyTotp(secret.secret,mfaCode)) throw new UnauthorizedException("Valid MFA code required");
    }
    const raw=randomBytes(32).toString("hex");
    const hash=createHash("sha256").update(raw).digest("hex");
    await this.db.createReauthToken(user.id,action,hash,new Date(Date.now()+10*60_000));
    await this.features.audit(user.id,"REAUTHENTICATED","user",user.id,undefined,{action});
    return {reauthToken:raw,expiresIn:600};
  }

  async consumeReauth(user:UserRecord,action:string,token:string){
    const hash=createHash("sha256").update(token).digest("hex");
    return this.db.consumeReauthToken(user.id,action,hash);
  }

  async sessions(user:UserRecord){return this.db.listSessions(user.id);}
  async revokeSession(user:UserRecord,id:string){return this.db.revokeSession(user.id,id);}
    
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
