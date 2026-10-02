import { Body, Controller, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";
import { loadConfig } from "@imizi/config";
import { z } from "zod";
const mediaRequestSchema=z.object({propertyId:z.string().uuid(),filename:z.string().trim().min(1).max(180),contentType:z.string().trim().toLowerCase().max(100),kind:z.enum(["PHOTO","VIDEO","TOUR_360","FLOOR_PLAN"])});
const allowedByKind:Record<string,string[]>={
  PHOTO:["image/jpeg","image/png","image/webp"],VIDEO:["video/mp4"],TOUR_360:["image/jpeg","image/png","image/webp"],FLOOR_PLAN:["image/jpeg","image/png","image/webp","application/pdf"],
};
@ApiTags("media") @ApiBearerAuth() @Controller("media")
export class MediaController {
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService){}
  @Throttle({upload:{limit:15,ttl:60000}}) @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=mediaRequestSchema.parse(body); const property=await this.db.getProperty(d.propertyId); if(!property)throw new BadRequestException("Property not found");
    assertPropertyAccess(user,property,true);
    if(!(allowedByKind[d.kind]??[]).includes(d.contentType))throw new BadRequestException("file_type_rejected");
    const maxBytes=d.kind==="VIDEO"?loadConfig().maxMediaBytes:Math.min(loadConfig().maxMediaBytes,50*1024*1024);
    const safeName=d.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
    const key="public/property/"+d.propertyId+"/original/"+Date.now()+"-"+safeName;
    return {...this.storage.presignedPut(key,d.contentType),maxBytes,kind:d.kind};
  }
  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=z.object({propertyId:z.string().uuid(),key:z.string().min(10).max(1000),kind:z.enum(["PHOTO","VIDEO","TOUR_360","FLOOR_PLAN"])}).parse(body);
    const property=await this.db.getProperty(d.propertyId); if(!property)throw new BadRequestException("Property not found");
    assertPropertyAccess(user,property,true); const expectedPrefix="public/property/"+d.propertyId+"/original/";
    if(!d.key.startsWith(expectedPrefix)||d.key.includes(".."))throw new BadRequestException("invalid_key");
    const meta=await this.storage.headObject(d.key); const actualType=meta.contentType?.split(";")[0].trim().toLowerCase();
    if(!actualType||!(allowedByKind[d.kind]??[]).includes(actualType)){
      await this.storage.deleteObject(d.key).catch(()=>undefined);
      throw new BadRequestException("uploaded_content_type_rejected");
    }
    const maxBytes=d.kind==="VIDEO"?loadConfig().maxMediaBytes:Math.min(loadConfig().maxMediaBytes,50*1024*1024);
    if(meta.contentLength<=0||meta.contentLength>maxBytes){
      await this.storage.deleteObject(d.key).catch(()=>undefined);
      throw new BadRequestException("uploaded_media_size_rejected");
    }
    const media=await this.db.addMedia(d.propertyId,d.kind,d.key); await this.db.enqueueJob("media.process",{mediaId:media.id});
    return (await this.db.hydrateProperty(d.propertyId))?.media ?? [];
  }
}
