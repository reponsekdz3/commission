import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createListingSchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { DatabaseService } from "../../infra/database.service";
import { UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";

@ApiTags("listings")
@Controller()
export class ListingsController {
  constructor(private readonly db:DatabaseService){}

  @ApiBearerAuth()
  @Post("listings")
  async create(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=createListingSchema.parse(body);
    const property=await this.db.getProperty(data.propertyId);
    if(!property) return {error:"not_found"};
    assertPropertyAccess(user,property,true);
    return this.db.createListing({propertyId:data.propertyId,unitId:data.unitId,listingType:data.listingType,priceMinor:data.priceMinor,currency:data.currency,availableFrom:data.availableFrom ?? new Date().toISOString()});
  }

  @Public()
  @Get("listings/:id")
  async get(@Param("id") id:string){const listing=await this.db.getListing(id);if(!listing)return{error:"not_found"};return{listing,property:await this.db.getProperty(listing.propertyId)};}

  @Public()
  @Get("units/:id")
  async unit(@Param("id") id:string){return (await this.db.getUnit(id)) ?? {error:"not_found"};}
}
