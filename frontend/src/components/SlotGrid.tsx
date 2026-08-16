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
      <div className="ui-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>Loading available slots…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-card" style={{ padding: 40, textAlign: 'center', borderColor: 'hsl(var(--destructive))' }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'hsl(var(--destructive))' }}>Error loading slots</p>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{error}</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="ui-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>No slots available</p>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          This resource has no operating hours on the selected date.
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map(group => {
        const availableCount = group.items.filter(s => !s.isBooked).length;
        return (
          <div key={group.title} className="ui-card slot-group-card">
            <div className="ui-card-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{group.icon}</span>
                <span className="ui-card-title" style={{ fontSize: 16 }}>{group.title}</span>
              </div>
              <span className="ui-badge ui-badge-secondary">
                {availableCount} / {group.items.length} Available
              </span>
            </div>

            <div className="ui-card-content">
              <div className="slot-grid-layout">
                {group.items.map(slot => {
                  const isBooking = bookingSlot?.startUtc === slot.startUtc;
                  const start = formatTime(slot.startDisplay);
                  const end   = formatTime(slot.endDisplay);

                  return (
                    <button
                      key={slot.startUtc}
                      className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}
                      onClick={() => !slot.isBooked && !bookingSlot && onBook(slot)}
                      disabled={slot.isBooked || !!bookingSlot}
                    >
                      <span className="slot-time-text">
                        {start} – {end}
                      </span>
                      
                      {isBooking ? (
                        <span className="ui-badge ui-badge-secondary" style={{ fontSize: 11 }}>Booking…</span>
                      ) : (
                        <span className={`ui-badge ${slot.isBooked ? 'ui-badge-outline' : 'ui-badge-success'}`} style={{ fontSize: 11 }}>
                          {slot.isBooked ? 'Reserved' : 'Book Slot'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
