import mongoose, { Schema, Model, Types } from "mongoose";

// =============================================================================
// Conversation Model - One-to-one chat between admin and guest
// =============================================================================

export interface IConversation {
  _id: Types.ObjectId;
  participant: Types.ObjectId; // Reference to ChatUser
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderType: "admin" | "user";
  };
  unreadCount: {
    admin: number;
    user: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
      unique: true, // One conversation per user
      index: true,
    },
    lastMessage: {
      content: { type: String },
      timestamp: { type: Date },
      senderType: { type: String, enum: ["admin", "user"] },
    },
    unreadCount: {
      admin: { type: Number, default: 0 },
      user: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Index for fetching conversations sorted by last activity
ConversationSchema.index({ "lastMessage.timestamp": -1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
