import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { loginSchema, registerSchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
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
  login(@Body() body: unknown) {
    const data = loginSchema.parse(body);
    return this.auth.login(data.identifier, data.password);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }
}
