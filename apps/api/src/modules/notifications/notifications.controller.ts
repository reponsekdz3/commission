import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly features:FeatureService) {}
  @Get() list(@CurrentUser() user:UserRecord){return this.features.listNotifications(user.id);}
  @Patch("read-all") readAll(@CurrentUser() user:UserRecord){return this.features.readAllNotifications(user.id);}
  @Post("saved-searches") saveSearch(@CurrentUser() user:UserRecord,@Body() body:{name:string;criteria:Record<string,unknown>}){return this.features.saveSearch(user.id,body.name,body.criteria);}
  @Get("saved-searches") searches(@CurrentUser() user:UserRecord){return this.features.listSavedSearches(user.id);}
}
