import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/index.js";
import {
  handleUserJoin,
  handleAdminJoin,
  handleConversationJoin,
  handleConversationLeave,
  handleMessageSend,
  handleMessageRead,
  handleMessageReact,
  handleTypingStart,
  handleTypingStop,
  handleDisconnect,
} from "../handlers/index.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.js";

// =============================================================================
// Socket.IO Server Configuration
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

let io: TypedServer | null = null;

// =============================================================================
// Initialize Socket.IO Server
// =============================================================================

export function initSocketServer(httpServer: HttpServer): TypedServer {
  if (io) return io;

  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: config.cors.origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: TypedSocket) => handleConnection(io!, socket));

  console.log("✅ Socket.IO server initialized");
  console.log(`📡 CORS origins: ${config.cors.origins.join(", ")}`);

  return io;
}

// =============================================================================
// Get Socket.IO instance
// =============================================================================

export function getIO(): TypedServer | null {
  return io;
}

// =============================================================================
// Connection Handler
// =============================================================================

function handleConnection(io: TypedServer, socket: TypedSocket): void {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Initialize socket data
  socket.data.userType = "user";

  // -------------------------------------------------------------------------
  // User Join Event (Guest users)
  // -------------------------------------------------------------------------
  socket.on("user:join", (data, callback) => {
    handleUserJoin(socket, data, callback);
  });

  // -------------------------------------------------------------------------
  // Admin Join Event
  // -------------------------------------------------------------------------
  socket.on("admin:join", (data, callback) => {
    handleAdminJoin(socket, data, callback);
  });

  // -------------------------------------------------------------------------
  // Conversation Events
  // -------------------------------------------------------------------------
  socket.on("conversation:join", (conversationId) => {
    handleConversationJoin(socket, conversationId);
  });

  socket.on("conversation:leave", (conversationId) => {
    handleConversationLeave(socket, conversationId);
  });

  // -------------------------------------------------------------------------
  // Typing Events
  // -------------------------------------------------------------------------
  socket.on("typing:start", (conversationId) => {
    handleTypingStart(socket, conversationId);
  });

  socket.on("typing:stop", (conversationId) => {
    handleTypingStop(socket, conversationId);
  });

  // -------------------------------------------------------------------------
  // Message Events
  // -------------------------------------------------------------------------
  socket.on("message:send", (data, callback) => {
    handleMessageSend(io, socket, data, callback);
  });

  socket.on("message:read", (conversationId) => {
    handleMessageRead(io, socket, conversationId);
  });

  socket.on("message:react", (data, callback) => {
    handleMessageReact(io, socket, data, callback);
  });

  // -------------------------------------------------------------------------
  // Disconnect Handler
  // -------------------------------------------------------------------------
  socket.on("disconnect", () => {
    handleDisconnect(socket);
  });
}

// =============================================================================
// Utility: Emit to specific user
// =============================================================================

export function emitToUser(
  userId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
): void {
  io?.to(`user:${userId}`).emit(event, data as never);
}

// =============================================================================
// Utility: Emit to admins
// =============================================================================

export function emitToAdmins(
  event: keyof ServerToClientEvents,
  data: unknown,
): void {
  io?.to("admin-room").emit(event, data as never);
}

// =============================================================================
// Utility: Emit to conversation
// =============================================================================

export function emitToConversation(
  conversationId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
): void {
  io?.to(`conversation:${conversationId}`).emit(event, data as never);
}
