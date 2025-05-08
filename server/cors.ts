import cors from "cors";

// Allow only your Vercel frontend domain in production
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  "https://cs-360-group-34-final-6nugbiuwr-danyaal-sadiqs-projects.vercel.app",
  "https://cs-360-group-34-final-deployment-cs1xmbgmm.vercel.app"
];

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});
