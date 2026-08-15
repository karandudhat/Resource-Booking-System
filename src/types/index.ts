// Shared TypeScript types for the frontend

export interface Resource {
  id: string;
  name: string;
  timezone: string;
}

export interface Slot {
  startUtc: string;
  endUtc: string;
  startDisplay: string; // ISO string in the user's chosen timezone
  endDisplay: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CreateBookingPayload {
  resourceId: string;
  startUtc: string;
  endUtc: string;
  userId?: string;
}

export type BookingResult =
  | { success: true; booking: Booking }
  | { success: false; error: string; isConflict: boolean };
