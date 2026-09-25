import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createBookingSchema } from "@imizi/validation";
import { transitionBooking } from "@imizi/domain";
import { CurrentUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { BookingsService } from "./bookings.service";
import { DatabaseService } from "../../infra/database.service";
import { UserRecord } from "../../store/platform.store";

@ApiTags("bookings")
@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookings:BookingsService,private readonly db:DatabaseService){}

  @ApiBearerAuth()
  @Get()
  mine(@CurrentUser() user:UserRecord){return this.db.listBookingsForUser(user.id,user.roles.includes("SUPER_ADMIN"));}

  @Public()
  @Post("quote")
  quote(@Body() body:{listingId:string;startDate:string;endDate:string}){return this.bookings.quote(body.listingId,body.startDate,body.endDate);}

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user:UserRecord,@Body() body:unknown){return this.bookings.create(user,createBookingSchema.parse(body));}

  @ApiBearerAuth()
  @Get(":id")
  async get(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const booking=await this.db.getBooking(id);if(!booking)return{error:"not_found"};
    const visible=(await this.db.listBookingsForUser(user.id,user.roles.includes("SUPER_ADMIN"))).some((b:any)=>b.id===id);
    if(!visible)throw new ForbiddenException("Booking access denied");
    return booking;
  }

  @ApiBearerAuth()
  @Post(":id/cancel")
  async cancel(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const booking=await this.db.getBooking(id);if(!booking)return{error:"not_found"};
    if(booking.tenantId!==user.id)throw new ForbiddenException("Booking access denied");
    return this.db.updateBookingStatus(id,transitionBooking(booking.status as any,"CANCELLED"));
  }
}

