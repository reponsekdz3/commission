import { Body, Controller, Delete, Param, Post, Get, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
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

  private setSessionCookies(res:Response,data:{accessToken:string;refreshToken:string}){
    const production=process.env.NODE_ENV==="production";
    const sameSite=(process.env.AUTH_COOKIE_SAMESITE ?? (production ? "none" : "lax")) as "lax"|"strict"|"none";
    const secure=production || sameSite==="none";
    res.cookie("imizi_access",data.accessToken,{httpOnly:true,secure,sameSite,path:"/",maxAge:15*60*1000});
    res.cookie("imizi_refresh",data.refreshToken,{httpOnly:true,secure,sameSite,path:"/api/v1/auth",maxAge:30*24*60*60*1000});
  }

  private readCookie(req:Request,name:string){
    const header=req.headers.cookie;
    if(!header)return undefined;
    const prefix=name+"=";
    for(const part of header.split(";")){
      const value=part.trim();
      if(value.startsWith(prefix))return decodeURIComponent(value.slice(prefix.length));
    }
    return undefined;
  }

  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("register")
  async register(@Body() body:unknown,@Res({passthrough:true}) res:Response){
    const data=await this.auth.register(registerSchema.parse(body));
    this.setSessionCookies(res,data);
    return data;
  }

  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("login")
  async login(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response){
    const d=loginSchema.parse(body);
    const data=await this.auth.login(d.identifier,d.password,d.mfaCode,req.ip,req.headers["user-agent"]);
    this.setSessionCookies(res,data);
    return data;
  }

  @Public() @Throttle({auth:{limit:5,ttl:60000}}) @Post("forgot-password") forgotPassword(@Body() body:unknown){return this.auth.forgotPassword(forgotPasswordSchema.parse(body).email);}
  @Public() @Throttle({auth:{limit:8,ttl:60000}}) @Post("verify-otp") verifyOtp(@Body() body:unknown){const d=resetPasswordSchema.parse(body);return this.auth.resetPassword(d.email,d.code,d.password);}

  @Public() @Throttle({auth:{limit:10,ttl:60000}}) @Post("refresh")
  async refresh(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response){
    const parsed=body && typeof body==="object" ? refreshSchema.safeParse(body) : {success:false as const};
    const legacyToken=parsed.success ? parsed.data.refreshToken : undefined;
    const token=legacyToken ?? this.readCookie(req,"imizi_refresh");
    if(!token)throw new UnauthorizedException("Refresh token required");
    const data=await this.auth.refresh(token);
    this.setSessionCookies(res,data);
    return data;
  }

  @Public() @Post("logout")
  async logout(@Body() body:unknown,@Req() req:Request,@Res({passthrough:true}) res:Response){
    const parsed=body && typeof body==="object" ? refreshSchema.safeParse(body) : {success:false as const};
    const token=parsed.success ? parsed.data.refreshToken : this.readCookie(req,"imizi_refresh");
    if(token)await this.auth.logout(token);
    res.clearCookie("imizi_access",{path:"/"});
    res.clearCookie("imizi_refresh",{path:"/api/v1/auth"});
    return {ok:true};
  }
  @Post("mfa/setup") setupMfa(@CurrentUser()u:UserRecord){return this.auth.setupMfa(u);}
  @Post("mfa/enable") enableMfa(@CurrentUser()u:UserRecord,@Body()b:unknown){return this.auth.enableMfa(u,mfaCodeSchema.parse(b).code);}
  @Post("mfa/disable") disableMfa(@CurrentUser()u:UserRecord,@Body()b:unknown){return this.auth.disableMfa(u,mfaCodeSchema.parse(b).code);}
  @Post("reauth") reauth(@CurrentUser()u:UserRecord,@Body()b:unknown){const d=reauthSchema.extend({mfaCode:z.string().regex(/^\d{6}$/).optional()}).parse(b);return this.auth.reauthenticate(u,d.password,d.action,d.mfaCode);}
  @Get("sessions") sessions(@CurrentUser()u:UserRecord){return this.auth.sessions(u);}
  @Delete("sessions/:id") revokeSession(@CurrentUser()u:UserRecord,@Param("id")id:string){return this.auth.revokeSession(u,id);}
}