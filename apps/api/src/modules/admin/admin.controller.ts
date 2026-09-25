import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { hasPermission } from "@imizi/domain";
import { FeatureService } from "../../infra/feature.service";
import { DatabaseService } from "../../infra/database.service";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly features:FeatureService,private readonly db:DatabaseService){}
  private gate(user:UserRecord){if(!hasPermission(user.roles,"admin:access"))throw new ForbiddenException("Admin access required");}
  @Get("overview") overview(@CurrentUser() user:UserRecord){this.gate(user);return this.features.adminOverview();}
  @Get("users") users(@CurrentUser() user:UserRecord){this.gate(user);return this.features.adminUsers();}
  @Get("properties") properties(@CurrentUser() user:UserRecord){this.gate(user);return this.features.adminProperties();}
  @Get("audit") audit(@CurrentUser() user:UserRecord){this.gate(user);return this.db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500").then((r)=>r.rows);}
  @Post("reports") report(@CurrentUser() user:UserRecord,@Body() body:{subjectType:string;subjectId:string;reason:string}){this.gate(user);return this.features.report(user.id,body);}
  @Get("moderation") moderation(@CurrentUser() user:UserRecord){this.gate(user);return this.features.adminModeration();}
  @Post("properties/:id/risk") risk(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{level:string}){this.gate(user);return this.features.setRisk(user.id,id,body.level);}
}
