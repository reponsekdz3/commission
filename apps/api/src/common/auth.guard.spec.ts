import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

function context(options:{publicRoute?:boolean;authorization?:string}) {
  const req={headers:{authorization:options.authorization}};
  return {
    getHandler:()=>function handler(){},
    getClass:()=>class Controller{},
    switchToHttp:()=>({getRequest:()=>req}),
  } as any;
}

describe("AuthGuard",()=>{
  it("rejects a protected request without credentials",async()=>{
    const reflector={getAllAndOverride:vi.fn().mockReturnValue(false)};
    const guard=new AuthGuard({verify:vi.fn()} as any,reflector as any,{} as any);
    await expect(guard.canActivate(context({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("fails closed when token verification or database access throws",async()=>{
    const reflector={getAllAndOverride:vi.fn().mockReturnValue(false)};
    const jwt={verify:vi.fn().mockImplementation(()=>{throw new Error("jwt service unavailable");})};
    const guard=new AuthGuard(jwt as any,reflector as any,{} as any);
    await expect(guard.canActivate(context({authorization:"Bearer broken"}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("requires a syntactically valid bearer header on authenticated routes",async()=>{
    const reflector={getAllAndOverride:vi.fn().mockReturnValue(false)};
    const guard=new AuthGuard({verify:vi.fn()} as any,reflector as any,{} as any);
    await expect(guard.canActivate(context({authorization:"not-a-bearer-token"}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("loads an active user after a valid token",async()=>{
    const reflector={getAllAndOverride:vi.fn().mockReturnValue(false)};
    const jwt={verify:vi.fn().mockReturnValue({sub:"user-1"})};
    const db={findUserById:vi.fn().mockResolvedValue({id:"user-1",status:"ACTIVE",roles:["USER"]})};
    const reqContext=context({authorization:"Bearer valid"});
    const allowed=await new AuthGuard(jwt as any,reflector as any,db as any).canActivate(reqContext);
    expect(allowed).toBe(true);
    expect(reqContext.switchToHttp().getRequest().user.id).toBe("user-1");
  });
});
