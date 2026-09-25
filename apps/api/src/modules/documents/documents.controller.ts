import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";
import { DatabaseService } from "../../infra/database.service";
import { StorageService } from "../../infra/storage.service";

@ApiTags("documents")
@ApiBearerAuth()
@Controller("documents")
export class DocumentsController{
  constructor(private readonly db:DatabaseService,private readonly storage:StorageService){}

  @Post("signed-url")
  async signed(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;filename:string;contentType:string;kind:string;expiresAt?:string}){
    const property=await this.db.getProperty(body.propertyId);if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    if(body.contentType!=="application/pdf" && !body.contentType.startsWith("image/"))return{error:"file_type_rejected"};
    const safe=body.filename.replace(/[^a-zA-Z0-9._-]/g,"_");
    const key="private/property/"+body.propertyId+"/documents/"+Date.now()+"-"+safe;
    return {...this.storage.presignedPut(key,body.contentType),private:true,expiresAt:body.expiresAt};
  }

  @Post("complete")
  async complete(@CurrentUser() user:UserRecord,@Body() body:{propertyId:string;kind:string;key:string;expiresAt?:string}){
    const property=await this.db.getProperty(body.propertyId);if(!property)return{error:"not_found"};
    assertPropertyAccess(user,property,true);
    if(!body.key.startsWith("private/property/"+body.propertyId+"/"))return{error:"invalid_key"};
    return this.db.addDocument(body.propertyId,body.kind,body.key,body.expiresAt);
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
  async verify(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:{status:"VERIFIED"|"REJECTED"}){
    if(!user.roles.some(r=>["SUPER_ADMIN","ADMIN","VERIFICATION_AGENT"].includes(r)))throw new ForbiddenException("Verification access required");
    return this.db.verifyDocument(id,body.status);
  }
}
