import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("leases")
@ApiBearerAuth()
@Controller("leases")
export class LeasesController {
  constructor(private readonly features:FeatureService){}
  @Get() mine(@CurrentUser() user:UserRecord){return this.features.leases(user.id);}
  @Get(":id") async get(@Param("id") id:string){return (await this.features.lease(id)) ?? {error:"not_found"};}
}
