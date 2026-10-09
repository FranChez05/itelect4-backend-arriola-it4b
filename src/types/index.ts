export type UserRole = "player" | "admin";

// Regular enum
export enum BookingStatus {
  Pending = "pending",
  Approved = "approved",
  Declined = "declined",
  Cancelled = "cancelled",
  Completed = "completed",
}

// INTERFACES FROM SESSION 1
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Court {
  id: number;
  name: string;
  location: string;
  isAvailable: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  courtId: number;
  bookingDate: Date;
  durationHours: number;
  status: BookingStatus;
}

// GENERIC INTERFACE
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// UTILITY TYPES
export type UserUpdate = Partial<User>;
export type PublicUser = Omit<User, "email" | "isActive">;

// API TYPES
export type ApiBooking = Omit<Booking, "bookingDate"> & {
  bookingDate: string;
};

export type CreateCourtInput = Omit<Court, "id">;
export type CreateBookingInput = Omit<Booking, "id" | "bookingDate"> & {
  bookingDate: string | Date;
};
export type CreateUserInput = Omit<User, "id">;
