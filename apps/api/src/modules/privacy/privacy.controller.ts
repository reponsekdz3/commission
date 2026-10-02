import { Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { requiresReauth } from "@imizi/domain";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("privacy")
@ApiBearerAuth()
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly features:FeatureService,private readonly auth:AuthService){}
  @Get("export") async export(@CurrentUser() user:UserRecord){return{user:this.auth.publicUser(user),...(await this.features.privacyExport(user.id))};}
  @Post("delete")
  async delete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=z.object({reauthToken:z.string().min(32).max(128).optional()}).parse(body ?? {});
    if(requiresReauth("account:delete")){
      if(!d.reauthToken)return {requiresReauth:true,action:"account:delete"};
      if(!(await this.auth.consumeReauth(user,"account:delete",d.reauthToken)))throw new Error("Invalid or expired reauthentication token");
    }
    return this.features.deleteAccount(user.id);
  }
}
