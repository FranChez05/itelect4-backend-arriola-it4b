import { Schema, model, type Document, Types } from "mongoose";
import { BookingStatus } from "../types";

export interface IBookingDocument extends Document {
  id?: number;
  userId: Types.ObjectId | string;
  courtId: number;
  bookingDate: Date;
  durationHours: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBookingDocument>(
  {
    id: {
      type: Number,
      index: true,
    },
    // Rule 1 (Required): userId, courtId, bookingDate are required
    userId: {
      type: Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
    courtId: {
      type: Number,
      required: [true, "Court ID is required"],
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    // Rule 2 (Min / Max): durationHours must be between 1 and 8 hours
    durationHours: {
      type: Number,
      required: true,
      min: [1, "Booking must be at least 1 hour"],
      max: [8, "Booking cannot exceed 8 hours"],
      default: 1,
    },
    // Rule 3 (Enum): status must be one of the predefined BookingStatus enum values
    status: {
      type: String,
      enum: {
        values: Object.values(BookingStatus),
        message: "Status must be pending, approved, declined, cancelled, or completed",
      },
      default: BookingStatus.Pending,
    },
  },
  {
    timestamps: true,
  }
);

export const BookingModel = model<IBookingDocument>("Booking", bookingSchema);
export default BookingModel;
