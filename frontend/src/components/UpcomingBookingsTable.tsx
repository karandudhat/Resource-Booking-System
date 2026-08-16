import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Booking } from '../types';

function formatBookingTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }) + ' UTC';
  } catch {
    return isoString;
  }
}

export const UpcomingBookingsTable = ({ resourceId, resourceName, refreshTrigger, onBookingCanceled }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  // Modal dialog states for canceling (No browser alert)
  const [confirmCancelBooking, setConfirmCancelBooking] = useState<Booking | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBookings = React.useCallback(() => {
    if (!resourceId) return;
    setLoading(true);
    api.getBookings(resourceId)
      .then(data => {
        setBookings(data || []);
      })
      .catch(() => {
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [resourceId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, refreshTrigger]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setOpenActionId(null);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePromptCancel = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenActionId(null);
    setConfirmCancelBooking(booking);
  };

  const executeCancelBooking = async () => {
    if (!confirmCancelBooking) return;
    const id = confirmCancelBooking.id;
    try {
      setCancelingId(id);
      setCancelError(null);
      await api.deleteBooking(id);
      setCancelingId(null);
      setConfirmCancelBooking(null);
      fetchBookings();
      if (onBookingCanceled) onBookingCanceled();
    } catch (err: any) {
      setCancelingId(null);
      setCancelError(err.message || 'Could not cancel booking at this time.');
    }
  };

  return (
    <div className="table-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 className="table-card-title" style={{ margin: 0 }}>Upcoming Bookings</h3>
        {copiedId && (
          <span className="ui-badge ui-badge-success" style={{ fontSize: 11 }}>
            ✓ Reference ID Copied!
          </span>
        )}
      </div>
      
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No bookings recorded yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Book a slot above to see it appear here live in real-time!</p>
        </div>
      ) : (
        <div className="table-scroll-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Resource</th>
                <th>Purpose</th>
                <th>Booked By</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12.5 }}>
                    {formatBookingTime(b.start_time)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{resourceName || 'Resource'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>Scheduled Reserved Slot</td>
                  <td>{b.user_id}</td>
                  <td>
                    <span className="table-status-confirmed">Confirmed</span>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <button
                      className="btn-white"
                      style={{ padding: '4px 8px', fontSize: 13, marginLeft: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === b.id ? null : b.id);
                      }}
                      title="Row actions"
                    >
                      ⋮
                    </button>

                    {/* Interactive Dropdown Menu for 3 dots */}
                    {openActionId === b.id && (
                      <div
                        className="table-action-popover"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="popover-item"
                          onClick={(e) => handleCopyId(b.id, e)}
                        >
                          📋 Copy Ref ID ({b.id.slice(0, 6)}…)
                        </button>
                        <button
                          className="popover-item danger"
                          onClick={(e) => handlePromptCancel(b, e)}
                        >
                          ❌ Cancel Booking
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clean Modal Dialog for Cancel Confirmation (NO Browser alert) */}
      {confirmCancelBooking && (
        <div className="ui-dialog-backdrop" onClick={() => setConfirmCancelBooking(null)}>
          <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <span className="ui-badge ui-badge-warning">Cancel Confirmation</span>
              <h3 className="dialog-title" style={{ marginTop: 8 }}>Cancel Booking?</h3>
              <p className="dialog-description">
                Are you sure you want to cancel this booking for <strong>{resourceName}</strong>? This slot will become available for others to book.
              </p>
            </div>

            <div className="dialog-body-box">
              Ref: {confirmCancelBooking.id}
            </div>

            {cancelError && (
              <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
                {cancelError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="ui-button ui-button-default"
                style={{ background: '#dc2626', flex: 1 }}
                onClick={executeCancelBooking}
                disabled={!!cancelingId}
              >
                {cancelingId ? 'Canceling…' : 'Yes, Cancel Booking'}
              </button>
              <button
                className="ui-button ui-button-outline"
                onClick={() => setConfirmCancelBooking(null)}
                style={{ flex: 1 }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
