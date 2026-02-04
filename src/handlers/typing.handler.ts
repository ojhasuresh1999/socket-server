import type { Socket } from "socket.io";
import { ChatUser } from "../models/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.js";

// =============================================================================
// Typing Handler - Start/Stop Typing Indicators
// =============================================================================

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Handle typing:start event
 */
export async function handleTypingStart(
  socket: TypedSocket,
  conversationId: string,
): Promise<void> {
  if (!socket.data.userId) return;

  const typingData = {
    conversationId,
    userId: socket.data.userId,
    userName: "", // Will be filled below
  };

  if (socket.data.userType === "user") {
    const user = await ChatUser.findById(socket.data.userId).lean();
    typingData.userName = user?.name || "User";
  } else {
    typingData.userName = "Admin";
  }

  socket.to(`conversation:${conversationId}`).emit("user:typing", typingData);
}

/**
 * Handle typing:stop event
 */
export function handleTypingStop(
  socket: TypedSocket,
  conversationId: string,
): void {
  if (!socket.data.userId) return;

  socket.to(`conversation:${conversationId}`).emit("user:stop-typing", {
    conversationId,
    userId: socket.data.userId,
    userName: "",
  });
}
