import { Resource, Slot, Booking, CreateBookingPayload, BookingResult } from '../types';

// In dev, CRA proxies /api → http://localhost:3001 (via "proxy" in package.json)
const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getResources(): Promise<Resource[]> {
    return get('/resources');
  },

  getSlots(resourceId: string, date: string, timezone: string): Promise<Slot[]> {
    const params = new URLSearchParams({ resourceId, date, timezone });
    return get(`/slots?${params}`);
  },

  async createBooking(payload: CreateBookingPayload): Promise<BookingResult> {
    const res = await fetch(`${BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user', ...payload }),
    });

    if (res.status === 201) {
      const booking: Booking = await res.json();
      return { success: true, booking };
    }

    const body = await res.json().catch(() => ({ message: 'Unknown error' }));
    return {
      success: false,
      error: body.message ?? `HTTP ${res.status}`,
      isConflict: res.status === 409,
    };
  },
};
