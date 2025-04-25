import express from "express";
<<<<<<< HEAD
import { registerRoutes } from './routes';
import { connectToMongoDB } from "./db";
// import dotenv from "dotenv";

// Load environment variables from .env file
// dotenv.config();
=======
import { registerRoutes } from "./routes";
import { connectToMongoDB } from "./db";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18

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
<<<<<<< HEAD
    server.listen(PORT, () => {
=======
    server.listen(PORT, '127.0.0.1', () => {
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

<<<<<<< HEAD
main();
=======
main();
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
