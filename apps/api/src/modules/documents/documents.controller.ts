import { Body, Controller, ForbiddenException, Get, Param, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { assertPermission, assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";
import { z } from "zod";

const documentUploadSchema=z.object({
  propertyId:z.string().uuid(),
  filename:z.string().trim().min(1).max(180),
  contentType:z.string().trim().toLowerCase().max(120),
  kind:z.string().trim().min(1).max(80),
  expiresAt:z.string().optional(),
});

@ApiTags("documents")
@ApiBearerAuth()
@Controller("documents")
export class DocumentsController{
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService){}

  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:unknown){
    assertPermission(user,"property:update");
    const data=documentUploadSchema.parse(body);
    const property=await this.db.getProperty(data.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    const allowed=/^(application/pdf|image/(jpeg|png|webp))$/.test(data.contentType);
    if(!allowed)throw new BadRequestException("file_type_rejected");
    const safe=data.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,140);
    const key="private/property/"+data.propertyId+"/documents/"+user.id+"/"+crypto.randomUUID()+"-"+safe;
    return {...this.storage.presignedPut(key,data.contentType,900),private:true,maxBytes:25*1024*1024,expiresAt:data.expiresAt};
  }

  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    assertPermission(user,"property:update");
    const data=z.object({propertyId:z.string().uuid(),kind:z.string().trim().min(1).max(80),key:z.string().min(20).max(500),expiresAt:z.string().optional()}).parse(body);
    const property=await this.db.getProperty(data.propertyId);
    if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    const prefix="private/property/"+data.propertyId+"/documents/"+user.id+"/";
    if(!data.key.startsWith(prefix)||data.key.includes("..")||data.key.includes("\\"))throw new BadRequestException("invalid_key");
    const meta=await this.storage.headObject(data.key);
    if(!meta.contentType||!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(meta.contentType.toLowerCase()))throw new BadRequestException("uploaded_content_type_mismatch");
    if(meta.contentLength<=0||meta.contentLength>25*1024*1024)throw new BadRequestException("document_too_large");
    return this.db.addDocument(data.propertyId,data.kind,data.key,data.expiresAt);
  }

  @Get("property/:propertyId")
  async list(@CurrentUser() user:UserRecord,@Param("propertyId") propertyId:string){
    const property=await this.db.getProperty(propertyId);if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    return this.db.listDocuments(propertyId);
  }

  @Get(":id/download")
  async download(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const doc=await this.db.getDocument(id);if(!doc)return{error:"not_found"};
    const property=await this.db.getProperty(doc.property_id);if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    return this.storage.presignedGet(doc.storage_key,600);
  }

  @Post(":id/verify")
  async verify(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:unknown){
    if(!user.roles.some(r=>["SUPER_ADMIN","ADMIN","VERIFICATION_AGENT"].includes(r)))throw new ForbiddenException("Verification access required");
    const data=z.object({status:z.enum(["VERIFIED","REJECTED"])}).parse(body);
    return this.db.verifyDocument(id,data.status);
  }
}
