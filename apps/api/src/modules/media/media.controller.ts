import { randomUUID } from "crypto";
import { Body, Controller, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { assertPermission, assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";
import { loadConfig } from "@imizi/config";
import { z } from "zod";

const mediaRequestSchema=z.object({
  propertyId:z.string().uuid(),
  filename:z.string().trim().min(1).max(180),
  contentType:z.string().trim().toLowerCase().max(120),
  kind:z.enum(["PHOTO","VIDEO","TOUR_360","FLOOR_PLAN"]),
});

const allowedByKind:Record<string,string[]>={
  PHOTO:["image/jpeg","image/png","image/webp"],
  VIDEO:["video/mp4","video/quicktime"],
  TOUR_360:["image/jpeg","image/png","image/webp"],
  FLOOR_PLAN:["application/pdf","image/jpeg","image/png","image/webp"],
};

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService){}

  @Throttle({upload:{limit:15,ttl:60000}})
  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:unknown){
    assertPermission(user,"property:update");
    const data=mediaRequestSchema.parse(body);
    const property=await this.db.getProperty(data.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    if(!allowedByKind[data.kind].includes(data.contentType))throw new BadRequestException("file_type_rejected");

    const config=loadConfig();
    const safeName=data.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,140);
    const key="property/"+data.propertyId+"/original/"+user.id+"/"+randomUUID()+"-"+safeName;
    const maxBytes=data.kind==="VIDEO" ? Math.min(config.maxMediaBytes,500*1024*1024) : Math.min(config.maxMediaBytes,50*1024*1024);
    return {...this.storage.presignedPut("public/"+key,data.contentType),private:false,maxBytes,kind:data.kind,contentType:data.contentType};
  }

  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    assertPermission(user,"property:update");
    const data=z.object({
      propertyId:z.string().uuid(),
      key:z.string().min(20).max(500),
      kind:z.enum(["PHOTO","VIDEO","TOUR_360","FLOOR_PLAN"]),
    }).parse(body);
    const property=await this.db.getProperty(data.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);

    const prefix="property/"+data.propertyId+"/original/"+user.id+"/";
    if(!data.key.startsWith(prefix)||data.key.includes("..")||data.key.includes("\\"))throw new BadRequestException("invalid_key");

    const meta=await this.storage.headObject("public/"+data.key);
    const allowed=allowedByKind[data.kind];
    if(!meta.contentType || !allowed.includes(meta.contentType.toLowerCase()))throw new BadRequestException("uploaded_content_type_mismatch");

    const config=loadConfig();
    const maxBytes=data.kind==="VIDEO" ? Math.min(config.maxMediaBytes,500*1024*1024) : Math.min(config.maxMediaBytes,50*1024*1024);
    if(meta.contentLength<=0||meta.contentLength>maxBytes)throw new BadRequestException("Uploaded media exceeds the configured size limit");

    const media=await this.db.addMedia(data.propertyId,data.kind,data.key);
    await this.db.enqueueJob("media.process",{mediaId:media.id});
    return (await this.db.hydrateProperty(data.propertyId))?.media ?? [];
  }
}
