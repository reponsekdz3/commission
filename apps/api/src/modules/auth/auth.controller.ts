import { Body, Controller, Delete, Get, Param, Post, Req, Res, ForbiddenException } from "@nestjs/common";
import type { Request, Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { loadConfig } from "@imizi/config";
import { loginSchema, registerSchema, mfaCodeSchema, reauthSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from "@imizi/validation";
import { z } from "zod";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/records";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private readonly cookieName = "imizi_refresh";

  private cookiePath() {
    const prefix = (loadConfig().apiPrefix || "api/v1").replace(/^\/+|\/+$/g, "");
    return "/" + prefix + "/auth";
  }

  private isWebClient(req: Request) {
    return req.headers["x-imizi-client"] === "web";
  }

  private readRefreshCookie(req: Request) {
    const raw = req.headers.cookie || "";
    const match = raw.split(";").map((v) => v.trim()).find((v) => v.startsWith(this.cookieName + "="));
    return match ? decodeURIComponent(match.slice(this.cookieName.length + 1)) : undefined;
  }

  private setRefreshCookie(res: Response, token: string) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      this.cookieName +
        "=" +
        encodeURIComponent(token) +
        "; Max-Age=" +
        30 * 86400 +
        "; Path=" +
        this.cookiePath() +
        "; HttpOnly; SameSite=Lax" +
        secure,
    );
  }

  private clearRefreshCookie(res: Response) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      this.cookieName + "=; Max-Age=0; Path=" + this.cookiePath() + "; HttpOnly; SameSite=Lax" + secure,
    );
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("register")
  register(@Body() body: unknown) {
    return this.auth.register(registerSchema.parse(body));
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("login")
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const d = loginSchema.parse(body);
    const result = await this.auth.login(d.identifier, d.password, d.mfaCode, req.ip, req.headers["user-agent"]);
    if (this.isWebClient(req)) {
      this.setRefreshCookie(res, result.refreshToken);
      return { accessToken: result.accessToken, user: result.user };
    }
    return result;
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post("forgot-password")
  forgotPassword(@Body() body: unknown) {
    return this.auth.forgotPassword(forgotPasswordSchema.parse(body).email);
  }

  @Public()
  @Throttle({ auth: { limit: 8, ttl: 60000 } })
  @Post("verify-otp")
  verifyOtp(@Body() body: unknown) {
    const d = resetPasswordSchema.parse(body);
    return this.auth.resetPassword(d.email, d.code, d.password);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("refresh")
  async refresh(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const parsed = refreshSchema.safeParse(body);
    const cookie = this.readRefreshCookie(req);
    const token = parsed.success ? parsed.data.refreshToken : cookie;
    if (!token) throw new ForbiddenException("Refresh token required");

    const result = await this.auth.refresh(token);
    if (cookie === token || this.isWebClient(req)) this.setRefreshCookie(res, result.refreshToken);

    return this.isWebClient(req)
      ? { accessToken: result.accessToken, user: result.user }
      : result;
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post("logout")
  async logout(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const parsed = z.object({ refreshToken: z.string().min(32).max(256) }).partial().safeParse(body);
    const token = parsed.success && parsed.data.refreshToken ? parsed.data.refreshToken : this.readRefreshCookie(req);
    if (token) await this.auth.logout(token);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Post("mfa/setup")
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async setupMfa(@CurrentUser() u: UserRecord, @Body() b: unknown) {
    const d = z.object({ reauthToken: z.string().min(32).max(128).optional() }).parse(b ?? {});
    if (!d.reauthToken) return { requiresReauth: true, action: "mfa:manage" };
    if (!(await this.auth.consumeReauth(u, "mfa:manage", d.reauthToken))) {
      throw new ForbiddenException("Valid reauthentication is required");
    }
    return this.auth.setupMfa(u);
  }

  @Post("mfa/enable")
  @Throttle({ auth: { limit: 6, ttl: 60000 } })
  enableMfa(@CurrentUser() u: UserRecord, @Body() b: unknown) {
    return this.auth.enableMfa(u, mfaCodeSchema.parse(b).code);
  }

  @Post("mfa/disable")
  @Throttle({ auth: { limit: 6, ttl: 60000 } })
  async disableMfa(@CurrentUser() u: UserRecord, @Body() b: unknown) {
    const d = z.object({
      code: z.string().regex(/^\d{6}$/),
      reauthToken: z.string().min(32).max(128).optional(),
    }).parse(b);

    if (!d.reauthToken) return { requiresReauth: true, action: "mfa:manage" };
    if (!(await this.auth.consumeReauth(u, "mfa:manage", d.reauthToken))) {
      throw new ForbiddenException("Valid reauthentication is required");
    }
    return this.auth.disableMfa(u, d.code);
  }

  @Post("reauth")
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  reauth(@CurrentUser() u: UserRecord, @Body() b: unknown) {
    const d = reauthSchema.extend({ mfaCode: z.string().regex(/^\d{6}$/).optional() }).parse(b);
    const allowed = [
      "payment:refund",
      "payout:change",
      "property:delete",
      "account:change-phone",
      "account:change-email",
      "account:change-contact",
      "account:delete",
      "ownership:change",
      "mfa:manage",
    ] as const;

    if (!allowed.includes(d.action as (typeof allowed)[number])) {
      throw new ForbiddenException("Unsupported reauthentication action");
    }

    return this.auth.reauthenticate(u, d.password, d.action, d.mfaCode);
  }

  @Get("sessions")
  sessions(@CurrentUser() u: UserRecord) {
    return this.auth.sessions(u);
  }

  @Delete("sessions/:id")
  revokeSession(@CurrentUser() u: UserRecord, @Param("id") id: string) {
    return this.auth.revokeSession(u, id);
  }
}
