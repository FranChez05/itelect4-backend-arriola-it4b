import { Router, type Response } from "express";
import { BookingModel } from "../models";
import { BookingStatus } from "../types";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

function bookingScope(req: AuthenticatedRequest): Record<string, unknown> {
  return req.user?.role === "admin" ? {} : { userId: req.userId };
}

router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const bookings = await BookingModel.find(bookingScope(req)).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const booking = await BookingModel.findOne({ _id: req.params.id, ...bookingScope(req) });
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

router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courtId, bookingDate, durationHours } = req.body ?? {};
    const newBooking = await BookingModel.create({
      userId: req.userId,
      courtId,
      bookingDate: new Date(bookingDate),
      durationHours,
      status: BookingStatus.Pending,
    });
    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error("Create booking error:", error);
    res.status(400).json({ error: error.message || "Failed to create booking" });
  }
});

async function updateBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
  const nextStatus = req.body?.status;
  if (!Object.values(BookingStatus).includes(nextStatus)) {
    res.status(400).json({ error: "A valid booking status is required" });
    return;
  }

  try {
    const filter = { _id: req.params.id, ...bookingScope(req) };
    const current = await BookingModel.findOne(filter);
    if (!current) {
      res.status(404).json({ error: "Booking not found or unauthorized" });
      return;
    }

    const isAdmin = req.user?.role === "admin";
    const canTransition = isAdmin
      ? (current.status === BookingStatus.Pending && [BookingStatus.Approved, BookingStatus.Declined, BookingStatus.Cancelled].includes(nextStatus))
        || (current.status === BookingStatus.Approved && [BookingStatus.Completed, BookingStatus.Cancelled].includes(nextStatus))
      : [BookingStatus.Pending, BookingStatus.Approved].includes(current.status) && nextStatus === BookingStatus.Cancelled;
    if (!canTransition) {
      res.status(400).json({ error: `Cannot change booking from ${current.status} to ${nextStatus}` });
      return;
    }

    const updatedBooking = await BookingModel.findOneAndUpdate(
      { ...filter, status: current.status },
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    );
    if (!updatedBooking) {
      res.status(409).json({ error: "This booking changed before the update completed. Refresh and try again." });
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
}

router.patch("/:id", updateBooking);
router.put("/:id", updateBooking);

router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deletedBooking = await BookingModel.findOneAndDelete({ _id: req.params.id, ...bookingScope(req) });
    if (!deletedBooking) {
      res.status(404).json({ error: "Booking not found or unauthorized" });
      return;
    }
    res.status(200).json({ message: "Booking successfully deleted", id: req.params.id });
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
