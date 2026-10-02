import { Body, Controller, ForbiddenException, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { z } from "zod";
import { Throttle } from "@nestjs/throttler";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly features:FeatureService){}
  @Public()
  @Throttle({default:{limit:60,ttl:60000}})
  @Post("events")
  track(@Body() body:unknown,@CurrentUser() user?:UserRecord){
    const d=z.object({name:z.string().trim().min(1).max(100),propertyId:z.string().uuid().optional(),payload:z.record(z.string(),z.unknown()).default({})}).parse(body);
    if(JSON.stringify(d.payload).length>12000)throw new ForbiddenException("Analytics payload too large");
    return this.features.track(d.name,user?.id,d.propertyId,d.payload);
  }
  @ApiBearerAuth()
  @Get("platform")
  platform(@CurrentUser() user:UserRecord){
    if(!["SUPER_ADMIN","ADMIN","FINANCE_ADMIN"].some(r=>user.roles.includes(r as any)))throw new ForbiddenException("Platform analytics access required");
    return this.features.platformAnalytics();
  }
  @ApiBearerAuth()
  @Get("landlord")
  landlord(@CurrentUser() user:UserRecord){return this.features.landlordAnalytics(user.id);}
}
