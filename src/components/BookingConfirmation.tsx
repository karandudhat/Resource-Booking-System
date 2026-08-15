import React, { useEffect } from 'react';
import { BookingResult, Slot } from '../types';

interface Props {
  result: BookingResult | null;
  slot: Slot | null;
  displayTimezone: string;
  onClose: () => void;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const BookingConfirmation: React.FC<Props> = ({ result, slot, displayTimezone, onClose }) => {
  // Auto-dismiss success toast after 5 seconds
  useEffect(() => {
    if (result?.success) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [result, onClose]);

  if (!result || !slot) return null;

  if (result.success) {
    const start = formatTime(slot.startDisplay);
    const end   = formatTime(slot.endDisplay);
    return (
      <div className="toast toast-success" role="alert" aria-live="polite" id="booking-success-toast">
        <div className="toast-icon">✅</div>
        <div className="toast-content">
          <div className="toast-title">Booking Confirmed!</div>
          <div className="toast-body">
            {start} – {end} <span className="toast-tz">({displayTimezone})</span>
          </div>
          <div className="toast-id">ID: {result.booking.id.slice(0, 8)}…</div>
        </div>
        <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">×</button>
        <div className="toast-progress" />
      </div>
    );
  }

  // Error / conflict
  const errorResult = result as { success: false; error: string; isConflict: boolean };
  return (
    <div
      className={`toast ${errorResult.isConflict ? 'toast-conflict' : 'toast-error'}`}
      role="alert"
      aria-live="assertive"
      id="booking-error-toast"
    >
      <div className="toast-icon">{errorResult.isConflict ? '⚡' : '❌'}</div>
      <div className="toast-content">
        <div className="toast-title">
          {errorResult.isConflict ? 'Slot Just Taken!' : 'Booking Failed'}
        </div>
        <div className="toast-body">{errorResult.error}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">×</button>
    </div>
  );
};
