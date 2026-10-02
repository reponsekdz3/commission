import { Body, Controller, ForbiddenException, Get, Param, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/records";
import { assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";
import { z } from "zod";
import { matchesMagic } from "../../infra/file-validation";
import { MalwareScanner } from "../../infra/malware.service";
const documentCreateSchema=z.object({propertyId:z.string().uuid(),filename:z.string().trim().min(1).max(180),contentType:z.string().trim().toLowerCase().max(100),kind:z.string().trim().min(1).max(80),expiresAt:z.string().date().optional()});
const documentCompleteSchema=z.object({propertyId:z.string().uuid(),kind:z.string().trim().min(1).max(80),key:z.string().min(20).max(1000),expiresAt:z.string().date().optional()});
@ApiTags("documents") @ApiBearerAuth() @Controller("documents")
export class DocumentsController{
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService,private readonly malware:MalwareScanner){}
  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=documentCreateSchema.parse(body); const property=await this.db.getProperty(d.propertyId); if(!property)throw new BadRequestException("Property not found");
    assertPropertyAccess(user,property,true);
    if(d.contentType!=="application/pdf"&&!["image/jpeg","image/png","image/webp"].includes(d.contentType))throw new BadRequestException("file_type_rejected");
    const safe=d.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180); const key="private/property/"+d.propertyId+"/documents/"+Date.now()+"-"+safe;
    return {...this.storage.presignedPut(key,d.contentType),private:true,maxBytes:25*1024*1024,expiresAt:d.expiresAt};
  }
  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=documentCompleteSchema.parse(body); const property=await this.db.getProperty(d.propertyId); if(!property)throw new BadRequestException("Property not found");
    assertPropertyAccess(user,property,true); const prefix="private/property/"+d.propertyId+"/documents/";
    if(!d.key.startsWith(prefix)||d.key.includes(".."))throw new BadRequestException("invalid_key");
    const meta=await this.storage.headObject(d.key); const actualType=meta.contentType?.split(";")[0].trim().toLowerCase();
    if(!actualType||!["application/pdf","image/jpeg","image/png","image/webp"].includes(actualType)){
      await this.storage.deleteObject(d.key).catch(()=>undefined);
      throw new BadRequestException("uploaded_content_type_rejected");
    }
    const input=await this.storage.readBuffer(d.key);
    if(!matchesMagic(input.subarray(0,64),actualType)){await this.storage.deleteObject(d.key).catch(()=>undefined);throw new BadRequestException("uploaded_file_signature_rejected");}
    const scan=await this.malware.scan(input);
    if(!scan.clean){await this.storage.deleteObject(d.key).catch(()=>undefined);throw new BadRequestException("uploaded_file_rejected");}
    if(meta.contentLength<=0||meta.contentLength>25*1024*1024){
      await this.storage.deleteObject(d.key).catch(()=>undefined);
      throw new BadRequestException("uploaded_document_size_rejected");
    }
    return this.db.addDocument(d.propertyId,d.kind,d.key,d.expiresAt);
  }
  @Get("property/:propertyId")
  async list(@CurrentUser() user:UserRecord,@Param("propertyId") propertyId:string){const property=await this.db.getProperty(propertyId);if(!property)return{error:"not_found"};assertPropertyAccess(user,property,true);return this.db.listDocuments(propertyId);}
  @Get(":id/download")
  async download(@CurrentUser() user:UserRecord,@Param("id") id:string){const doc=await this.db.getDocument(id);if(!doc)return{error:"not_found"};const property=await this.db.getProperty(doc.property_id);if(!property)return{error:"not_found"};assertPropertyAccess(user,property,true);return this.storage.presignedGet(doc.storage_key,600);}
  @Post(":id/verify")
  async verify(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:unknown){if(!user.roles.some(r=>["SUPER_ADMIN","ADMIN","VERIFICATION_AGENT"].includes(r)))throw new ForbiddenException("Verification access required");return this.db.verifyDocument(id,z.object({status:z.enum(["VERIFIED","REJECTED"])}).parse(body).status);}
}
