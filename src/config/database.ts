import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";

// Fix ECONNREFUSED querySrv error on Windows / local ISP DNS resolvers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is not supported
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((connection) => {
        console.log("MongoDB connected");
        return connection;
      })
      .catch((error: unknown) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}
