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
      <div className="slot-section-card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading live slots from database…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slot-section-card" style={{ textAlign: 'center', padding: 40, borderColor: '#fca5a5' }}>
        <p style={{ fontWeight: 700, color: '#dc2626' }}>Failed to fetch slots</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{error}</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="slot-section-card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>No Operating Windows Available</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          This resource is not operating on the selected date or time window.
        </p>
      </div>
    );
  }

  // Group slots by Morning (< 12), Afternoon (12 - 17), Evening (>= 17)
  const morningSlots   = slots.filter(s => getHourUTC(s.startDisplay) < 12);
  const afternoonSlots = slots.filter(s => getHourUTC(s.startDisplay) >= 12 && getHourUTC(s.startDisplay) < 17);
  const eveningSlots   = slots.filter(s => getHourUTC(s.startDisplay) >= 17);

  const groups = [
    { title: 'Morning', icon: '☀️', items: morningSlots },
    { title: 'Afternoon', icon: '☀️', items: afternoonSlots },
    { title: 'Evening', icon: '🌙', items: eveningSlots },
  ].filter(g => g.items.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(group => {
        const availableCount = group.items.filter(s => !s.isBooked).length;
        return (
          <div key={group.title} className="slot-section-card">
            <div className="slot-section-header">
              <div className="slot-section-title">
                <span>{group.icon}</span>
                <span>{group.title}</span>
              </div>
              <span className="available-count-pill">
                {availableCount} / {group.items.length} Available
              </span>
            </div>

            <div className="slots-grid-5col">
              {group.items.map(slot => {
                const isBooking = bookingSlot?.startUtc === slot.startUtc;
                const start = formatTime(slot.startDisplay);
                const end   = formatTime(slot.endDisplay);

                return (
                  <div
                    key={slot.startUtc}
                    className={`slot-card-item ${slot.isBooked ? 'booked' : 'available'}`}
                  >
                    <span className="slot-time-title">
                      {start} – {end}
                    </span>

                    {slot.isBooked ? (
                      <span className="booked-pill-gray">Reserved</span>
                    ) : isBooking ? (
                      <button className="book-btn-green" disabled>
                        <span>⌛</span> Booking…
                      </button>
                    ) : (
                      <button
                        className="book-btn-green"
                        onClick={() => onBook(slot)}
                      >
                        <span>📅</span> Book Slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
