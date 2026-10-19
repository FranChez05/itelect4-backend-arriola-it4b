import { Schema, model, type Document } from "mongoose";

export interface ICourtDocument extends Document {
  id: number;
  name: string;
  location: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courtSchema = new Schema<ICourtDocument>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Court name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Court location is required"],
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CourtModel = model<ICourtDocument>("Court", courtSchema);
export default CourtModel;
