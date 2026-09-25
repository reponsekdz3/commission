import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { hasPermission } from "@imizi/domain";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly features:FeatureService){}
  private gate(user:UserRecord){return hasPermission(user.roles,"admin:access");}
  @Get("overview") overview(@CurrentUser() user:UserRecord){if(!this.gate(user))return{error:"forbidden"};return this.features.adminOverview();}
  @Get("users") users(@CurrentUser() user:UserRecord){if(!this.gate(user))return{error:"forbidden"};return this.features.adminUsers();}
  @Get("properties") properties(@CurrentUser() user:UserRecord){if(!this.gate(user))return{error:"forbidden"};return this.features.adminProperties();}
  @Get("audit") audit(@CurrentUser() user:UserRecord){if(!this.gate(user))return{error:"forbidden"};return this.features["db"].query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500").then((r:any)=>r.rows);}
  @Post("reports") report(@CurrentUser() user:UserRecord,@Body() body:{subjectType:string;subjectId:string;reason:string}){return this.features.report(user.id,body);}
  @Get("moderation") moderation(@CurrentUser() user:UserRecord){if(!this.gate(user))return{error:"forbidden"};return this.features.adminModeration();}
  @Post("properties/:id/risk") risk(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{level:string}){if(!this.gate(user))return{error:"forbidden"};return this.features.setRisk(user.id,id,body.level);}
}
