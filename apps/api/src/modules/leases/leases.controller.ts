import { Controller, ForbiddenException, Get, Param } from "@nestjs/common";
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
  @Get(":id") async get(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const lease=await this.features.lease(id);
    if(!lease)return{error:"not_found"};
    if(!(await this.features.canAccessLease(user.id,id,user.roles)))throw new ForbiddenException("Lease access denied");
    return lease;
  }
}
