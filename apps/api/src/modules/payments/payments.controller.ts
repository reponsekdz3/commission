import { Body, Controller, Headers, Param, Post, Req, ForbiddenException, type RawBodyRequest } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { initiatePaymentSchema, refundSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { PaymentsService } from "./payments.service";
import type { UserRecord } from "../../store/records";
import type { Request } from "express";
import { requiresReauth } from "@imizi/domain";
import { AuthService } from "../auth/auth.service";
import { assertPermission } from "../../common/access";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments:PaymentsService,private readonly auth:AuthService){}

  @ApiBearerAuth()
  @Throttle({payments:{limit:10,ttl:60000}})
  @Post("intents")
  initiate(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.payments.initiate(user,initiatePaymentSchema.parse(body));}

  @Public()
  @Post("webhooks/:provider")
  webhook(@Param("provider") provider:string,@Headers() headers:Record<string,string>,@Req() req:RawBodyRequest<Request>){
    return this.payments.handleWebhook(provider.toUpperCase()==="MTN"?"MTN_MOMO":provider.toUpperCase(),headers,req.rawBody?.toString("utf8") ?? JSON.stringify(req.body ?? {}));
  }

  @ApiBearerAuth()
  @Post(":intentId/status")
  status(@CurrentUser() user:UserRecord,@Param("intentId") intentId:string){return this.payments.status(user,intentId);}

  @ApiBearerAuth()
  @Post("refunds")
  async refund(@CurrentUser() user:UserRecord,@Body() body:unknown){
    assertPermission(user,"payment:refund");
    const d=refundSchema.parse(body);
    if(requiresReauth("payment:refund")){
      if(!d.reauthToken)return{requiresReauth:true,action:"payment:refund"};
      if(!(await this.auth.consumeReauth(user,"payment:refund",d.reauthToken)))return{error:"invalid_reauth"};
    }
    return this.payments.refund(d.intentId,d.amountMinor,d.reason ?? "admin_refund");
  }
}
