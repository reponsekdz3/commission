import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { Public } from "../../common/public.decorator";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("recommendations")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly features:FeatureService){}
  @Public() @Get() list(@CurrentUser() user?:UserRecord){return this.features.recommendations(user?.id);}
}
