/**
 * models/index.ts
 * ────────────────────────────────────────────────────────────────
 * All TypeScript interfaces and DTOs for the Resource Booking System.
 * Centralised here so every layer (controllers, services) imports
 * from one place instead of from each other.
 */

// ── Resource ─────────────────────────────────────────────────────
export interface Resource {
  id: string;
  name: string;
  timezone: string;   // IANA timezone e.g. 'Europe/London'
  created_at: string;
}

export interface AvailabilityWindow {
  id: string;
  resource_id: string;
  day_of_week: number; // 1=Monday … 7=Sunday (ISO)
  start_time: string;  // wall-clock 'HH:MM' in resource timezone
  end_time: string;    // wall-clock 'HH:MM' in resource timezone
}

// ── Slot ─────────────────────────────────────────────────────────
export interface Slot {
  startUtc: string;      // ISO UTC string — used for booking payload
  endUtc: string;        // ISO UTC string — used for booking payload
  startDisplay: string;  // ISO string in the user's display timezone
  endDisplay: string;    // ISO string in the user's display timezone
  isBooked: boolean;
}

// ── Booking ──────────────────────────────────────────────────────
export interface Booking {
  id: string;
  resource_id: string;
  user_id: string;
  start_time: string;  // TIMESTAMPTZ stored as UTC
  end_time: string;    // TIMESTAMPTZ stored as UTC
  created_at: string;
}

// ── DTOs (Data Transfer Objects) ─────────────────────────────────
export interface CreateBookingDto {
  resourceId: string;
  startUtc: string;
  endUtc: string;
  userId?: string;
}
