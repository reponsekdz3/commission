import { Body, Controller, Delete, Param, Post, Get, Req, ForbiddenException } from "@nestjs/common";
import type { Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { loginSchema, registerSchema, mfaCodeSchema, reauthSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from "@imizi/validation";
import { z } from "zod";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { AuthService } from "./auth.service";

@ApiTags("auth") @Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("register") register(@Body() body:unknown){return this.auth.register(registerSchema.parse(body));}
  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("login") login(@Body() body:unknown,@Req() req:Request){const d=loginSchema.parse(body);return this.auth.login(d.identifier,d.password,d.mfaCode,req.ip,req.headers["user-agent"]); }
  @Public() @Throttle({auth:{limit:5,ttl:60000}}) @Post("forgot-password") forgotPassword(@Body() body:unknown){return this.auth.forgotPassword(forgotPasswordSchema.parse(body).email);}
  @Public() @Throttle({auth:{limit:8,ttl:60000}}) @Post("verify-otp") verifyOtp(@Body() body:unknown){const d=resetPasswordSchema.parse(body);return this.auth.resetPassword(d.email,d.code,d.password);}
  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("refresh") refresh(@Body() body:unknown){return this.auth.refresh(refreshSchema.parse(body).refreshToken);}
  @Post("mfa/setup")
  @Throttle({auth:{limit:5,ttl:60000}})
  async setupMfa(@CurrentUser() u:UserRecord,@Body() b:unknown){
    const d=z.object({reauthToken:z.string().min(32).max(128).optional()}).parse(b ?? {});
    if(!d.reauthToken)return {requiresReauth:true,action:"mfa:manage"};
    if(!(await this.auth.consumeReauth(u,"mfa:manage",d.reauthToken)))throw new ForbiddenException("Valid reauthentication is required");
    return this.auth.setupMfa(u);
  }
  @Post("mfa/enable") enableMfa(@CurrentUser()u:UserRecord,@Body()b:unknown){return this.auth.enableMfa(u,mfaCodeSchema.parse(b).code);}
  @Post("mfa/disable") disableMfa(@CurrentUser()u:UserRecord,@Body()b:unknown){return this.auth.disableMfa(u,mfaCodeSchema.parse(b).code);}
  @Post("reauth") @Throttle({auth:{limit:10,ttl:60000}}) reauth(@CurrentUser()u:UserRecord,@Body()b:unknown){
    const d=reauthSchema.extend({mfaCode:z.string().regex(/^\d{6}$/).optional()}).parse(b);
    if(!["payment:refund","payout:change","property:delete","account:change-phone","account:change-email","account:change-contact","ownership:change","mfa:manage"].includes(d.action))
      throw new ForbiddenException("Unsupported reauthentication action");
    return this.auth.reauthenticate(u,d.password,d.action,d.mfaCode);
  }
  @Get("sessions") sessions(@CurrentUser()u:UserRecord){return this.auth.sessions(u);}
  @Delete("sessions/:id") revokeSession(@CurrentUser()u:UserRecord,@Param("id")id:string){return this.auth.revokeSession(u,id);}
}
