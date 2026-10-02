import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { DatabaseService } from "../../infra/database.service";
import { z } from "zod";
import { hasPermission } from "@imizi/domain";

const verificationSubmitSchema = z.object({
  subjectType: z.enum(["PROPERTY","USER","AGENCY","DOCUMENT"]),
  subjectId: z.string().uuid(),
  kind: z.string().trim().min(1).max(80),
  evidence: z.record(z.string(),z.unknown()).optional(),
}).superRefine((value,ctx)=>{
  if(value.evidence && JSON.stringify(value.evidence).length>16_384){
    ctx.addIssue({code:z.ZodIssueCode.too_big,maximum:16_384,type:"string",inclusive:true,path:["evidence"]});
  }
});

const verificationDecisionSchema = z.object({ accept: z.boolean() });

@ApiTags("verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private readonly features:FeatureService,private readonly db:DatabaseService){}

  @Post()
  async submit(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=verificationSubmitSchema.parse(body);
    let allowed=false;
    if(data.subjectType==="PROPERTY"){
      const property=await this.db.getProperty(data.subjectId);
      allowed=Boolean(property && (property.ownerId===user.id || (property.organizationId && property.organizationId===user.organizationId)));
    }else if(data.subjectType==="USER"){
      allowed=data.subjectId===user.id;
    }else if(data.subjectType==="AGENCY"){
      const org=await this.db.query("SELECT 1 FROM organization_members WHERE organization_id=$1 AND user_id=$2",[data.subjectId,user.id]);
      allowed=Boolean(org.rows[0]);
    }else if(data.subjectType==="DOCUMENT"){
      const doc=await this.db.getDocument(data.subjectId);
      if(doc){
        const property=await this.db.getProperty(String(doc.property_id));
        allowed=Boolean(property && (property.ownerId===user.id || (property.organizationId && property.organizationId===user.organizationId)));
      }
    }
    if(!allowed && !hasPermission(user.roles,"verification:review")) {
      throw new ForbiddenException("You are not allowed to submit verification for this subject");
    }
    return this.features.submitVerification(user.id,data);
  }

  @Post(":id/decide")
  decide(@CurrentUser() user:UserRecord,@Param("id") id:string,@Body() body:unknown){
    if(!hasPermission(user.roles,"verification:review"))throw new ForbiddenException("Verification access required");
    const data=verificationDecisionSchema.parse(body);
    return this.features.decideVerification(user.id,id,data.accept);
  }

  @Get()
  list(@CurrentUser() user:UserRecord){
    if(!hasPermission(user.roles,"verification:review"))throw new ForbiddenException("Verification access required");
    return this.features.listVerifications();
  }
}
