import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { calculatePrice, rwf } from "@imizi/domain";
import type { UserRecord } from "../../store/records";
import { DatabaseService } from "../../infra/database.service";

type BookingInput={listingId:string;unitId?:string;startDate:string;endDate:string;guests?:number;idempotencyKey:string};

@Injectable()
export class BookingsService {
  constructor(private readonly db:DatabaseService){}

  async quote(listingId:string,startDate:string,endDate:string){
    const listing=await this.db.getListing(listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    const property=await this.db.getProperty(listing.propertyId);
    if(!property||property.status!=="PUBLISHED"||listing.status!=="ACTIVE")throw new NotFoundException("Listing not available");
    const start=new Date(startDate),end=new Date(endDate);
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||!(end>start))throw new BadRequestException("Invalid date range");
    if(start<new Date(listing.availableFrom))throw new BadRequestException("Selected start date is before listing availability.");
    const nights=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));
    const sale=listing.listingType==="SALE";
    return calculatePrice({
      base:{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},
      deposit:sale?rwf(0):{amountMinor:listing.priceMinor,currency:listing.currency as "RWF"},
      serviceFeeBps:250,
      nights:listing.listingType==="SHORT_STAY"?nights:1,
    });
  }

  async create(user:UserRecord,input:BookingInput){
    const listing=await this.db.getListing(input.listingId);
    if(!listing)throw new NotFoundException("Listing not found");
    const property=await this.db.getProperty(listing.propertyId);
    if(!property||property.status!=="PUBLISHED"||listing.status!=="ACTIVE")throw new NotFoundException("Listing not available");
    if(listing.listingType==="SALE")throw new BadRequestException("Sale listings require an offer, not a rental booking.");
    if(input.unitId){
      const unit=await this.db.getUnit(input.unitId);
      if(!unit || unit.propertyId!==listing.propertyId)throw new BadRequestException("Selected unit does not belong to the listing property.");
    }
    const quote=await this.quote(input.listingId,input.startDate,input.endDate);
    try{
      const booking=await this.db.createBooking({
        listingId:listing.id,unitId:input.unitId,tenantId:user.id,startDate:input.startDate,endDate:input.endDate,
        amountMinor:quote.total.amountMinor,depositMinor:quote.deposit.amountMinor,currency:listing.currency,idempotencyKey:input.idempotencyKey,
      });
      return {booking,quote};
    }catch(error){
      if((error as {code?:string}).code==="23P01")throw new BadRequestException("Dates overlap an existing reservation");
      throw error;
    }
  }

  async confirmFromPayment(bookingId:string){
    const booking=await this.db.getBooking(bookingId);
    if(!booking)throw new NotFoundException("Booking not found");
    return booking;
  }
}
