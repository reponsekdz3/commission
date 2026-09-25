import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { messageSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import type { UserRecord } from "../../store/platform.store";
import { FeatureService } from "../../infra/feature.service";
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly features:FeatureService) {}
  @Post()
  send(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=messageSchema.parse(body);
    return this.features.sendMessage(user.id,{conversationId:data.conversationId,recipientId:data.recipientId,propertyId:data.propertyId,bookingId:data.bookingId,body:data.body});
  }
  @Get("conversations") list(@CurrentUser() user:UserRecord){return this.features.listConversations(user.id);}
  @Get("conversations/:id") thread(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.getConversation(user.id,id);}
  @Post(":id/read") read(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.markRead(user.id,id);}
}

@WebSocketGateway({cors:{origin:process.env.APP_URL ?? "http://localhost:3000"},namespace:"/realtime"})
export class MessagesGateway {
  @WebSocketServer() server!:Server;

  constructor(private readonly jwt: import("@nestjs/jwt").JwtService, private readonly features:FeatureService) {}

  async handleConnection(client:Socket) {
    try {
      const authToken=client.handshake.auth?.token as string | undefined;
      const header=client.handshake.headers.authorization;
      const token=authToken ?? (typeof header==="string" ? header.replace(/^Bearer\\s+/i,"") : undefined);
      if(!token) return client.disconnect(true);
      const payload=await this.jwt.verifyAsync<{sub:string}>(token);
      if(!payload?.sub) return client.disconnect(true);
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
  async send(@MessageBody() body:{conversationId?:string;recipientId?:string;propertyId?:string;bookingId?:string;offerId?:string;body:string},@ConnectedSocket() client:Socket){
    const userId=client.data.userId as string | undefined;
    if(!userId || !body?.body?.trim()) return {error:"unauthorized"};
    const result=await this.features.sendMessage(userId,{...body,body:body.body.trim()});
    if((result as any)?.error) return result;
    const conversationId=(result as any)?.conversation_id ?? (result as any)?.conversationId ?? body.conversationId;
    if(conversationId) {
      await client.join("conversation:"+conversationId);
      this.server.to("conversation:"+conversationId).emit("message:new",result);
    }
    return result;
  }
}
