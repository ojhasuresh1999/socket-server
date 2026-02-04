import mongoose, { Schema, Model, Types } from "mongoose";

// =============================================================================
// Message Model - Individual chat messages with reactions and media
// =============================================================================

export interface IMessageMedia {
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
}

export interface IMessageReaction {
  emoji: string;
  userIds: string[];
}

export interface IMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: string; // Can be ChatUser._id or "admin"
  senderType: "admin" | "user";
  content: string;
  media?: IMessageMedia;
  reactions: IMessageReaction[];
  readAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageReactionSchema = new Schema<IMessageReaction>(
  {
    emoji: { type: String, required: true },
    userIds: [{ type: String }],
  },
  { _id: false },
);

const MessageMediaSchema = new Schema<IMessageMedia>(
  {
    type: { type: String, enum: ["image", "file"], required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
  },
  { _id: false },
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: { type: String, required: true },
    senderType: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    media: MessageMediaSchema,
    reactions: [MessageReactionSchema],
    readAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

// Compound index for efficient message fetching
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for unread message queries
MessageSchema.index({ conversationId: 1, readAt: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
