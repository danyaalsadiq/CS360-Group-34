import express from "express";
import { createServer } from "http";
import { connectToMongoDB } from "./server/db";
import { registerRoutes } from "./server/routes";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    console.log("Connected to MongoDB");

    const app = express();
    
    // Parse JSON request body
    app.use(express.json());
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Set up routes
    await registerRoutes(app);
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    
    // Bind to 0.0.0.0 instead of localhost/127.0.0.1
    // This allows connections from all network interfaces
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();