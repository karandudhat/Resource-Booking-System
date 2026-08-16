import React from 'react';

function formatTime(isoString) {
  const d = new Date(isoString);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // convert 0 to 12
  return `${h}:${m} ${ampm}`;
}

function generateGoogleCalendarUrl(slot, displayTimezone) {
  try {
    const startStr = slot.startUtc.replace(/-|:|\.\d+/g, '');
    const endStr = slot.endUtc.replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent('Resource Booking');
    const details = encodeURIComponent(`Booking Reference: ${slot.startUtc}\nTimezone: ${displayTimezone}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  } catch (e) {
    return '#';
  }
}

export const BookingConfirmation = ({ result, slot, displayTimezone, onClose }) => {
  if (!result || !slot) return null;

  if (result.success) {
    const start = formatTime(slot.startDisplay);
    const end   = formatTime(slot.endDisplay);
    const gCalUrl = generateGoogleCalendarUrl(slot, displayTimezone);

    return (
      <div className="booking-modal-overlay" onClick={onClose}>
        <div className="booking-modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-icon-ring success">
            ✓
          </div>
          
          <h3 className="modal-title">Booking Confirmed!</h3>
          
          <div className="modal-time-highlight">
            {start} – {end} ({displayTimezone})
          </div>

          <div className="modal-ref-code">
            Ref ID: {result.booking.id}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Your slot has been atomically locked in PostgreSQL database with zero risk of overlap.
          </p>

          <div className="modal-actions">
            <a
              href={gCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-google"
            >
              <span>📅</span> Add to Google Calendar
            </a>
            <button className="btn-secondary-google" onClick={onClose}>
              Done &amp; Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const err = result;
  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-card" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon-ring ${err.isConflict ? 'conflict' : 'error'}`}>
          {err.isConflict ? '⚡' : '✕'}
        </div>
        
        <h3 className="modal-title">
          {err.isConflict ? 'Slot Conflict!' : 'Booking Failed'}
        </h3>

        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
          {err.error}
        </p>

        <div className="modal-actions">
          <button className="btn-secondary-google" onClick={onClose}>
            Close &amp; Pick Another Slot
          </button>
        </div>
      </div>
    </div>
  );
};
