import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC } from "./public.decorator";
import { PlatformStore } from "../store/platform.store";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly store: PlatformStore,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization as string | undefined;
    if (!header) {
      if (isPublic) return true;
      throw new UnauthorizedException("Authentication required");
    }
    try {
      const token = header.replace("Bearer ", "");
      const payload = this.jwt.verify(token);
      const user = this.store.users.get(payload.sub);
      if (!user || user.status !== "ACTIVE") throw new UnauthorizedException();
      req.user = user;
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
