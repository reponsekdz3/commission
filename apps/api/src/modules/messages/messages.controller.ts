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
  @Post("send")
  send(@CurrentUser() user:UserRecord,@Body() body:unknown){
    const data=messageSchema.parse(body);
    return this.features.sendMessage(user.id,{conversationId:data.conversationId,recipientId:data.recipientId,propertyId:data.propertyId,bookingId:data.bookingId,body:data.body});
  }
  @Get("conversations") list(@CurrentUser() user:UserRecord){return this.features.listConversations(user.id);}
  @Get("conversations/:id") thread(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.getConversation(user.id,id);}
  @Post(":id/read") read(@CurrentUser() user:UserRecord,@Param("id") id:string){return this.features.markRead(user.id,id);}
}

@WebSocketGateway({cors:{origin:"*"},namespace:"/realtime"})
export class MessagesGateway {
  @WebSocketServer() server!:Server;
  @SubscribeMessage("typing")
  typing(@MessageBody() body:{conversationId:string},@ConnectedSocket() client:Socket){client.broadcast.emit("typing",body);}
}
