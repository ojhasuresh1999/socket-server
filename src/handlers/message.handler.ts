import type { Server, Socket } from "socket.io";
import { Message, Conversation } from "../models/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  SendMessagePayload,
  MessageData,
  MessageReaction,
} from "../types/index.js";
import { ADMIN_ROOM } from "../socket/constants.js";

// =============================================================================
// Message Handler - Send, Read, React
// =============================================================================

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Handle message:send event
 */
export async function handleMessageSend(
  io: TypedServer,
  socket: TypedSocket,
  data: SendMessagePayload,
  callback: (response: {
    success: boolean;
    message?: MessageData;
    error?: string;
  }) => void,
): Promise<void> {
  try {
    if (!socket.data.userId) {
      callback({ success: false, error: "Not authenticated" });
      return;
    }

    // Create message
    const message = await Message.create({
      conversationId: data.conversationId,
      senderId: socket.data.userId,
      senderType: socket.data.userType,
      content: data.content,
      media: data.media,
      reactions: [],
    });

    // Update conversation last message
    await Conversation.findByIdAndUpdate(data.conversationId, {
      lastMessage: {
        content: data.content.substring(0, 100),
        timestamp: message.createdAt,
        senderType: socket.data.userType,
      },
      $inc: {
        [`unreadCount.${socket.data.userType === "admin" ? "user" : "admin"}`]: 1,
      },
    });

    const messageData: MessageData = {
      _id: message._id.toString(),
      conversationId: data.conversationId,
      senderId: socket.data.userId,
      senderType: socket.data.userType,
      content: message.content,
      media: message.media,
      reactions: [],
      createdAt: message.createdAt,
    };

    // Broadcast to conversation room (including sender for confirmation)
    io.to(`conversation:${data.conversationId}`).emit(
      "message:new",
      messageData,
    );

    // Also notify admins if message is from user
    if (socket.data.userType === "user") {
      socket.to(ADMIN_ROOM).emit("message:new", messageData);
    }

    console.log(`💬 Message sent in conversation ${data.conversationId}`);
    callback({ success: true, message: messageData });
  } catch (error) {
    console.error("message:send error:", error);
    callback({ success: false, error: "Failed to send message" });
  }
}

/**
 * Handle message:read event
 */
export async function handleMessageRead(
  io: TypedServer,
  socket: TypedSocket,
  conversationId: string,
): Promise<void> {
  if (!socket.data.userId) return;

  try {
    // Mark unread messages as read
    await Message.updateMany(
      {
        conversationId,
        senderType: socket.data.userType === "admin" ? "user" : "admin",
        readAt: null,
      },
      { readAt: new Date() },
    );

    // Reset unread count for this user type
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${socket.data.userType}`]: 0,
    });

    // Notify the other party
    io.to(`conversation:${conversationId}`).emit("message:read", {
      conversationId,
      readBy: socket.data.userId,
      readByType: socket.data.userType,
    });

    console.log(`✅ Messages marked as read in conversation ${conversationId}`);
  } catch (error) {
    console.error("message:read error:", error);
  }
}

/**
 * Handle message:react event
 */
export async function handleMessageReact(
  io: TypedServer,
  socket: TypedSocket,
  data: { messageId: string; emoji: string },
  callback: (response: {
    success: boolean;
    reactions?: MessageReaction[];
    error?: string;
  }) => void,
): Promise<void> {
  try {
    if (!socket.data.userId) {
      callback({ success: false, error: "Not authenticated" });
      return;
    }

    const message = await Message.findById(data.messageId);

    if (!message) {
      callback({ success: false, error: "Message not found" });
      return;
    }

    // Find or create reaction for this emoji
    const existingReaction = message.reactions.find(
      (r) => r.emoji === data.emoji,
    );

    if (existingReaction) {
      const userIndex = existingReaction.userIds.indexOf(socket.data.userId);
      if (userIndex > -1) {
        // Remove user from reaction
        existingReaction.userIds.splice(userIndex, 1);
        // Remove reaction if no users left
        if (existingReaction.userIds.length === 0) {
          message.reactions = message.reactions.filter(
            (r) => r.emoji !== data.emoji,
          );
        }
      } else {
        // Add user to reaction
        existingReaction.userIds.push(socket.data.userId);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji: data.emoji,
        userIds: [socket.data.userId],
      });
    }

    await message.save();

    const reactions: MessageReaction[] = message.reactions.map((r) => ({
      emoji: r.emoji,
      usersIds: r.userIds,
    }));

    // Broadcast reaction update
    io.to(`conversation:${message.conversationId.toString()}`).emit(
      "message:reaction",
      {
        messageId: data.messageId,
        reactions,
      },
    );

    callback({ success: true, reactions });
  } catch (error) {
    console.error("message:react error:", error);
    callback({ success: false, error: "Failed to add reaction" });
  }
}
