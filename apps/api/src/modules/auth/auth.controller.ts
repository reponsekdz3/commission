import { Body, Controller, Delete, Param, Post, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { loginSchema, registerSchema, mfaCodeSchema, reauthSchema } from "@imizi/validation";
import { z } from "zod";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post("register")
  register(@Body() body: unknown) {
    return this.auth.register(registerSchema.parse(body));
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post("login")
  login(@Body() body: unknown,@Req() req:Request) {
    const data = loginSchema.parse(body);
    return this.auth.login(data.identifier, data.password, data.mfaCode, req.ip, req.headers["user-agent"]);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }
  @Post("mfa/setup") setupMfa(@CurrentUser() user:UserRecord){return this.auth.setupMfa(user);}
  @Post("mfa/enable") enableMfa(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.auth.enableMfa(user,mfaCodeSchema.parse(body).code);}
  @Post("mfa/disable") disableMfa(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.auth.disableMfa(user,mfaCodeSchema.parse(body).code);}
  @Post("reauth") reauth(@CurrentUser() user:UserRecord,@Body() body:unknown){const data=reauthSchema.extend({mfaCode:z.string().regex(/^\\d{6}$/).optional()}).parse(body);return this.auth.reauthenticate(user,data.password,data.action,data.mfaCode);}
  @Get("sessions") sessions(@CurrentUser() user:UserRecord){return this.auth.sessions(user);}
  @Delete("sessions/:id") revokeSession(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.auth.revokeSession(user,id);}

}
