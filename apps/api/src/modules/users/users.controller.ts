import { Controller, Get, Patch, Param, ForbiddenException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { profileUpdateSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../../infra/database.service";
import { requiresReauth } from "@imizi/domain";

@ApiTags("users") @ApiBearerAuth() @Controller("users")
export class UsersController {
  constructor(private readonly db:DatabaseService,private readonly auth:AuthService){}
  @Get("me") me(@CurrentUser()u:UserRecord){return this.auth.publicUser(u);}
  @Patch("me")
  async updateMe(@CurrentUser()u:UserRecord,@Body()b:unknown){
    const d=profileUpdateSchema.parse(b);
    const contactChanged=Boolean(d.phone||d.email);
    if(contactChanged&&requiresReauth("account:change-contact")){
      if(!d.reauthToken)return {requiresReauth:true,action:"account:change-contact"};
      const ok=await this.auth.consumeReauth(u,"account:change-contact",d.reauthToken);
      if(!ok)throw new ForbiddenException("Invalid or expired reauthentication token");
    }
    const next={...u,fullName:d.fullName??u.fullName,locale:d.locale??u.locale,phone:d.phone??u.phone,email:d.email?.toLowerCase()??u.email};
    const updated=await this.db.updateUser(next);
    return this.auth.publicUser(updated);
  }
  @Get(":id")
  get(@Param("id")id:string){return this.db.findUserById(id).then(u=>u?{id:u.id,fullName:u.fullName}:{error:"not_found"});}
}
