import { config } from "./index.js";

/**
 * Validates if the given origin is allowed based on static configuration
 * or if it matches a Vercel preview deployment pattern.
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow non-browser requests

  // Check if it's an exact match in the configured origins
  if (config.cors.origins.includes(origin)) {
    return true;
  }

  // Allow any Vercel preview domain
  if (origin.endsWith(".vercel.app")) {
    return true;
  }

  return false;
};

/**
 * CORS options function for the 'cors' middleware
 */
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
