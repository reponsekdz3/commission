import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("viewings")
@ApiBearerAuth()
@Controller("viewings")
export class ViewingsController {
  constructor(private readonly features:FeatureService){}
  @Get("slots/:listingId") slots(@Param("listingId") listingId:string){return this.features.viewingSlots(listingId);}
  @Post() request(@CurrentUser() user:UserRecord,@Body() body:{listingId:string;slotStart:string}){return this.features.requestViewing(user.id,body.listingId,body.slotStart);}
  @Post(":id/decide") decide(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{accept:boolean}){return this.features.decideViewing(user.id,id,body.accept);}
}
