import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { messageSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly store: PlatformStore) {}

  @Post()
  send(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    const data = messageSchema.parse(body);
    let conversationId = data.conversationId;
    if (!conversationId) {
      const memberIds = [user.id, data.recipientId].filter(Boolean) as string[];
      const existing = [...this.store.conversations.values()].find(
        (c) => memberIds.every((id) => c.memberIds.includes(id)) && c.propertyId === data.propertyId,
      );
      if (existing) conversationId = existing.id;
      else {
        conversationId = this.store.id();
        this.store.conversations.set(conversationId, {
          id: conversationId,
          memberIds,
          propertyId: data.propertyId,
          bookingId: data.bookingId,
        });
      }
    }
    const convo = this.store.conversations.get(conversationId!);
    if (!convo?.memberIds.includes(user.id)) return { error: "forbidden" };
    const message = {
      id: this.store.id(),
      conversationId: conversationId!,
      senderId: user.id,
      body: data.body,
      status: "SENT",
      createdAt: this.store.now(),
    };
    this.store.messages.push(message);
    for (const member of convo.memberIds.filter((id) => id !== user.id)) {
      this.store.notify(member, "NEW_MESSAGE", "New message", data.body.slice(0, 80));
    }
    return message;
  }

  @Get("conversations")
  list(@CurrentUser() user: UserRecord) {
    return [...this.store.conversations.values()].filter((c) => c.memberIds.includes(user.id));
  }

  @Get("conversations/:id")
  thread(@CurrentUser() user: UserRecord, @Param("id") id: string) {
    const convo = this.store.conversations.get(id);
    if (!convo?.memberIds.includes(user.id)) return { error: "forbidden" };
    return {
      conversation: convo,
      messages: this.store.messages.filter((m) => m.conversationId === id),
    };
  }

  @Post(":id/read")
  read(@CurrentUser() user: UserRecord, @Param("id") id: string) {
    void user;
    for (const message of this.store.messages.filter((m) => m.conversationId === id)) {
      if (message.status !== "READ") message.status = "READ";
    }
    return { ok: true };
  }
}

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/realtime" })
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("typing")
  typing(@MessageBody() body: { conversationId: string }, @ConnectedSocket() client: Socket) {
    client.broadcast.emit("typing", body);
  }
}
