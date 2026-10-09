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

// Courts facility directory
const defaultCourts = [
  { id: 1, name: "Court A - Main Arena", location: "Main Gym (Wood Floor)", isAvailable: true },
  { id: 2, name: "Court B - Side Arena", location: "Main Gym (Rubber Floor)", isAvailable: true },
  { id: 3, name: "Court C - VIP Hall", location: "VIP Complex (AC Room)", isAvailable: false },
  { id: 4, name: "Court D - Outdoor Arena", location: "East Annex (Synthetics)", isAvailable: true },
];

app.get(["/api/courts", "/courts"], (_req, res) => {
  res.json(defaultCourts);
});

app.get(["/api/courts/:id", "/courts/:id"], (req, res) => {
  const court = defaultCourts.find((c) => c.id === Number(req.params.id));
  if (!court) {
    res.status(404).json({ error: "Court not found" });
    return;
  }
  res.json(court);
});

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
