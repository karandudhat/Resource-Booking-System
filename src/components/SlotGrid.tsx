import React from 'react';
import { Slot } from '../types';

interface Props {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  displayTimezone: string;
  onBook: (slot: Slot) => void;
  bookingSlot: Slot | null; // the slot currently being booked (shows spinner)
}

function formatTime(isoString: string): string {
  // Parse the ISO string — it already has timezone offset baked in by the backend
  const d = new Date(isoString);
  // The startDisplay/endDisplay are ISO strings in the requested timezone,
  // so we just show the hours:minutes portion.
  // Since the date string is already offset-adjusted, we use UTC getters to
  // read the "display" hour which IS the local hour in the target timezone.
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const SlotGrid: React.FC<Props> = ({
  slots,
  loading,
  error,
  displayTimezone,
  onBook,
  bookingSlot,
}) => {
  if (loading) {
    return (
      <div className="slot-grid-loading">
        <div className="spinner" />
        <p>Loading slots…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slot-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="slot-empty">
        <span className="slot-empty-icon">📭</span>
        <p>No slots available on this day.</p>
        <p className="slot-empty-sub">The resource may be closed on weekends or this date.</p>
      </div>
    );
  }

  const available = slots.filter((s) => !s.isBooked).length;
  const total     = slots.length;

  return (
    <div className="slot-grid-wrapper">
      <div className="slot-grid-header">
        <span className="slot-grid-count">
          <span className="count-available">{available}</span>
          <span className="count-sep"> of </span>
          <span className="count-total">{total}</span>
          <span className="count-label"> slots available</span>
        </span>
        <span className="slot-tz-badge">⏱ {displayTimezone}</span>
      </div>

      <div className="slot-grid" role="grid" aria-label="Available time slots">
        {slots.map((slot) => {
          const isBooking = bookingSlot?.startUtc === slot.startUtc;
          const startTime = formatTime(slot.startDisplay);
          const endTime   = formatTime(slot.endDisplay);

          return (
            <button
              key={slot.startUtc}
              id={`slot-${slot.startUtc}`}
              className={`slot-btn ${slot.isBooked ? 'booked' : 'available'} ${isBooking ? 'booking' : ''}`}
              onClick={() => !slot.isBooked && !isBooking && onBook(slot)}
              disabled={slot.isBooked || !!bookingSlot}
              aria-label={`${slot.isBooked ? 'Booked' : 'Available'}: ${startTime} – ${endTime}`}
              title={slot.isBooked ? 'Already booked' : `Book ${startTime}–${endTime}`}
            >
              {isBooking ? (
                <span className="slot-spinner" />
              ) : (
                <>
                  <span className="slot-time">{startTime}</span>
                  <span className="slot-sep">–</span>
                  <span className="slot-time">{endTime}</span>
                  <span className="slot-status-dot" />
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
