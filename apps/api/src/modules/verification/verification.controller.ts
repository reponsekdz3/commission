import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private readonly features:FeatureService){}
  @Post() submit(@CurrentUser() user:UserRecord,@Body() body:{subjectType:string;subjectId:string;kind:string;evidence?:unknown}){return this.features.submitVerification(user.id,body);}
  @Post(":id/decide")
  decide(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{accept:boolean}){
    if(!user.roles.includes("VERIFICATION_AGENT")&&!user.roles.includes("SUPER_ADMIN")&&!user.roles.includes("ADMIN"))throw new ForbiddenException("Verification access required");
    return this.features.decideVerification(user.id,id,body.accept);
  }
  @Get()
  list(@CurrentUser() user:UserRecord){
    if(!user.roles.includes("VERIFICATION_AGENT")&&!user.roles.includes("SUPER_ADMIN")&&!user.roles.includes("ADMIN"))throw new ForbiddenException("Verification access required");
    return this.features.listVerifications();
  }
}
