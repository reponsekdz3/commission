import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { offerSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("offers")
@ApiBearerAuth()
@Controller("offers")
export class OffersController {
  constructor(private readonly features:FeatureService){}
  @Post() create(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.features.createOffer(user.id,offerSchema.parse(body));}
  @Post(":id/respond")
  respond(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{action:"ACCEPT"|"REJECT"|"COUNTER";amountMinor?:number}){return this.features.respondOffer(user.id,id,body.action,body.amountMinor);}
  @Get() list(@CurrentUser() user:UserRecord){return this.features.listOffers(user.id);}
}
