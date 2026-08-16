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
      <div className="ui-dialog-backdrop" onClick={onClose}>
        <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
          <div className="dialog-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="ui-badge ui-badge-success">Confirmed</span>
              <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Ref: {result.booking.id.slice(0, 8)}</span>
            </div>
            <h3 className="dialog-title" style={{ marginTop: 8 }}>Booking Confirmed</h3>
            <p className="dialog-description">
              Your resource slot has been atomically reserved.
            </p>
          </div>

          <div className="dialog-body-box">
            {start} – {end} ({displayTimezone})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <a
              href={gCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-button ui-button-default"
              style={{ textDecoration: 'none' }}
            >
              Add to Google Calendar
            </a>
            <button className="ui-button ui-button-outline" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  const err = result;
  return (
    <div className="ui-dialog-backdrop" onClick={onClose}>
      <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="ui-badge ui-badge-warning">{err.isConflict ? 'Slot Conflict' : 'Booking Error'}</span>
          <h3 className="dialog-title" style={{ marginTop: 8 }}>
            {err.isConflict ? 'Slot Already Booked' : 'Could Not Process'}
          </h3>
          <p className="dialog-description">
            {err.error}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="ui-button ui-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
