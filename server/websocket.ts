import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';

// Store active connections
const connections = new Map<string, WebSocket>();

export function setupWebSocketServer(server: Server) {
  const clientUrl = process.env.NODE_ENV === 'production' 
    ? 'production-url' 
    : 'http://localhost:5000';
  
  console.log(`Setting up WebSocket server with path '/ws' for client URL: ${clientUrl}`);
  
  try {
    // Create WebSocket server - attach to existing HTTP server
    const wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      // Add explicit options for better connection handling
      clientTracking: true,
      perMessageDeflate: {
        zlibDeflateOptions: {
          // See zlib defaults.
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        // Other options settable:
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages should not be compressed.
      }
    });

    // Listen for WebSocketServer errors
    wss.on('error', (error) => {
      console.error('WebSocketServer error:', error);
    });

    // Handle new connections
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const ip = req.socket.remoteAddress;
      const clientInfo = `Client ${ip}`;
      console.log(`WebSocket connection established from ${clientInfo}`);
      
      let userId: string | null = null;
      
      // Handle messages from clients
      ws.on('message', (messageBuffer) => {
        try {
          const messageStr = messageBuffer.toString();
          console.log(`Received message from ${clientInfo}: ${messageStr}`);
          
          const message = JSON.parse(messageStr);
          
          // Handle registration message
          if (message.type === 'register' && message.userId) {
            userId = message.userId.toString();
            
            // Store the connection with the user ID
            if (userId) {
              // Remove any existing connection for this user first
              if (connections.has(userId)) {
                const existingConnection = connections.get(userId);
                if (existingConnection && existingConnection !== ws) {
                  console.log(`Closing existing connection for user ${userId}`);
                  existingConnection.close();
                }
              }
              
              connections.set(userId, ws);
              console.log(`User ${userId} registered for notifications. Total connections: ${connections.size}`);
            }
            
            // Send acknowledgment
            ws.send(JSON.stringify({
              type: 'registration_success',
              message: 'Successfully registered for notifications'
            }));
          }
        } catch (error) {
          console.error(`Error processing WebSocket message from ${clientInfo}:`, error);
          // Try to send error message to client
          try {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Error processing message'
            }));
          } catch (sendError) {
            console.error('Error sending error message to client:', sendError);
          }
        }
      });
      
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientInfo}:`, error);
      });
      
      ws.on('close', (code, reason) => {
        // Remove the connection when closed
        if (userId !== null) {
          connections.delete(userId);
          console.log(`WebSocket connection closed for user ${userId}. Code: ${code}, Reason: ${reason}`);
        } else {
          console.log(`Unidentified WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
        }
      });
      
      // Send a welcome message
      try {
        ws.send(JSON.stringify({
          type: 'welcome',
          message: 'Connected to notification service'
        }));
        console.log(`Sent welcome message to ${clientInfo}`);
      } catch (error) {
        console.error(`Error sending welcome message to ${clientInfo}:`, error);
      }
    });

    // Log active connections periodically
    setInterval(() => {
      console.log(`Active WebSocket connections: ${connections.size}`);
      // Log all connected user IDs
      if (connections.size > 0) {
        console.log('Connected users:', Array.from(connections.keys()));
      }
    }, 30000); // Log every 30 seconds

    return wss;
  } catch (error) {
    console.error("WebSocket server setup error:", error);
    // Return a dummy WebSocket server that does nothing
    // This allows the application to continue running without WebSockets if needed
    return {
      on: () => {},
      close: () => {},
      clients: new Set(),
    } as unknown as WebSocketServer;
  }
}

// Function to send notification to a user via WebSocket
export const sendNotificationToUser = (userId: string, notification: any) => {
  const connection = connections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    try {
      connection.send(JSON.stringify({
        type: 'notification',
        notification: notification
      }));
      console.log(`Sent notification to user ${userId}`);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  } else {
    // If user not connected or connection not ready, log it
    if (!connection) {
      console.log(`User ${userId} not connected, notification not sent`);
    } else {
      console.log(`Connection for user ${userId} not in OPEN state`);
    }
  }
};