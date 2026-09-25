import { Injectable } from "@nestjs/common";
import { clampLimit, parseNaturalSearch } from "@imizi/domain";
import { DatabaseService } from "../../infra/database.service";

@Injectable()
export class SearchService {
  constructor(private readonly db:DatabaseService){}

  async search(query:Record<string,any>){
    const parsed=query.q ? parseNaturalSearch(String(query.q)) : undefined;
    const limit=clampLimit(query.limit ? Number(query.limit) : 20);
    const result=await this.db.searchListings({
      q:query.q,listingType:query.listingType ?? parsed?.listingType,propertyType:query.propertyType ?? parsed?.type,
      province:query.province, district:query.district ?? parsed?.locationText, sector:query.sector,
      bedroomsMin:query.bedroomsMin ?? parsed?.bedrooms,bedroomsMax:query.bedroomsMax,bathroomsMin:query.bathroomsMin,
      minPriceMinor:query.minPriceMinor,maxPriceMinor:query.maxPriceMinor ?? parsed?.maxPrice,currency:query.currency,
      amenities:query.amenities,verifiedOnly:Boolean(query.verifiedOnly),availableFrom:query.availableFrom,
      radiusKm:query.radiusKm,lat:query.lat == null ? undefined:Number(query.lat),lng:query.lng == null ? undefined:Number(query.lng),
      north:query.north == null ? undefined:Number(query.north),south:query.south == null ? undefined:Number(query.south),
      east:query.east == null ? undefined:Number(query.east),west:query.west == null ? undefined:Number(query.west),limit,
    });
    return {items:result,nextCursor:null,engine:"postgres+postgis"};
  }

  async suggest(q:string){
    const parsed=parseNaturalSearch(q);
    return {parsed,suggestions:["Kigali","Kicukiro","Gasabo","Musanze","Rubavu","Huye"]};
  }
}
