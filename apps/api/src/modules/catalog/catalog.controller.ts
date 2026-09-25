import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { estimateMonthlyPayment, hasPermission } from "@imizi/domain";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly features:FeatureService){}
  @Public() @Get("config")
  config(){return{currencies:["RWF","USD","KES","UGX","TZS"],locales:["rw","en","fr"],countries:["RW","UG","KE","TZ"],defaultCurrency:"RWF",defaultTimezone:"Africa/Kigali",amenities:["water","electricity","internet","security","parking","furnished","generator","water_tank"],propertyTypes:["HOUSE","APARTMENT","APARTMENT_BUILDING","VILLA","STUDIO","OFFICE","SHOP","WAREHOUSE","LAND","MIXED_USE"],rwandaAdmin:{provinces:["Kigali","Northern","Southern","Eastern","Western"],districts:["Nyarugenge","Gasabo","Kicukiro","Musanze","Rubavu","Huye"]},commissionBps:Number(process.env.PLATFORM_COMMISSION_BPS ?? 500)};}
  @Public() @Post("mortgage/estimate") mortgage(@Body() body:{priceMinor:number;downPaymentMinor:number;annualRateBps?:number;termMonths?:number}){return estimateMonthlyPayment({priceMinor:body.priceMinor,downPaymentMinor:body.downPaymentMinor,annualRateBps:body.annualRateBps ?? 1600,termMonths:body.termMonths ?? 240});}
  @ApiBearerAuth() @Get("saved-searches") saved(@CurrentUser() user:UserRecord){return this.features.listSavedSearches(user.id);}
  @ApiBearerAuth() @Post("saved-searches") save(@CurrentUser() user:UserRecord,@Body() body:{name:string;criteria:Record<string,unknown>}){return this.features.saveSearch(user.id,body.name,body.criteria);}
  @Public() @Get("compare") compare(){return this.features.compare();}
  @ApiBearerAuth() @Get("admin/settings") settings(@CurrentUser() user:UserRecord){if(!hasPermission(user.roles,"admin:access"))return{error:"forbidden"};return{commissionsBps:Number(process.env.PLATFORM_COMMISSION_BPS ?? 500),environments:["development","staging","production"],backups:{daily:true,pitr:true,offsite:true}};}
}
