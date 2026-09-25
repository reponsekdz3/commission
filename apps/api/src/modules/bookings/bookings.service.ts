import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { calculateCommission, calculatePrice, transitionBooking, rwf } from "@imizi/domain";
import { loadConfig } from "@imizi/config";
import { UserRecord } from "../../store/platform.store";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class BookingsService {
  constructor(private readonly db:DatabaseService){}

  async quote(listingId:string,startDate:string,endDate:string){
    const listing=await this.db.getListing(listingId);if(!listing)throw new NotFoundException();
    const start=new Date(startDate),end=new Date(endDate);
    if(!(end>start)) throw new BadRequestException("Invalid date range");
    const days=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},serviceFeeBps:250,nights:listing.listingType==="SHORT_STAY"?days:1});
  }

  async create(user:UserRecord,input:{listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string}){
    const listing=await this.db.getListing(input.listingId);if(!listing)throw new NotFoundException("Listing not found");
    const quote=await this.quote(input.listingId,input.startDate,input.endDate);
    const booking=await this.db.createBooking({listingId:listing.id,unitId:input.unitId,tenantId:user.id,startDate:input.startDate,endDate:input.endDate,amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey});
    await this.db.trackEvent("booking_started",user.id,undefined,{bookingId:booking.id});
    return {booking,quote};
  }

  async confirmFromPayment(bookingId:string){
    const booking=await this.db.getBooking(bookingId);if(!booking)throw new NotFoundException();
    if(booking.status!=="PAYMENT_PENDING" && booking.status!=="PENDING") return booking;
    return this.db.settlePaymentByBooking(bookingId);
  }
}
