import { Router, type Request, type Response } from "express";
import { CourtModel } from "../models";

export const courtsRouter = Router();

// GET all courts (public)
courtsRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const courts = await CourtModel.find().sort({ id: 1 }).lean();
    res.json(courts);
  } catch (error) {
    console.error("Error fetching courts:", error);
    res.status(500).json({ error: "Failed to fetch courts" });
  }
});

// GET single court by id (public)
courtsRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const numericId = Number(req.params.id);
    const court = Number.isNaN(numericId)
      ? await CourtModel.findById(req.params.id).lean()
      : await CourtModel.findOne({ id: numericId }).lean();

    if (!court) {
      res.status(404).json({ error: "Court not found" });
      return;
    }

    res.json(court);
  } catch (error) {
    console.error("Error fetching court by id:", error);
    res.status(500).json({ error: "Failed to fetch court" });
  }
});

export default courtsRouter;
