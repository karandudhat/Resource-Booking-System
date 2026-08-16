import React, { useState, useEffect, useCallback } from 'react';
import { ResourceSelector } from './components/ResourceSelector';
import { DatePicker } from './components/DatePicker';
import { TimezoneSelector, COMMON_TIMEZONES } from './components/TimezoneSelector';
import { SlotGrid } from './components/SlotGrid';
import { BookingConfirmation } from './components/BookingConfirmation';
import { api } from './api/client';
import { useSlots } from './hooks/useSlots';

/* ── Fallback resources (shown when backend is not yet running) ─── */
const FALLBACK_RESOURCES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Room A — London',     timezone: 'Europe/London' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Studio B — New York', timezone: 'America/New_York' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Lab C — Kolkata',     timezone: 'Asia/Kolkata' },
];

function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (COMMON_TIMEZONES.some(t => t.value === tz)) return tz;
  } catch (e) {}
  return 'UTC';
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLong(dateStr) {
  try {
    // Use noon UTC so timezone differences don't flip the date
    return new Date(dateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateStr; }
}

export default function App() {
  const [resources,       setResources]       = useState(FALLBACK_RESOURCES);
  const [resourcesLoading, ] = useState(false);
  const [backendOnline,   setBackendOnline]   = useState(false);

  const [selectedResource, setSelectedResource] = useState(FALLBACK_RESOURCES[0]);
  const [selectedDate,     setSelectedDate]     = useState(todayString());
  const [displayTimezone,  setDisplayTimezone]  = useState(detectTimezone);

  const [bookingSlot,   setBookingSlot]   = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [resultSlot,    setResultSlot]    = useState(null);

  /* Try to load real resources from backend */
  useEffect(() => {
    api.getResources()
      .then(data => {
        if (data && data.length > 0) {
          setResources(data);
          setSelectedResource(data[0]);
          setBackendOnline(true);
        }
      })
      .catch(() => {
        // Backend not running — keep fallback resources, UI still looks great
        setBackendOnline(false);
      });
  }, []);

  const { slots, loading: slotsLoading, error: slotsError, refresh } = useSlots(
    selectedResource ? selectedResource.id : null,
    selectedDate,
    displayTimezone,
  );

  const handleBook = useCallback(async slot => {
    if (!selectedResource || !backendOnline) return;
    setBookingSlot(slot);
    setBookingResult(null);
    const result = await api.createBooking({
      resourceId: selectedResource.id,
      startUtc: slot.startUtc,
      endUtc:   slot.endUtc,
    });
    setBookingSlot(null);
    setResultSlot(slot);
    setBookingResult(result);
    refresh();
  }, [selectedResource, backendOnline, refresh]);

  const dismissResult = useCallback(() => {
    setBookingResult(null);
    setResultSlot(null);
  }, []);

  return (
    <div className="app">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-ring">📆</div>
            <div>
              <h1 className="header-title">Resource Booking</h1>
              <p className="header-subtitle">Reserve shared spaces &amp; consultants</p>
            </div>
          </div>
          <div className="header-user">
            <div className="user-dot" />
            <span className="user-name">demo-user</span>
          </div>
        </div>
      </header>

      <main className="app-main">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sidebar">

          <section className="sidebar-section">
            <h2 className="section-title">Choose a Resource</h2>
            <ResourceSelector
              resources={resources}
              selected={selectedResource}
              onSelect={r => setSelectedResource(r)}
              loading={resourcesLoading}
            />
          </section>

          <section className="sidebar-section">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              disabled={false}
            />
          </section>

          <section className="sidebar-section">
            <TimezoneSelector
              value={displayTimezone}
              onChange={setDisplayTimezone}
            />
          </section>

          {selectedResource && (
            <div className="resource-detail-card">
              <div className="resource-detail-label">Resource Timezone</div>
              <div className="resource-detail-value">{selectedResource.timezone}</div>
              <div className="resource-detail-note">
                Availability is defined in this timezone. DST transitions are handled automatically via IANA rules.
              </div>
            </div>
          )}

        </aside>

        {/* ── Main panel ──────────────────────────────────────── */}
        <section className="content">
          {!selectedResource ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">📅</div>
              <h2>Select a resource to get started</h2>
              <p>Choose a room or studio from the left panel, then pick a date to see available slots.</p>
              <div className="empty-steps">
                <div className="empty-step"><span className="step-num">1</span> Pick a resource</div>
                <div className="empty-step"><span className="step-num">2</span> Choose a date</div>
                <div className="empty-step"><span className="step-num">3</span> Book a slot</div>
              </div>
            </div>
          ) : (
            <>
              <div className="content-header">
                <div>
                  <h2 className="content-title">{selectedResource.name}</h2>
                  <p className="content-subtitle">{formatDateLong(selectedDate)}</p>
                </div>
                {!backendOnline && (
                  <div style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'8px 16px',
                    background:'rgba(245,158,11,0.1)',
                    border:'1px solid rgba(245,158,11,0.25)',
                    borderRadius:'999px',
                    fontSize:12, color:'var(--amber)', fontWeight:600,
                  }}>
                    <span>⚡</span> Backend offline — start with: <code style={{fontFamily:'monospace', background:'rgba(255,255,255,0.06)', padding:'2px 6px', borderRadius:4}}>npm run start:dev</code>
                  </div>
                )}
              </div>

              {!backendOnline ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">🔌</div>
                  <h2>Backend not connected</h2>
                  <p>Start the NestJS backend and PostgreSQL to see real availability and make bookings.</p>
                  <div className="empty-steps">
                    <div className="empty-step"><span className="step-num">1</span><code style={{fontFamily:'monospace',fontSize:11}}>docker-compose up postgres -d</code></div>
                    <div className="empty-step"><span className="step-num">2</span><code style={{fontFamily:'monospace',fontSize:11}}>cd backend && npm run migrate && npm run seed</code></div>
                    <div className="empty-step"><span className="step-num">3</span><code style={{fontFamily:'monospace',fontSize:11}}>npm run start:dev</code></div>
                  </div>
                </div>
              ) : (
                <SlotGrid
                  slots={slots}
                  loading={slotsLoading}
                  error={slotsError}
                  displayTimezone={displayTimezone}
                  onBook={handleBook}
                  bookingSlot={bookingSlot}
                />
              )}
            </>
          )}
        </section>

      </main>

      <BookingConfirmation
        result={bookingResult}
        slot={resultSlot}
        displayTimezone={displayTimezone}
        onClose={dismissResult}
      />
    </div>
  );
}
