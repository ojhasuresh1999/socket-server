import { createServer } from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import {
  config,
  connectToDatabase,
  disconnectDatabase,
  corsOptions,
} from "./config/index.js";
import { initSocketServer } from "./socket/index.js";

// =============================================================================
// Express App Setup
// =============================================================================

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// =============================================================================
// Health Check Endpoint
// =============================================================================

app.get("/health", (req: Request, res: Response) => {
  const origin = req.get("origin") || req.get("referer") || "unknown origin";
  console.log(`🏥 Health check requested from: ${origin}`);
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.isDev ? "development" : "production",
  });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Portfolio Socket Server",
    version: "1.0.0",
    status: "running",
  });
});

// =============================================================================
// Start Server
// =============================================================================

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initSocketServer(httpServer);

    // Start listening
    httpServer.listen(config.server.port, () => {
      console.log(`
🚀 Socket Server ready at http://localhost:${config.server.port}
📡 Socket.IO server running
🔧 Environment: ${config.server.isDev ? "development" : "production"}
❤️  Health check: http://localhost:${config.server.port}/health
      `);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        console.log("HTTP server closed");
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
