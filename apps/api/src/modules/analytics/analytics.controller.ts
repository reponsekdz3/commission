import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly features:FeatureService){}
  @Public()
  @Post("events") track(@Body() body:{name:string;propertyId?:string;payload?:Record<string,unknown>},@CurrentUser() user?:UserRecord){return this.features.track(body.name,user?.id,body.propertyId,body.payload ?? {});}
  @Public()
  @Get("platform") platform(){return this.features.platformAnalytics();}
  @ApiBearerAuth()
  @Get("landlord") landlord(@CurrentUser() user:UserRecord){return this.features.landlordAnalytics(user.id);}
}
