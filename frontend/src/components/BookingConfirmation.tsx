import React, { useEffect, useState } from 'react';

function formatTime(isoString) {
  const d = new Date(isoString);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // convert 0 to 12
  return `${h}:${m} ${ampm}`;
}

export const BookingConfirmation = ({
  confirmingSlot,
  resourceName,
  result,
  slot,
  displayTimezone,
  onConfirm,
  onCancelConfirm,
  onCloseResult,
}) => {
  const [countdown, setCountdown] = useState<number>(4);

  // Auto-close success modal after 4 seconds
  useEffect(() => {
    if (result?.success) {
      setCountdown(4);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onCloseResult();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [result, onCloseResult]);

  // Step 1: User clicked "Book Slot" → Ask for Confirmation
  if (confirmingSlot) {
    const start = formatTime(confirmingSlot.startDisplay);
    const end   = formatTime(confirmingSlot.endDisplay);
    return (
      <div className="ui-dialog-backdrop" onClick={onCancelConfirm}>
        <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
          <div className="dialog-header">
            <span className="ui-badge ui-badge-warning">Confirmation Required</span>
            <h3 className="dialog-title" style={{ marginTop: 8 }}>Confirm Booking</h3>
            <p className="dialog-description">
              Are you sure you want to reserve this slot for <strong>{resourceName}</strong>?
            </p>
          </div>

          <div className="dialog-body-box">
            {start} – {end} ({displayTimezone})
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              className="ui-button ui-button-default"
              onClick={() => onConfirm(confirmingSlot)}
              style={{ flex: 1 }}
            >
              Confirm &amp; Reserve
            </button>
            <button
              className="ui-button ui-button-outline"
              onClick={onCancelConfirm}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Show Result (Success / Error)
  if (!result || !slot) return null;

  if (result.success) {
    const start = formatTime(slot.startDisplay);
    const end   = formatTime(slot.endDisplay);

    return (
      <div className="ui-dialog-backdrop" onClick={onCloseResult}>
        <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
          <div className="dialog-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="ui-badge ui-badge-success">Confirmed</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-closing in {countdown}s</span>
            </div>
            <h3 className="dialog-title" style={{ marginTop: 8 }}>Booking Confirmed!</h3>
            <p className="dialog-description">
              Your slot has been atomically reserved in the database.
            </p>
          </div>

          <div className="dialog-body-box">
            {start} – {end} ({displayTimezone})
          </div>

          <div style={{ marginTop: 8 }}>
            <button className="ui-button ui-button-outline" onClick={onCloseResult}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  const err = result;
  return (
    <div className="ui-dialog-backdrop" onClick={onCloseResult}>
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
          <button className="ui-button ui-button-secondary" onClick={onCloseResult}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
