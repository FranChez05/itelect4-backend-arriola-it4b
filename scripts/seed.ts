import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database";
import { CourtModel } from "../src/models";

const initialCourts = [
  { id: 1, name: "Court A - Main Arena", location: "Main Gym (Wood Floor)", isAvailable: true },
  { id: 2, name: "Court B - Side Arena", location: "Main Gym (Rubber Floor)", isAvailable: true },
  { id: 3, name: "Court C - VIP Hall", location: "VIP Complex (AC Room)", isAvailable: false },
  { id: 4, name: "Court D - Outdoor Arena", location: "East Annex (Synthetics)", isAvailable: true },
];

async function seedDatabase(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");
    await connectDatabase();

    console.log("Clearing existing courts...");
    await CourtModel.deleteMany({});

    console.log("Seeding reference courts...");
    const createdCourts = await CourtModel.insertMany(initialCourts);
    console.log(`Successfully seeded ${createdCourts.length} courts.`);

    await mongoose.disconnect();
    console.log("Database disconnected. Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
}

void seedDatabase();
