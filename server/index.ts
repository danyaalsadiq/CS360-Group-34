import express from "express";
import { registerRoutes } from "./routes";
import { connectToMongoDB } from "./db";
import dotenv from 'dotenv';

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
    
    // Set up routes
    const server = await registerRoutes(app);
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();
