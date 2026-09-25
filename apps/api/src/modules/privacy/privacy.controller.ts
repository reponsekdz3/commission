import { Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { AuthService } from "../auth/auth.service";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("privacy")
@ApiBearerAuth()
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly features:FeatureService,private readonly auth:AuthService){}
  @Get("export") async export(@CurrentUser() user:UserRecord){return{user:this.auth.publicUser(user),...(await this.features.privacyExport(user.id))};}
  @Post("delete") delete(@CurrentUser() user:UserRecord){return this.features.deleteAccount(user.id);}
}
