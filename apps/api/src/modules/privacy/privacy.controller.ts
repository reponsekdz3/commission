import { Body, Controller, ForbiddenException, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { AuthService } from "../auth/auth.service";
import { FeatureService } from "../../infra/feature.service";
import { requiresReauth } from "@imizi/domain";
import { z } from "zod";

@ApiTags("privacy")
@ApiBearerAuth()
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly features:FeatureService,private readonly auth:AuthService){}
  @Get("export") async export(@CurrentUser() user:UserRecord){return{user:this.auth.publicUser(user),...(await this.features.privacyExport(user.id))};}
  @Post("delete")
  async delete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=z.object({reauthToken:z.string().min(32).max(128)}).parse(body);
    if(requiresReauth("property:delete")){
      const ok=await this.auth.consumeReauth(user,"property:delete",data.reauthToken);
      if(!ok)throw new ForbiddenException("Valid reauthentication is required before account deletion");
    }
    return this.features.deleteAccount(user.id);
  }
}
