import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly features:FeatureService){}
  @ApiBearerAuth()
  @Post() create(@CurrentUser() user:UserRecord,@Body() body:{bookingId:string;rating:number;body?:string}){return this.features.createReview(user.id,body.bookingId,Number(body.rating),body.body ?? "");}
  @Get("property/:propertyId") list(@Param("propertyId") propertyId:string){return this.features.reviews(propertyId);}
}
