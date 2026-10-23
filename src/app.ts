import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { authRouter, bookingsRouter, courtsRouter } from "./routes";

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
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
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
      register: "/api/auth/register",
      login: "/api/auth/login",
    },
  });
});

// Health check route - verifies database connection status
app.get("/api/health", (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({ status: "ok", db: isDbConnected });
});

// Reference resource routes: Courts (public GET routes querying MongoDB)
app.use("/api/courts", courtsRouter);
app.use("/courts", courtsRouter);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/submissions", bookingsRouter);

// 404 catch-all handler for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${_req.method} ${_req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

export default app;

