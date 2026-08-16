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

export const SlotGrid = ({ slots, loading, error, displayTimezone, onBook, bookingSlot }) => {
  if (loading) {
    return (
      <div className="slot-grid-loading">
        <div className="big-spinner" />
        <p>Loading available slots…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slot-error">
        <span style={{ fontSize: 36 }}>⚠️</span>
        <p style={{ fontWeight: 600, color: 'var(--red)' }}>Could not load slots</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="slot-empty">
        <div className="slot-empty-icon">📭</div>
        <p style={{ fontWeight: 600, fontSize: 16 }}>No slots available today</p>
        <p className="slot-empty-sub">This resource is closed on this day, or no windows are configured.</p>
      </div>
    );
  }

  const available = slots.filter(s => !s.isBooked).length;
  const total = slots.length;

  return (
    <div className="slot-grid-wrapper">
      <div className="slot-grid-header">
        <div className="slot-grid-count">
          <span className="count-num">{available}</span>
          <span className="count-of">/ {total}</span>
          <span className="count-label">slots available</span>
        </div>
        <div className="slot-tz-badge">
          <span>⏱</span>
          <span>{displayTimezone}</span>
        </div>
      </div>

      <div className="slot-grid" role="grid">
        {slots.map(slot => {
          const isBooking = bookingSlot?.startUtc === slot.startUtc;
          const start = formatTime(slot.startDisplay);
          const end   = formatTime(slot.endDisplay);

          return (
            <button
              key={slot.startUtc}
              id={`slot-${slot.startUtc}`}
              className={`slot-btn ${slot.isBooked ? 'booked' : 'available'} ${isBooking ? 'booking' : ''}`}
              onClick={() => !slot.isBooked && !bookingSlot && onBook(slot)}
              disabled={slot.isBooked || !!bookingSlot}
              aria-label={`${slot.isBooked ? 'Booked' : 'Available'}: ${start}–${end}`}
              title={slot.isBooked ? 'Already booked' : `Book ${start}–${end}`}
            >
              <div className="slot-glow" />
              <span className="slot-pip" />
              {isBooking ? (
                <span className="slot-spinner" />
              ) : (
                <>
                  <div className="slot-time-block">
                    <span className="slot-time">{start}</span>
                    <span className="slot-sep">–</span>
                    <span className="slot-time">{end}</span>
                  </div>
                  <span className="slot-label">
                    {slot.isBooked ? 'Booked' : 'Available'}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
