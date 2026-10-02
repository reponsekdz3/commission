import { Body, Controller, Get, Post, ForbiddenException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { hasPermission } from "@imizi/domain";
import { z } from "zod";

const analyticsEventSchema = z.object({
  name: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_.:-]+$/),
  propertyId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
}).superRefine((value, ctx) => {
  if (JSON.stringify(value.payload).length > 8_192) {
    ctx.addIssue({ code: z.ZodIssueCode.too_big, maximum: 8192, type: "string", inclusive: true, path: ["payload"] });
  }
});

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly features:FeatureService){}

  @Public()
  @Post("events")
  track(@Body() body:unknown,@CurrentUser() user?:UserRecord){
    const data=analyticsEventSchema.parse(body);
    return this.features.track(data.name,user?.id,data.propertyId,data.payload);
  }

  @ApiBearerAuth()
  @Get("platform")
  platform(@CurrentUser() user:UserRecord){
    if(!hasPermission(user.roles,"admin:access"))throw new ForbiddenException("Admin access required");
    return this.features.platformAnalytics();
  }

  @ApiBearerAuth()
  @Get("landlord")
  landlord(@CurrentUser() user:UserRecord){
    return this.features.landlordAnalytics(user.id);
  }
}
