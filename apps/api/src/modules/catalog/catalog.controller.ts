import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/records";
import { FeatureService } from "../../infra/feature.service";
import { estimateMonthlyPayment, hasPermission } from "@imizi/domain";
import { LocationsService } from "./locations.service";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly features:FeatureService, private readonly locations:LocationsService){}
  @Public() @Get("config")
  async config(){return{currencies:["RWF","USD","KES","UGX","TZS"],locales:["rw","en","fr"],countries:["RW","UG","KE","TZ"],defaultCurrency:"RWF",defaultTimezone:"Africa/Kigali",amenities:["water","electricity","internet","security","parking","furnished","generator","water_tank"],propertyTypes:["HOUSE","APARTMENT","APARTMENT_BUILDING","VILLA","STUDIO","OFFICE","SHOP","WAREHOUSE","LAND","MIXED_USE"],rwandaAdmin:{levels:["PROVINCE","DISTRICT","SECTOR","CELL","VILLAGE"],source:"/locations/rwanda",provinces:await this.locations.list("PROVINCE")},commissionBps:Number(process.env.PLATFORM_COMMISSION_BPS ?? 500)};}
  @Public() @Post("mortgage/estimate") mortgage(@Body() body:{priceMinor:number;downPaymentMinor:number;annualRateBps?:number;termMonths?:number}){return estimateMonthlyPayment({priceMinor:body.priceMinor,downPaymentMinor:body.downPaymentMinor,annualRateBps:body.annualRateBps ?? 1600,termMonths:body.termMonths ?? 240});}
  @ApiBearerAuth() @Get("saved-searches") saved(@CurrentUser() user:UserRecord){return this.features.listSavedSearches(user.id);}
  @ApiBearerAuth() @Post("saved-searches") save(@CurrentUser() user:UserRecord,@Body() body:{name:string;criteria:Record<string,unknown>}){return this.features.saveSearch(user.id,body.name,body.criteria);}
  @ApiBearerAuth() @Delete("saved-searches/:id") remove(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.deleteSavedSearch(user.id,id);}
  @Public() @Get("compare") compare(@Query("ids") ids?:string){return this.features.compare(ids?.split(",").map(x=>x.trim()).filter(Boolean));}
  @ApiBearerAuth() @Get("admin/settings") settings(@CurrentUser() user:UserRecord){if(!hasPermission(user.roles,"admin:access"))return{error:"forbidden"};return{commissionsBps:Number(process.env.PLATFORM_COMMISSION_BPS ?? 500),environments:["development","staging","production"],backups:{daily:true,pitr:true,offsite:true}};}
}
