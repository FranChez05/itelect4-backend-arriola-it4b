import { Router, type Response } from "express";
import { BookingModel } from "../models";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Protect all booking resource routes with authMiddleware
router.use(authMiddleware);

// ROUTE 1: GET ALL - Filtered by token's user
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const bookings = await BookingModel.find({ userId: req.userId });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ROUTE 2: GET ONE BY ID - Filtered by token's user
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const booking = await BookingModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found or unauthorized" });
      return;
    }

    res.status(200).json(booking);
  } catch (error: any) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    console.error("Fetch booking by id error:", error);
    res.status(500).json({ error: "Failed to retrieve booking" });
  }
});

// ROUTE 3: POST CREATE - Attached and filtered by token's user
router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courtId, bookingDate, durationHours, status } = req.body;

    const newBooking = await BookingModel.create({
      userId: req.userId,
      courtId,
      bookingDate: new Date(bookingDate),
      durationHours: durationHours || 1,
      status: status || undefined,
    });

    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error("Create booking error:", error);
    res.status(400).json({ error: error.message || "Failed to create booking" });
  }
});

// ROUTE 4: PUT/UPDATE BY ID - Filtered by token's user
router.put("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updatedBooking = await BookingModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      res.status(404).json({ error: "Booking not found or unauthorized" });
      return;
    }

    res.status(200).json(updatedBooking);
  } catch (error: any) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    console.error("Update booking error:", error);
    res.status(400).json({ error: error.message || "Failed to update booking" });
  }
});

// ROUTE 5: DELETE BY ID - Filtered by token's user
router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deletedBooking = await BookingModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedBooking) {
      res.status(404).json({ error: "Booking not found or unauthorized" });
      return;
    }

    res.status(200).json({ message: "Booking successfully cancelled/deleted", id: req.params.id });
  } catch (error: any) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    console.error("Delete booking error:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
