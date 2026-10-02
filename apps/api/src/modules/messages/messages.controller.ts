import { Body, Controller, Get, Param, Post, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { messageSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/records";
import { FeatureService } from "../../infra/feature.service";
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { StorageService } from "../../infra/storage.service";
import { DatabaseService } from "../../infra/database.service";
import { randomUUID } from "crypto";
import { z } from "zod";
import { matchesMagic } from "../../infra/file-validation";
import { MalwareScanner } from "../../infra/malware.service";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly features:FeatureService,private readonly storage:StorageService,private readonly db:DatabaseService,private readonly malware:MalwareScanner) {}
  @Post()
  send(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=messageSchema.parse(body);
    return this.features.sendMessage(user.id,{conversationId:data.conversationId,recipientId:data.recipientId,propertyId:data.propertyId,bookingId:data.bookingId,offerId:data.offerId,body:data.body,attachmentIds:data.attachmentIds});
  }
  @Post("attachments/signed-url")
  async attachmentSigned(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=z.object({conversationId:z.string().uuid(),filename:z.string().trim().min(1).max(180),contentType:z.string().trim().toLowerCase().max(100),sizeBytes:z.number().int().positive().max(50*1024*1024)}).parse(body);
    const member=await this.db.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",[d.conversationId,user.id]);
    if(!member.rows[0]) throw new ForbiddenException("Conversation access denied");
    const allowed=/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|webm)|application\/pdf|text\/plain)$/.test(d.contentType);
    if(!allowed) throw new BadRequestException("file_type_rejected");
    const safe=d.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
    const key="private/messages/"+d.conversationId+"/"+user.id+"/"+randomUUID()+"-"+safe;
    return {...this.storage.presignedPut(key,d.contentType,900),maxBytes:50*1024*1024};
  }

  @Post("attachments/complete")
  async attachmentComplete(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const d=z.object({conversationId:z.string().uuid(),key:z.string().min(20).max(1000),filename:z.string().trim().min(1).max(180),contentType:z.string().trim().toLowerCase().max(100)}).parse(body);
    if(!d.key.startsWith("private/messages/"+d.conversationId+"/"+user.id+"/"))throw new BadRequestException("invalid_key");
    const member=await this.db.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",[d.conversationId,user.id]);
    if(!member.rows[0])throw new ForbiddenException("Conversation access denied");
    const meta=await this.storage.headObject(d.key);
    const actualType=meta.contentType?.split(";")[0].trim().toLowerCase();
    if(actualType!==d.contentType)throw new BadRequestException("uploaded_content_type_mismatch");
    if(meta.contentLength<=0||meta.contentLength>50*1024*1024)throw new BadRequestException("attachment_too_large");
    const input=await this.storage.readBuffer(d.key);
    if(!matchesMagic(input.subarray(0,64),d.contentType)){await this.storage.deleteObject(d.key).catch(()=>undefined);throw new BadRequestException("uploaded_file_signature_rejected");}
    const scan=await this.malware.scan(input);
    if(!scan.clean){await this.storage.deleteObject(d.key).catch(()=>undefined);throw new BadRequestException("uploaded_file_rejected");}
    const result=await this.db.query(
      "INSERT INTO message_attachments(id,conversation_id,uploader_id,storage_key,filename,content_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,filename,content_type,size_bytes",
      [randomUUID(),d.conversationId,user.id,d.key,d.filename,d.contentType,meta.contentLength],
    );
    return result.rows[0];
  }

  @Get("attachments/:id/download")
  async attachmentDownload(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const result=await this.db.query(
      "SELECT a.storage_key FROM message_attachments a JOIN conversation_members cm ON cm.conversation_id=a.conversation_id WHERE a.id=$1 AND cm.user_id=$2",
      [id,user.id],
    );
    if(!result.rows[0])throw new NotFoundException("Attachment not found");
    return this.storage.presignedGet(result.rows[0].storage_key,600);
  }

  @Get("conversations") list(@CurrentUser() user:UserRecord){return this.features.listConversations(user.id);}
  @Get("conversations/:id") thread(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.getConversation(user.id,id);}
  @Post(":id/read") read(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.markRead(user.id,id);}
}

@WebSocketGateway({cors:{origin:process.env.APP_URL ?? "http://localhost:3000"},namespace:"/realtime"})
export class MessagesGateway {
  @WebSocketServer() server!:Server;

  constructor(private readonly jwt: import("@nestjs/jwt").JwtService, private readonly features:FeatureService, private readonly db: import("../../infra/database.service").DatabaseService) {}

  async handleConnection(client:Socket) {
    try {
      const authToken=client.handshake.auth?.token as string | undefined;
      const header=client.handshake.headers.authorization;
      let token=authToken;
      if(!token && typeof header==="string"){
        const separator=header.indexOf(" ");
        if(separator>0 && header.slice(0,separator).toLowerCase()==="bearer") token=header.slice(separator+1).trim();
      }
      if(!token) return client.disconnect(true);
      const payload=await this.jwt.verifyAsync<{sub:string}>(token);
      if(!payload?.sub) return client.disconnect(true);
      const user=await this.db.findUserById(payload.sub);
      if(!user || user.status!=="ACTIVE") return client.disconnect(true);
      client.data.userId=payload.sub;
      await client.join("user:"+payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client:Socket) {
    client.data.userId=undefined;
  }

  @SubscribeMessage("join:conversation")
  async joinConversation(@MessageBody() body:unknown,@ConnectedSocket() client:Socket) {
    const userId=client.data.userId as string | undefined;
    if(!userId) return {error:"unauthorized"};
    const parsed=z.object({conversationId:z.string().uuid()}).safeParse(body);
    if(!parsed.success)return {error:"invalid_payload"};
    const conversation=await this.features.getConversation(userId,parsed.data.conversationId);
    if(!conversation)return {error:"forbidden"};
    await client.join("conversation:"+parsed.data.conversationId);
    return {ok:true};
  }

  @SubscribeMessage("typing")
  async typing(@MessageBody() body:unknown,@ConnectedSocket() client:Socket){
    const userId=client.data.userId as string | undefined;
    if(!userId)return {error:"unauthorized"};
    const parsed=z.object({conversationId:z.string().uuid(),active:z.boolean().optional()}).safeParse(body);
    if(!parsed.success)return {error:"invalid_payload"};
    const conversation=await this.features.getConversation(userId,parsed.data.conversationId);
    if(!conversation)return {error:"forbidden"};
    client.to("conversation:"+parsed.data.conversationId).emit("typing",{conversationId:parsed.data.conversationId,userId,active:parsed.data.active!==false});
    return {ok:true};
  }

  @SubscribeMessage("message:send")
  async send(@MessageBody() body:unknown,@ConnectedSocket() client:Socket){
    const userId=client.data.userId as string | undefined;
    if(!userId)return {error:"unauthorized"};
    const parsed=messageSchema.safeParse(body);
    if(!parsed.success)return {error:"invalid_payload"};
    const data=parsed.data;
    const result=await this.features.sendMessage(userId,{conversationId:data.conversationId,recipientId:data.recipientId,propertyId:data.propertyId,bookingId:data.bookingId,offerId:data.offerId,body:data.body,attachmentIds:data.attachmentIds});
    if((result as any)?.error) return result;
    const conversationId=(result as any)?.conversation_id ?? (result as any)?.conversationId ?? data.conversationId;
    if(conversationId) {
      await client.join("conversation:"+conversationId);
      this.server.to("conversation:"+conversationId).emit("message:new",result);
    }
    return result;
  }
}
