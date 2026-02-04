// =============================================================================
// Socket.IO Type Definitions
// Production-level type-safe socket events for chat feature
// =============================================================================

// -----------------------------------------------------------------------------
// Message & Conversation Types (shared between client/server)
// -----------------------------------------------------------------------------

export interface ChatUserData {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface MessageMedia {
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
}

export interface MessageReaction {
  emoji: string;
  usersIds: string[];
}

export interface MessageData {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: "admin" | "user";
  content: string;
  media?: MessageMedia;
  reactions: MessageReaction[];
  readAt?: Date;
  createdAt: Date;
}

export interface ConversationData {
  _id: string;
  participant: ChatUserData;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderType: "admin" | "user";
  };
  unreadCount: {
    admin: number;
    user: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Socket Payloads (data sent with events)
// -----------------------------------------------------------------------------

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  media?: MessageMedia;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface UserStatusPayload {
  userId: string;
  lastSeen?: Date;
}

export interface MessageReadPayload {
  conversationId: string;
  readBy: string;
  readByType: "admin" | "user";
}

export interface ReactionPayload {
  messageId: string;
  reactions: MessageReaction[];
}

// -----------------------------------------------------------------------------
// Server -> Client Events
// Events emitted by the server to connected clients
// -----------------------------------------------------------------------------

export interface ServerToClientEvents {
  // User presence events
  "user:online": (data: UserStatusPayload) => void;
  "user:offline": (data: UserStatusPayload) => void;

  // Typing indicator events
  "user:typing": (data: TypingPayload) => void;
  "user:stop-typing": (data: TypingPayload) => void;

  // Message events
  "message:new": (message: MessageData) => void;
  "message:read": (data: MessageReadPayload) => void;
  "message:reaction": (data: ReactionPayload) => void;

  // Conversation events
  "conversation:new": (conversation: ConversationData) => void;
  "conversation:update": (conversation: ConversationData) => void;

  // Error handling
  error: (error: { message: string; code?: string }) => void;
}

// -----------------------------------------------------------------------------
// Client -> Server Events
// Events emitted by clients to the server
// -----------------------------------------------------------------------------

export interface ClientToServerEvents {
  // User authentication/presence
  "user:join": (
    data: { sessionToken: string },
    callback: (response: {
      success: boolean;
      user?: ChatUserData;
      error?: string;
    }) => void,
  ) => void;
  "admin:join": (
    data: { token: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  // Room management
  "conversation:join": (conversationId: string) => void;
  "conversation:leave": (conversationId: string) => void;

  // Typing indicators
  "typing:start": (conversationId: string) => void;
  "typing:stop": (conversationId: string) => void;

  // Messaging
  "message:send": (
    data: SendMessagePayload,
    callback: (response: {
      success: boolean;
      message?: MessageData;
      error?: string;
    }) => void,
  ) => void;
  "message:read": (conversationId: string) => void;
  "message:react": (
    data: { messageId: string; emoji: string },
    callback: (response: {
      success: boolean;
      reactions?: MessageReaction[];
      error?: string;
    }) => void,
  ) => void;
}

// -----------------------------------------------------------------------------
// Inter-Server Events (for scaling with multiple servers)
// -----------------------------------------------------------------------------

export interface InterServerEvents {
  ping: () => void;
}

// -----------------------------------------------------------------------------
// Socket Data (attached to each socket)
// -----------------------------------------------------------------------------

export interface SocketData {
  userId?: string;
  userType: "admin" | "user";
  sessionToken?: string;
  currentConversation?: string;
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type UserType = "admin" | "user";
