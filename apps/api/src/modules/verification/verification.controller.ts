import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("verification")
@Controller("verification")
export class VerificationController {
  constructor(private readonly features:FeatureService){}
  @ApiBearerAuth()
  @Post()
  submit(@CurrentUser() user:UserRecord,@Body() body:{subjectType:string;subjectId:string;kind:string;evidence?:unknown}){return this.features.submitVerification(user.id,body);}
  @ApiBearerAuth()
  @Post(":id/decide")
  decide(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{accept:boolean}){
    if(!user.roles.includes("VERIFICATION_AGENT")&&!user.roles.includes("SUPER_ADMIN")&&!user.roles.includes("ADMIN"))return{error:"forbidden"};
    return this.features.decideVerification(user.id,id,body.accept);
  }
  @Get() list(){return this.features.listVerifications();}
}
