import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import { authRouter, bookingsRouter } from "./routes";

const app = express();

// Configure CORS using comma-separated CORS_ORIGIN environment variable
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Database connection middleware before handling API routes
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "ITELECT4 Badminton Booking API is running!",
    endpoints: {
      health: "/api/health",
      courts: "/api/courts",
      bookings: "/api/bookings",
      auth: "/api/auth",
    },
  });
});

// Health check route
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Badminton Booking API is online" });
});

// Courts facility directory
const defaultCourts = [
  { id: 1, name: "Court A - Main Arena", location: "Main Gym (Wood Floor)", isAvailable: true },
  { id: 2, name: "Court B - Side Arena", location: "Main Gym (Rubber Floor)", isAvailable: true },
  { id: 3, name: "Court C - VIP Hall", location: "VIP Complex (AC Room)", isAvailable: false },
  { id: 4, name: "Court D - Outdoor Arena", location: "East Annex (Synthetics)", isAvailable: true },
];

app.get(["/api/courts", "/courts"], (_req: Request, res: Response) => {
  res.json(defaultCourts);
});

app.get(["/api/courts/:id", "/courts/:id"], (req: Request, res: Response) => {
  const court = defaultCourts.find((c) => c.id === Number(req.params.id));
  if (!court) {
    res.status(404).json({ error: "Court not found" });
    return;
  }
  res.json(court);
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/submissions", bookingsRouter);

export default app;
