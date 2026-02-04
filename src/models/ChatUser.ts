import mongoose, { Schema, Model, Types } from "mongoose";

// =============================================================================
// ChatUser Model - Guest visitors who want to chat
// =============================================================================

export interface IChatUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  photo?: string;
  sessionToken: string;
  socketId?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatUserSchema = new Schema<IChatUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    photo: { type: String },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    socketId: { type: String, sparse: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Compound index for email lookups (not unique - same email can have multiple sessions)
ChatUserSchema.index({ email: 1 });

export const ChatUser: Model<IChatUser> =
  mongoose.models.ChatUser ||
  mongoose.model<IChatUser>("ChatUser", ChatUserSchema);
