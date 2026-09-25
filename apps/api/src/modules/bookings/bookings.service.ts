import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { calculatePrice, datesOverlap, isHoldStatus, transitionBooking, rwf } from "@imizi/domain";
import type { UserRecord, PlatformStore } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

type BookingInput={listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string};

@Injectable()
export class BookingsService {
  constructor(private readonly source:DatabaseService|PlatformStore){}

  private db():DatabaseService {
    if(!(this.source instanceof DatabaseService)) throw new Error("BookingsService requires PostgreSQL mode for this operation");
    return this.source;
  }
  private store():PlatformStore {
    if(!(this.source instanceof Object) || this.source instanceof DatabaseService) throw new Error("BookingsService requires test-store mode for this operation");
    return this.source as PlatformStore;
  }

  quote(listingId:string,startDate:string,endDate:string){
    if(this.source instanceof DatabaseService) return this.quoteProduction(listingId,startDate,endDate);
    const store=this.store();
    const listing=store.listings.get(listingId);
    if(!listing)throw new NotFoundException();
    const start=new Date(startDate),end=new Date(endDate);
    if(!(end>start))throw new BadRequestException("Invalid date range");
    const nights=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},serviceFeeBps:250,nights:listing.listingType==="SHORT_STAY"?nights:1});
  }

  private async quoteProduction(listingId:string,startDate:string,endDate:string){
    const db=this.db();
    const listing=await db.getListing(listingId);
    if(!listing)throw new NotFoundException();
    const start=new Date(startDate),end=new Date(endDate);
    if(!(end>start))throw new BadRequestException("Invalid date range");
    const nights=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},serviceFeeBps:250,nights:listing.listingType==="SHORT_STAY"?nights:1});
  }

  create(user:UserRecord,input:BookingInput){
    if(this.source instanceof DatabaseService) return this.createProduction(user,input);
    return this.createLegacy(user,input);
  }

  private async createProduction(user:UserRecord,input:BookingInput){
    const db=this.db();
    const listing=await db.getListing(input.listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    if(listing.listingType==="SALE")throw new BadRequestException("Sale listings require an offer, not a rental booking.");
    if(new Date(input.startDate)<new Date(listing.availableFrom))throw new BadRequestException("Selected start date is before listing availability.");
    const quote=await this.quoteProduction(input.listingId,input.startDate,input.endDate);
    let booking;
    try{
      booking=await db.createBooking({listingId:listing.id,unitId:input.unitId,tenantId:user.id,startDate:input.startDate,endDate:input.endDate,amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey});
    }catch(error){
      if((error as {code?:string}).code==="23P01")throw new BadRequestException("Dates overlap an existing reservation");
      throw error;
    }
    return {booking,quote};
  }

  private createLegacy(user:UserRecord,input:BookingInput){
    const store=this.store();
    const listing=store.listings.get(input.listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    const start=new Date(input.startDate),end=new Date(input.endDate);
    for(const booking of store.bookings.values()){
      if(!isHoldStatus(booking.status as any))continue;
      const sameUnit=Boolean(input.unitId)&&booking.unitId===input.unitId;
      const sameListing=!input.unitId&&booking.listingId===listing.id;
      if((sameUnit||sameListing)&&datesOverlap(start,end,new Date(booking.startDate),new Date(booking.endDate)))throw new BadRequestException("Dates overlap an existing reservation");
    }
    const quote=this.quote(input.listingId,input.startDate,input.endDate) as any;
    const booking:any={id:store.id(),listingId:listing.id,unitId:input.unitId,tenantId:user.id,status:"PAYMENT_PENDING",startDate:input.startDate,endDate:input.endDate,amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey,createdAt:store.now()};
    store.bookings.set(booking.id,booking);
    return {booking,quote};
  }

  confirmFromPayment(bookingId:string){
    if(this.source instanceof DatabaseService) return this.confirmProduction(bookingId);
    const store=this.store();
    const booking=store.bookings.get(bookingId);
    if(!booking)throw new NotFoundException();
    booking.status=transitionBooking(booking.status as any,"CONFIRMED");
    return booking;
  }

  private async confirmProduction(bookingId:string){
    const db=this.db();
    const booking=await db.getBooking(bookingId);
    if(!booking)throw new NotFoundException();
    return db.getBooking(bookingId);
  }
}
