import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createPaymentGateway } from "@imizi/payments";
import { paymentIsAuthoritative, transitionPayment } from "@imizi/domain";
import { UserRecord } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class PaymentsService {
  private readonly gateway=createPaymentGateway(process.env as Record<string,string|undefined>);
  constructor(private readonly db:DatabaseService){}

  async initiate(user:UserRecord,input:{bookingId?:string;provider:string;msisdn?:string;idempotencyKey:string}){
    if(!input.bookingId)throw new NotFoundException("Booking required");
    const booking=await this.db.getBooking(input.bookingId);if(!booking)throw new NotFoundException("Booking required");
    if(booking.tenantId!==user.id)throw new UnauthorizedException("You do not own this booking");
    const provider=this.gateway.resolve(input.provider);
    const intent=await this.db.createPaymentIntent({
      id:crypto.randomUUID(),bookingId:booking.id,payerId:user.id,provider:provider.name,amountMinor:booking.amountMinor,
      currency:booking.currency,status:transitionPayment("CREATED","INITIATED"),internalReference:"IMZ_"+booking.id.slice(0,8),idempotencyKey:input.idempotencyKey,
    });
    if(intent.status==="SUCCEEDED")return intent;
    try{
      const charged=await provider.charge({amount:{amountMinor:booking.amountMinor,currency:booking.currency as "RWF"},msisdn:input.msisdn,idempotencyKey:input.idempotencyKey,internalReference:intent.internalReference,description:"Imizi booking "+booking.id,metadata:{bookingId:booking.id}});
      const updated=await this.db.updatePaymentIntent(intent.id,{providerReference:charged.providerReference,status:charged.status,completedAt:charged.status==="SUCCEEDED"?new Date().toISOString():undefined});
      if(updated && paymentIsAuthoritative(true,charged.status as any)) await this.db.settlePayment(intent.id);
      return updated;
    }catch(error){
      await this.db.updatePaymentIntent(intent.id,{status:"FAILED"});
      throw error;
    }
  }

  async handleWebhook(providerName:string,headers:Record<string,string|string[]|undefined>,rawBody:string){
    const provider=this.gateway.resolve(providerName);
    if(!provider.verifyWebhook(headers,rawBody))throw new UnauthorizedException("Invalid webhook signature");
    const parsed=provider.parseWebhook(rawBody);
    const intent=await this.db.getPaymentByProviderReference(parsed.providerReference);if(!intent)throw new NotFoundException();
    await this.db.addPaymentEvent(intent.id,parsed);
    if(parsed.status==="SUCCEEDED")return this.db.settlePayment(intent.id);
    return this.db.updatePaymentIntent(intent.id,{status:parsed.status});
  }

  async refund(intentId:string,amountMinor:number,reason:string){return this.db.refundPayment(intentId,amountMinor,reason);}
}
