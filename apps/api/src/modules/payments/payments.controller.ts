import { Body, Controller, Headers, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { initiatePaymentSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { PaymentsService } from "./payments.service";
import type { UserRecord } from "../../store/platform.store";
import { requiresReauth } from "@imizi/domain";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments:PaymentsService){}

  @ApiBearerAuth()
  @Throttle({payments:{limit:10,ttl:60000}})
  @Post("intents")
  initiate(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.payments.initiate(user,initiatePaymentSchema.parse(body));}

  @Public()
  @Post("webhooks/:provider")
  webhook(@Param("provider") provider:string,@Headers() headers:Record<string,string>,@Req() req:{body:unknown}){
    return this.payments.handleWebhook(provider.toUpperCase()==="MTN"?"MTN_MOMO":provider.toUpperCase(),headers,JSON.stringify(req.body ?? {}));
  }

  @ApiBearerAuth()
  @Post(":intentId/status")
  status(@CurrentUser() user:UserRecord,@Param("intentId") intentId:string){return this.payments.status(user,intentId);}

  @ApiBearerAuth()
  @Post("refunds")
  refund(@CurrentUser() user:UserRecord,@Body() body:{intentId:string;amountMinor:number;reason?:string;reauthToken?:string}){
    if(!user.roles.includes("FINANCE_ADMIN")&&!user.roles.includes("SUPER_ADMIN"))return{error:"forbidden"};
    if(requiresReauth("payment:refund")&&!body.reauthToken)return{requiresReauth:true};
    return this.payments.refund(body.intentId,body.amountMinor,body.reason ?? "admin_refund");
  }
}
