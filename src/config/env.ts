import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// =============================================================================
// Environment Configuration
// =============================================================================

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Authentication
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  // CORS - supports multiple origins separated by comma
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Server
  PORT: z.string().default("4000").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

// Export typed config
export const config = {
  mongodb: {
    uri: env.MONGODB_URI,
  },
  jwt: {
    secret: env.JWT_SECRET,
  },
  cors: {
    origins: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  },
  server: {
    port: env.PORT,
    isDev: env.NODE_ENV === "development",
    isProd: env.NODE_ENV === "production",
  },
} as const;
