import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/current-user.decorator";
import { UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly db:DatabaseService){}
  @Throttle({upload:{limit:15,ttl:60000}})
  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;filename:string;contentType:string;kind:"PHOTO"|"VIDEO"|"DOCUMENT"}){
    const property=await this.db.getProperty(body.propertyId);if(!property)return{error:"not_found"};assertPropertyAccess(user,property,true);
    const allowed=["image/jpeg","image/png","image/webp","video/mp4","application/pdf"];if(!allowed.includes(body.contentType))return{error:"file_type_rejected"};
    const safeName=body.filename.replace(/[^a-zA-Z0-9._-]/g,"_");
    const key="property/"+body.propertyId+"/original/"+Date.now()+"-"+safeName;
    return{uploadUrl:"https://storage.local/upload/"+encodeURIComponent(key),key,publicUrl:null,private:body.kind==="DOCUMENT",note:"Set S3-compatible STORAGE endpoint to enable real presigned uploads."};
  }
  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;key:string;kind:"PHOTO"|"VIDEO"|"TOUR_360"|"FLOOR_PLAN"}){
    const property=await this.db.getProperty(body.propertyId);if(!property)return{error:"not_found"};assertPropertyAccess(user,property,true);
    await this.db.addMedia(body.propertyId,body.kind,body.key);
    return (await this.db.hydrateProperty(body.propertyId))?.media ?? [];
  }
}
