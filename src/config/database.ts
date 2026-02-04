import mongoose from "mongoose";
import { config } from "./env.js";

// =============================================================================
// MongoDB Connection
// =============================================================================

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = connection.connections[0].readyState === 1;

    console.log("✅ MongoDB connected successfully");

    // Connection event handlers
    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
      isConnected = true;
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("📡 MongoDB disconnected gracefully");
  }
}
