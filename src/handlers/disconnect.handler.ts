import type { Socket } from "socket.io";
import { ChatUser } from "../models/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.js";
import { ADMIN_ROOM } from "../socket/constants.js";

// =============================================================================
// Disconnect Handler
// =============================================================================

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Handle socket disconnect event
 */
export async function handleDisconnect(socket: TypedSocket): Promise<void> {
  console.log(`🔌 Socket disconnected: ${socket.id}`);

  if (socket.data.userType === "user" && socket.data.userId) {
    try {
      const lastSeen = new Date();
      await ChatUser.findByIdAndUpdate(socket.data.userId, {
        isOnline: false,
        lastSeen,
        socketId: null,
      });

      // Notify admins that user went offline
      socket.to(ADMIN_ROOM).emit("user:offline", {
        userId: socket.data.userId,
        lastSeen,
      });

      console.log(`👤 User went offline: ${socket.data.userId}`);
    } catch (error) {
      console.error("disconnect handler error:", error);
    }
  }
}
