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

function getHourUTC(isoString) {
  return new Date(isoString).getUTCHours();
}

export const SlotGrid = ({ slots, loading, error, displayTimezone, onBook, bookingSlot }) => {
  if (loading) {
    return (
      <div className="time-group-card" style={{ padding: 40, textAlign: 'center' }}>
        <div className="slot-spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
        <p style={{ fontWeight: 600, color: 'var(--text-2)' }}>Fetching real-time slot availability…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="time-group-card" style={{ padding: 40, textAlign: 'center', borderColor: 'var(--error)' }}>
        <span style={{ fontSize: 40 }}>⚠️</span>
        <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--g-red)', marginTop: 8 }}>Failed to connect to backend</p>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{error}</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="time-group-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>No Operating Windows Available</p>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
          This resource is closed on this day or no availability windows match your timezone filter.
        </p>
      </div>
    );
  }

  // Group slots by Morning (< 12), Afternoon (12 - 17), Evening (>= 17)
  const morningSlots   = slots.filter(s => getHourUTC(s.startDisplay) < 12);
  const afternoonSlots = slots.filter(s => getHourUTC(s.startDisplay) >= 12 && getHourUTC(s.startDisplay) < 17);
  const eveningSlots   = slots.filter(s => getHourUTC(s.startDisplay) >= 17);

  const groups = [
    { title: 'Morning', icon: '🌅', items: morningSlots },
    { title: 'Afternoon', icon: '☀️', items: afternoonSlots },
    { title: 'Evening', icon: '🌙', items: eveningSlots },
  ].filter(g => g.items.length > 0);

  return (
    <div className="slot-section-container">
      {groups.map(group => {
        const availableCount = group.items.filter(s => !s.isBooked).length;
        return (
          <div key={group.title} className="time-group-card">
            <div className="group-header">
              <div className="group-title-block">
                <span className="group-icon">{group.icon}</span>
                <span className="group-title">{group.title}</span>
              </div>
              <span className="group-count-badge">
                {availableCount} of {group.items.length} available
              </span>
            </div>

            <div className="slot-grid" role="grid">
              {group.items.map(slot => {
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
                    {isBooking ? (
                      <span className="slot-spinner" />
                    ) : (
                      <>
                        <div className="slot-time-block">
                          <span className="slot-time">{start}</span>
                          <span className="slot-sep">–</span>
                          <span className="slot-time">{end}</span>
                        </div>
                        <span className="slot-status-pill">
                          {slot.isBooked ? 'Reserved' : 'Book'}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
