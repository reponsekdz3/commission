import { Controller, ForbiddenException, Get, Param, Post, StreamableFile } from "@nestjs/common";
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
  }  @Post(":id/sign") async sign(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.signLease(user.id,id);}
  @Get(":id/pdf") async pdf(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const buffer=await this.features.leasePdf(user.id,id);
    if(!buffer)throw new ForbiddenException("Lease access denied");
    return new StreamableFile(buffer,{type:"application/pdf",disposition:"attachment; filename=\"lease-"+id+".pdf\""});
  }

}
