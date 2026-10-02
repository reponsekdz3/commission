import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/records";
import { reviewSchema } from "@imizi/validation";
import { FeatureService } from "../../infra/feature.service";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly features:FeatureService){}
  @ApiBearerAuth()
  @Post() create(@CurrentUser() user:UserRecord,@Body() body:unknown){const d=reviewSchema.parse(body);return this.features.createReview(user.id,d.bookingId,d.rating,d.body ?? "");}
  @Get("property/:propertyId") list(@Param("propertyId") propertyId:string){return this.features.reviews(propertyId);}
}
