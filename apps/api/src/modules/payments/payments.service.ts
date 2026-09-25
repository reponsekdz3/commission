import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { createPaymentGateway } from "@imizi/payments";
import { paymentIsAuthoritative, transitionPayment } from "@imizi/domain";
import type { UserRecord } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class PaymentsService {
  private readonly gateway=createPaymentGateway(process.env as Record<string,string|undefined>);
  constructor(private readonly db:DatabaseService){}

  async initiate(user:UserRecord,input:{bookingId?:string;provider:string;msisdn?:string;idempotencyKey:string}){
    if(!input.bookingId)throw new NotFoundException("Booking required");
    const booking=await this.db.getBooking(input.bookingId);
    if(!booking)throw new NotFoundException("Booking required");
    if(booking.tenantId!==user.id)throw new UnauthorizedException("You do not own this booking");
    const provider=this.gateway.resolve(input.provider);
    const existing=await this.db.getPaymentByIdempotencyKey(input.idempotencyKey);
    if(existing){
      if(existing.payerId!==user.id || existing.bookingId!==booking.id || existing.provider!==provider.name) {
        throw new BadRequestException("Idempotency key is already bound to another payment");
      }
      return existing.status==="SUCCEEDED" ? this.db.settlePayment(existing.id) : existing;
    }
    const created=await this.db.createPaymentIntent({
      id:crypto.randomUUID(),bookingId:booking.id,payerId:user.id,provider:provider.name,amountMinor:booking.amountMinor,
      currency:booking.currency,status:transitionPayment("CREATED","INITIATED"),internalReference:"IMZ_"+booking.id.slice(0,8),idempotencyKey:input.idempotencyKey,
    });
    if(!created.created) return created.intent.status==="SUCCEEDED" ? this.db.settlePayment(created.intent.id) : created.intent;
    const intent=created.intent;
    try{
      const charged=await provider.charge({
        amount:{amountMinor:booking.amountMinor,currency:booking.currency as "RWF"},
        msisdn:input.msisdn,idempotencyKey:input.idempotencyKey,internalReference:intent.internalReference,
        description:"Imizi booking "+booking.id,metadata:{bookingId:booking.id},
      });
      if(paymentIsAuthoritative(true,charged.status as any)){
        await this.db.updatePaymentIntent(intent.id,{providerReference:charged.providerReference});
        return this.db.settlePayment(intent.id);
      }
      return this.db.updatePaymentIntent(intent.id,{providerReference:charged.providerReference,status:charged.status});
    }catch(error){
      await this.db.updatePaymentIntent(intent.id,{status:"FAILED"});
      throw error;
    }
  }

  async handleWebhook(providerName:string,headers:Record<string,string|string[]|undefined>,rawBody:string){
    const provider=this.gateway.resolve(providerName);
    if(!provider.verifyWebhook(headers,rawBody))throw new UnauthorizedException("Invalid webhook signature");
    const parsed=provider.parseWebhook(rawBody);
    const intent=await this.db.getPaymentByProviderReference(parsed.providerReference);
    if(!intent)throw new NotFoundException();
    await this.db.addPaymentEvent(intent.id,parsed);
    if(parsed.status==="SUCCEEDED"){
      await this.db.updatePaymentIntent(intent.id,{providerReference:parsed.providerReference});
      return this.db.settlePayment(intent.id);
    }
    return this.db.updatePaymentIntent(intent.id,{status:parsed.status});
  }

  async status(user:UserRecord,intentId:string){
    const intent=await this.db.getPaymentIntent(intentId);
    if(!intent)throw new NotFoundException("Payment not found");
    if(intent.payerId!==user.id && !user.roles.includes("FINANCE_ADMIN") && !user.roles.includes("SUPER_ADMIN")) {
      throw new UnauthorizedException("Payment access denied");
    }
    const provider=this.gateway.resolve(intent.provider);
    if(intent.status==="PENDING_PROVIDER" && provider.getStatus && intent.providerReference){
      const status=await provider.getStatus(intent.providerReference);
      if(status==="SUCCEEDED") return this.db.settlePayment(intent.id);
      return this.db.updatePaymentIntent(intent.id,{status});
    }
    return intent;
  }

  async refund(intentId:string,amountMinor:number,reason:string){
    if(!Number.isInteger(amountMinor) || amountMinor<=0)throw new BadRequestException("Refund amount must be positive");
    const intent=await this.db.getPaymentIntent(intentId);
    if(!intent)throw new NotFoundException("Payment not found");
    if(amountMinor>intent.amountMinor)throw new BadRequestException("Refund exceeds payment amount");
    return this.db.refundPayment(intentId,amountMinor,reason);
  }
}
