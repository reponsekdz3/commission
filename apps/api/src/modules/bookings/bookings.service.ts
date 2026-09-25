import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { calculateCommission, calculatePrice, datesOverlap, isHoldStatus, transitionBooking, rwf } from "@imizi/domain";
import { loadConfig } from "@imizi/config";
import type { UserRecord, PlatformStore } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class BookingsService {
  constructor(private readonly source:DatabaseService|PlatformStore){}

  quote(listingId:string,startDate:string,endDate:string){
    if(this.source instanceof DatabaseService) return this.quoteProduction(listingId,startDate,endDate);
    const listing=this.source.listings.get(listingId);
    if(!listing)throw new NotFoundException();
    const start=new Date(startDate),end=new Date(endDate);
    if(!(end>start))throw new BadRequestException("Invalid date range");
    const nights=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},serviceFeeBps:250,nights:listing.listingType==="SHORT_STAY"?nights:1});
  }

  private async quoteProduction(listingId:string,startDate:string,endDate:string){
    const listing=await this.source.getListing(listingId);
    if(!listing)throw new NotFoundException();
    const start=new Date(startDate),end=new Date(endDate);
    if(!(end>start))throw new BadRequestException("Invalid date range");
    const nights=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},serviceFeeBps:250,nights:listing.listingType==="SHORT_STAY"?nights:1});
  }

  create(user:UserRecord,input:{listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string}){
    if(this.source instanceof DatabaseService) return this.createProduction(user,input);
    return this.createLegacy(user,input);
  }

  private async createProduction(user:UserRecord,input:{listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string}){
    const listing=await this.source.getListing(input.listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    if(listing.listingType==="SALE")throw new BadRequestException("Sale listings require an offer, not a rental booking.");
    if(new Date(input.startDate)<new Date(listing.availableFrom))throw new BadRequestException("Selected start date is before listing availability.");
    const quote=await this.quoteProduction(input.listingId,input.startDate,input.endDate);
    let booking;
    try{
      booking=await this.source.createBooking({listingId:listing.id,unitId:input.unitId,tenantId:user.id,startDate:input.startDate,endDate:input.endDate,amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey});
    }catch(error){
      if((error as {code?:string}).code==="23P01")throw new BadRequestException("Dates overlap an existing reservation");
      throw error;
    }
    return {booking,quote};
  }

  private createLegacy(user:UserRecord,input:{listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string}){
    const listing=this.source.listings.get(input.listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    const start=new Date(input.startDate),end=new Date(input.endDate);
    for(const booking of this.source.bookings.values()){
      if(!isHoldStatus(booking.status as any))continue;
      const sameUnit=Boolean(input.unitId)&&booking.unitId===input.unitId;
      const sameListing=!input.unitId&&booking.listingId===listing.id;
      if((sameUnit||sameListing)&&datesOverlap(start,end,new Date(booking.startDate),new Date(booking.endDate)))throw new BadRequestException("Dates overlap an existing reservation");
    }
    const quote=this.quote(input.listingId,input.startDate,input.endDate) as any;
    const booking:any={id:this.source.id(),listingId:listing.id,unitId:input.unitId,tenantId:user.id,status:"PAYMENT_PENDING",startDate:input.startDate,endDate:input.endDate,amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey,createdAt:this.source.now()};
    this.source.bookings.set(booking.id,booking);
    return {booking,quote};
  }

  confirmFromPayment(bookingId:string){
    if(this.source instanceof DatabaseService) return this.confirmProduction(bookingId);
    const booking=this.source.bookings.get(bookingId);
    if(!booking)throw new NotFoundException();
    booking.status=transitionBooking(booking.status as any,"CONFIRMED");
    return booking;
  }

  private async confirmProduction(bookingId:string){
    const booking=await this.source.getBooking(bookingId);
    if(!booking)throw new NotFoundException();
    return this.source.getBooking(bookingId);
  }
}
