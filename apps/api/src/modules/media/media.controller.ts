import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService){}
  @Throttle({upload:{limit:15,ttl:60000}})
  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;filename:string;contentType:string;kind:"PHOTO"|"VIDEO"|"DOCUMENT"}){
    const property=await this.db.getProperty(body.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    const allowed=["image/jpeg","image/png","image/webp","video/mp4","application/pdf"];
    if(!allowed.includes(body.contentType))return{error:"file_type_rejected"};
    const safeName=body.filename.replace(/[^a-zA-Z0-9._-]/g,"_");
    const prefix=body.kind==="DOCUMENT"?"private/":"public/";
    const key="property/"+body.propertyId+"/original/"+Date.now()+"-"+safeName;
    return {...this.storage.presignedPut(prefix+key,body.contentType),private:body.kind==="DOCUMENT"};
  }

  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;key:string;kind:"PHOTO"|"VIDEO"|"TOUR_360"|"FLOOR_PLAN"}){
    const property=await this.db.getProperty(body.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    if(body.key.includes("..")||body.key.includes("/")===false)return{error:"invalid_key"};
    const media=await this.db.addMedia(body.propertyId,body.kind,body.key);
    await this.db.enqueueJob("media.process",{mediaId:media.id});
    return (await this.db.hydrateProperty(body.propertyId))?.media ?? [];
  }
}
