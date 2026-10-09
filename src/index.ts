import dns from "node:dns";
import path from "node:path";
import dotenv from "dotenv";

// Fix ECONNREFUSED querySrv error on Windows / local ISP DNS resolvers
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Load .env explicitly from backend root folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { authRouter, bookingsRouter } from "./routes";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI is not defined in .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);

// Lab demo alias: /api/submissions routes to bookings
app.use("/api/submissions", bookingsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Badminton Booking API is online" });
});

// Connect to MongoDB Atlas and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas successfully.");
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  });

export default app;
