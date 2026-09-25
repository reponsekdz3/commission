import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("agencies")
@Controller("agencies")
export class AgenciesController {
  constructor(private readonly features:FeatureService){}
  @Public() @Get() list(){return this.features.agencies();}
  @ApiBearerAuth() @Get("dashboard") dashboard(@CurrentUser() user:UserRecord){return this.features.agencyDashboard(user.id);}
  @ApiBearerAuth() @Post() create(@CurrentUser() user:UserRecord,@Body() body:{name:string;slug:string}){return this.features.createAgency(user.id,body.name,body.slug);}
}
