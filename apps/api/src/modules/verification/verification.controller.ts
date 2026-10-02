import { Body, Controller, ForbiddenException, Get, Param, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { DatabaseService } from "../../infra/database.service";
import { assertPropertyAccess } from "../../common/access";
import { z } from "zod";
const submitSchema=z.object({subjectType:z.enum(["PROPERTY","USER","LISTING"]),subjectId:z.string().uuid(),kind:z.string().trim().min(1).max(80),evidence:z.unknown().optional()});
@ApiTags("verification") @ApiBearerAuth() @Controller("verification")
export class VerificationController{
  constructor(private readonly features:FeatureService,private readonly db:DatabaseService){}
  @Post()
  async submit(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=submitSchema.parse(body);
    if(d.subjectType==="USER"){if(d.subjectId!==user.id&&!["SUPER_ADMIN","ADMIN"].some(r=>user.roles.includes(r as any)))throw new ForbiddenException("Cannot submit verification for another user");}
    else if(d.subjectType==="PROPERTY"){const property=await this.db.getProperty(d.subjectId);if(!property)throw new BadRequestException("Property not found");assertPropertyAccess(user,property,true);}
    else{const listing=await this.db.getListing(d.subjectId);if(!listing)throw new BadRequestException("Listing not found");const property=await this.db.getProperty(listing.propertyId);if(!property)throw new BadRequestException("Property not found");assertPropertyAccess(user,property,true);}
    return this.features.submitVerification(user.id,d);
  }
  @Post(":id/decide") decide(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:unknown){
    if(!["VERIFICATION_AGENT","SUPER_ADMIN","ADMIN"].some(r=>user.roles.includes(r as any)))throw new ForbiddenException("Verification access required");
    return this.features.decideVerification(user.id,id,z.object({accept:z.boolean()}).parse(body).accept);
  }
  @Get() list(@CurrentUser() user:UserRecord){
    if(!["VERIFICATION_AGENT","SUPER_ADMIN","ADMIN"].some(r=>user.roles.includes(r as any)))throw new ForbiddenException("Verification access required");
    return this.features.listVerifications();
  }
}
