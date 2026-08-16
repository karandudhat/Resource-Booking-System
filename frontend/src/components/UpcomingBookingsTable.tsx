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

export const UpcomingBookingsTable = ({ resourceId, resourceName, refreshTrigger }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
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
  }, [resourceId, refreshTrigger]);

  return (
    <div className="table-card">
      <h3 className="table-card-title">Upcoming Bookings</h3>
      
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No bookings recorded yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Book a slot above to see it appear here live in real-time!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Resource</th>
                <th>Purpose</th>
                <th>Booked By</th>
                <th>Status</th>
                <th>Actions</th>
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
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}>⋮</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
