import express from "express";
import session from "express-session";
import { registerRoutes } from './routes';
import { connectToMongoDB } from "./db";
import { corsMiddleware } from "./cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

console.log("[Startup] server/index.ts entrypoint loaded");

async function main() {
  try {
    console.log("[Startup] Connecting to MongoDB...");
    await connectToMongoDB();
    console.log("[Startup] Connected to MongoDB");

    const app = express();
    
    // Enable CORS before any routes
    app.use(corsMiddleware);
    
    // Parse JSON request body
    app.use(express.json());
    
    app.set('trust proxy', 1)

    app.use(session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        httpOnly: true
      }
    }));

    console.log("[Startup] Registering routes...");
    const server = await registerRoutes(app);
    console.log("[Startup] Routes registered");
    
    // Start the server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("[Startup] Error starting server:", error);
    process.exit(1);
  }
}

main();
