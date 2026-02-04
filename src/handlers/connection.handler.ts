import type { Socket } from "socket.io";
import { ChatUser } from "../models/index.js";
import { verifyToken } from "../middleware/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ChatUserData,
} from "../types/index.js";
import { ADMIN_ROOM } from "../socket/constants.js";

// =============================================================================
// Connection Handler - User/Admin Join Logic
// =============================================================================

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Handle user:join event - Guest users join with session token
 */
export async function handleUserJoin(
  socket: TypedSocket,
  data: { sessionToken: string },
  callback: (response: {
    success: boolean;
    user?: ChatUserData;
    error?: string;
  }) => void,
): Promise<void> {
  try {
    const user = await ChatUser.findOne({ sessionToken: data.sessionToken });

    if (!user) {
      callback({ success: false, error: "Invalid session token" });
      return;
    }

    // Update user status
    user.isOnline = true;
    user.socketId = socket.id;
    user.lastSeen = new Date();
    await user.save();

    // Store user info in socket data
    socket.data.userId = user._id.toString();
    socket.data.userType = "user";
    socket.data.sessionToken = data.sessionToken;

    // Join user's personal room for targeted messages
    socket.join(`user:${user._id.toString()}`);

    // Notify admins that user is online
    socket.to(ADMIN_ROOM).emit("user:online", {
      userId: user._id.toString(),
    });

    const userData: ChatUserData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      photo: user.photo,
      isOnline: true,
      lastSeen: user.lastSeen,
    };

    console.log(`👤 User joined: ${user.name} (${socket.id})`);
    callback({ success: true, user: userData });
  } catch (error) {
    console.error("user:join error:", error);
    callback({ success: false, error: "Failed to join" });
  }
}

/**
 * Handle admin:join event - Admins join with JWT token
 */
export async function handleAdminJoin(
  socket: TypedSocket,
  data: { token: string },
  callback: (response: { success: boolean; error?: string }) => void,
): Promise<void> {
  try {
    // Verify JWT token
    const payload = verifyToken(data.token);

    if (!payload) {
      callback({ success: false, error: "Invalid or expired token" });
      return;
    }

    // Set socket data for admin
    socket.data.userType = "admin";
    socket.data.userId = payload.sub || "admin";

    // Join admin room
    socket.join(ADMIN_ROOM);

    console.log(`👑 Admin joined: ${payload.email} (${socket.id})`);
    callback({ success: true });
  } catch (error) {
    console.error("admin:join error:", error);
    callback({ success: false, error: "Failed to join as admin" });
  }
}

/**
 * Handle conversation:join event
 */
export function handleConversationJoin(
  socket: TypedSocket,
  conversationId: string,
): void {
  socket.join(`conversation:${conversationId}`);
  socket.data.currentConversation = conversationId;
  console.log(`📢 Socket ${socket.id} joined conversation: ${conversationId}`);
}

/**
 * Handle conversation:leave event
 */
export function handleConversationLeave(
  socket: TypedSocket,
  conversationId: string,
): void {
  socket.leave(`conversation:${conversationId}`);
  socket.data.currentConversation = undefined;
  console.log(`📢 Socket ${socket.id} left conversation: ${conversationId}`);
}
