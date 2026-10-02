import { Body, Controller, Get, Param, Post, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { messageSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { StorageService } from "../../infra/storage.service";
import { DatabaseService } from "../../infra/database.service";
import { randomUUID } from "crypto";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly features:FeatureService,private readonly storage:StorageService,private readonly db:DatabaseService) {}
  @Post()
  send(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=messageSchema.parse(body);
    return this.features.sendMessage(user.id,{conversationId:data.conversationId,recipientId:data.recipientId,propertyId:data.propertyId,bookingId:data.bookingId,offerId:data.offerId,body:data.body,attachmentIds:data.attachmentIds});
  }
  @Post("attachments/signed-url")
  async attachmentSigned(@CurrentUser() user:UserRecord,@Body() body:{conversationId:string;filename:string;contentType:string;sizeBytes:number}){
    const member=await this.db.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",[body.conversationId,user.id]);
    if(!member.rows[0]) return {error:"forbidden"};
    const allowed=/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|webm)|application\/pdf|text\/plain)$/.test(body.contentType);
    if(!allowed) throw new BadRequestException("file_type_rejected");
    if(!Number.isInteger(body.sizeBytes)||body.sizeBytes<=0||body.sizeBytes>50*1024*1024) throw new BadRequestException("attachment_too_large");
    const safe=body.filename.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180);
    const key="private/messages/"+body.conversationId+"/"+user.id+"/"+randomUUID()+"-"+safe;
    return {...this.storage.presignedPut(key,body.contentType,900),maxBytes:50*1024*1024};
  }

  @Post("attachments/complete")
  async attachmentComplete(@CurrentUser() user:UserRecord,@Body() body:{conversationId:string;key:string;filename:string;contentType:string}){
    if(!body.key.startsWith("private/messages/"+body.conversationId+"/"+user.id+"/"))return {error:"invalid_key"};
    const member=await this.db.query("SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",[body.conversationId,user.id]);
    if(!member.rows[0])return{error:"forbidden"};
    const meta=await this.storage.headObject(body.key);
    if(meta.contentLength<=0||meta.contentLength>50*1024*1024)throw new BadRequestException("attachment_too_large");
    const result=await this.db.query(
      "INSERT INTO message_attachments(id,conversation_id,uploader_id,storage_key,filename,content_type,size_bytes,scan_status) VALUES($1,$2,$3,$4,$5,$6,$7,'PENDING') RETURNING id,filename,content_type,size_bytes,scan_status",
      [randomUUID(),body.conversationId,user.id,body.key,body.filename.slice(0,180),body.contentType,meta.contentLength],
    );
    await this.db.enqueueJob("message.attachment.scan",{attachmentId:result.rows[0].id},0);
    return result.rows[0];
  }

  @Get("attachments/:id/download")
  async attachmentDownload(@CurrentUser() user:UserRecord,@Param("id") id:string){
    const result=await this.db.query(
      "SELECT a.storage_key FROM message_attachments a JOIN conversation_members cm ON cm.conversation_id=a.conversation_id WHERE a.id=$1 AND cm.user_id=$2 AND a.scan_status='CLEAN'",
      [id,user.id],
    );
    if(!result.rows[0])return{error:"not_found"};
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
      const token=authToken ?? (typeof header==="string" ? header.replace(/^Bearer\\s+/i,"") : undefined);
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
  async joinConversation(@MessageBody() body:{conversationId:string},@ConnectedSocket() client:Socket) {
    const userId=client.data.userId as string | undefined;
    if(!userId || !body?.conversationId) return {error:"unauthorized"};
    const conversation=await this.features.getConversation(userId,body.conversationId);
    if(!conversation) return {error:"forbidden"};
    await client.join("conversation:"+body.conversationId);
    return {ok:true};
  }

  @SubscribeMessage("typing")
  async typing(@MessageBody() body:{conversationId:string;active?:boolean},@ConnectedSocket() client:Socket){
    const userId=client.data.userId as string | undefined;
    if(!userId || !body?.conversationId) return {error:"unauthorized"};
    const conversation=await this.features.getConversation(userId,body.conversationId);
    if(!conversation) return {error:"forbidden"};
    client.to("conversation:"+body.conversationId).emit("typing",{conversationId:body.conversationId,userId,active:body.active!==false});
    return {ok:true};
  }

  @SubscribeMessage("message:send")
  async send(@MessageBody() body:{conversationId?:string;recipientId?:string;propertyId?:string;bookingId?:string;offerId?:string;body:string;attachmentIds?:string[]},@ConnectedSocket() client:Socket){
    const userId=client.data.userId as string | undefined;
    if(!userId || !body?.body?.trim()) return {error:"unauthorized"};
    const result=await this.features.sendMessage(userId,{...body,body:body.body.trim(),attachmentIds:body.attachmentIds});
    if((result as any)?.error) return result;
    const conversationId=(result as any)?.conversation_id ?? (result as any)?.conversationId ?? body.conversationId;
    if(conversationId) {
      await client.join("conversation:"+conversationId);
      this.server.to("conversation:"+conversationId).emit("message:new",result);
    }
    return result;
  }
}
