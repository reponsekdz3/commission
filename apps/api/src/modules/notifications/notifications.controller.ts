import { Body, Controller, Delete, Get, Patch, Post } from "@nestjs/common";
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
  @Post("push-token")
  pushToken(@CurrentUser() user:UserRecord,@Body() body:{token:string;platform:"ios"|"android"|"web"}){return this.features.registerPushToken(user.id,body.token,body.platform);}
  @Delete("push-token")
  deletePushToken(@CurrentUser() user:UserRecord,@Body() body:{token:string}){return this.features.removePushToken(user.id,body.token);}
  @Get("preferences")
  preferences(@CurrentUser() user:UserRecord){return this.features.notificationPreferences(user.id);}
  @Patch("preferences")
  updatePreferences(@CurrentUser() user:UserRecord,@Body() body:{pushEnabled?:boolean;smsEnabled?:boolean;emailEnabled?:boolean;inAppEnabled?:boolean}){return this.features.updateNotificationPreferences(user.id,body);}

}
