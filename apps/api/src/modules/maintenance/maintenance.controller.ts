import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("maintenance")
@ApiBearerAuth()
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly features:FeatureService){}
  @Post() create(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;title:string;description:string}){return this.features.createMaintenance(user.id,body);}
  @Get() list(@CurrentUser() user:UserRecord){return this.features.maintenance(user.id);}
  @Patch(":id") update(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{status:string}){return this.features.updateMaintenance(user.id,id,body.status);}
}
