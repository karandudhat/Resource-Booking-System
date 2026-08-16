import React, { useEffect } from 'react';

function formatTime(isoString) {
  const d = new Date(isoString);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // convert 0 to 12
  return `${h}:${m} ${ampm}`;
}

export const BookingConfirmation = ({ result, slot, displayTimezone, onClose }) => {
  useEffect(() => {
    if (result?.success) {
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [result, onClose]);

  if (!result || !slot) return null;

  if (result.success) {
    const start = formatTime(slot.startDisplay);
    const end   = formatTime(slot.endDisplay);
    return (
      <div className="toast toast-success" role="alert" id="booking-success-toast">
        <div className="toast-icon-wrap">✅</div>
        <div className="toast-content">
          <div className="toast-title">Booking Confirmed!</div>
          <div className="toast-body">
            {start} – {end} <span className="toast-tz">({displayTimezone})</span>
          </div>
          <div className="toast-id">Ref: {result.booking.id.slice(0,8)}…</div>
        </div>
        <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
        <div className="toast-bar" />
      </div>
    );
  }

  const err = result;
  return (
    <div
      className={`toast ${err.isConflict ? 'toast-conflict' : 'toast-error'}`}
      role="alert"
      id="booking-error-toast"
    >
      <div className="toast-icon-wrap">{err.isConflict ? '⚡' : '❌'}</div>
      <div className="toast-content">
        <div className="toast-title">
          {err.isConflict ? 'Slot Just Taken!' : 'Booking Failed'}
        </div>
        <div className="toast-body">{err.error}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
    </div>
  );
};
