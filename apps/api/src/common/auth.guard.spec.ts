import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

function context(authorization?: string, isPublic = false) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
    __isPublic: isPublic,
  } as any;
}

describe("AuthGuard", () => {
  it("fails closed when JWT verification fails", async () => {
    const jwt = { verify: vi.fn(() => { throw new Error("jwt failure"); }) } as any;
    const reflector = { getAllAndOverride: vi.fn(() => false) } as any;
    const db = { findUserById: vi.fn() } as any;
    const guard = new AuthGuard(jwt, reflector, db);

    await expect(guard.canActivate(context("Bearer broken"))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(db.findUserById).not.toHaveBeenCalled();
  });

  it("fails closed when database lookup fails", async () => {
    const jwt = { verify: vi.fn(() => ({ sub: "user-1" })) } as any;
    const reflector = { getAllAndOverride: vi.fn(() => false) } as any;
    const db = { findUserById: vi.fn(async () => { throw new Error("database down"); }) } as any;
    const guard = new AuthGuard(jwt, reflector, db);

    await expect(guard.canActivate(context("Bearer valid"))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("allows genuinely public requests without credentials", async () => {
    const jwt = { verify: vi.fn() } as any;
    const reflector = { getAllAndOverride: vi.fn(() => true) } as any;
    const db = { findUserById: vi.fn() } as any;
    const guard = new AuthGuard(jwt, reflector, db);

    await expect(guard.canActivate(context(undefined, true))).resolves.toBe(true);
  });
});
