import express from "express";
import { registerRoutes } from './routes';
import { connectToMongoDB } from "./db";
import { corsMiddleware } from "./cors";
// import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();

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
    
    console.log("[Startup] Registering routes...");
    const server = await registerRoutes(app);
    console.log("[Startup] Routes registered");
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    console.log(`[Startup] Starting server on port ${PORT}`);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("[Startup] Error starting server:", error);
    process.exit(1);
  }
}

main();
