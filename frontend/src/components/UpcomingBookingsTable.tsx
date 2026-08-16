import React from 'react';

export const UpcomingBookingsTable = ({ resourceName }) => {
  const sampleBookings = [
    {
      time: '17 Aug 2026, 05:30 AM',
      resource: resourceName || 'Lab C — Kolkata',
      purpose: 'System Maintenance',
      user: 'demo-user',
      status: 'Confirmed',
    },
    {
      time: '18 Aug 2026, 10:30 AM',
      resource: resourceName || 'Lab C — Kolkata',
      purpose: 'Team Meeting',
      user: 'demo-user',
      status: 'Confirmed',
    },
  ];

  return (
    <div className="table-card">
      <h3 className="table-card-title">Upcoming Bookings</h3>
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
            {sampleBookings.map((b, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12.5 }}>{b.time}</td>
                <td style={{ fontWeight: 600 }}>{b.resource}</td>
                <td style={{ color: 'var(--text-muted)' }}>{b.purpose}</td>
                <td>{b.user}</td>
                <td>
                  <span className="table-status-confirmed">{b.status}</span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}>⋮</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a href="#all-bookings" onClick={e => e.preventDefault()} className="view-all-link">
        View all bookings →
      </a>
    </div>
  );
};
