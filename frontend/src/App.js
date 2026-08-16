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

      {/* ── Google Material Header ───────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-badge">📅</div>
            <div className="header-title-group">
              <h1 className="header-title">
                Resource Booking <span className="header-tag">Enterprise</span>
              </h1>
              <p className="header-subtitle">Google Workspace Calendar Engine &amp; Slot Management</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="system-status-pill">
              <span className="status-dot-animated" />
              <span>PostgreSQL GiST Active</span>
            </div>
            
            <div className="header-user">
              <div className="user-avatar">D</div>
              <span className="user-name">demo-user</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sidebar">

          <div className="sidebar-card">
            <h2 className="section-title">
              <span>Select Resource</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>{resources.length} available</span>
            </h2>
            <ResourceSelector
              resources={resources}
              selected={selectedResource}
              onSelect={r => setSelectedResource(r)}
              loading={resourcesLoading}
            />
          </div>

          <div className="sidebar-card">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              disabled={false}
            />
          </div>

          <div className="sidebar-card">
            <TimezoneSelector
              value={displayTimezone}
              onChange={setDisplayTimezone}
            />
          </div>

          {selectedResource && (
            <div className="resource-detail-card">
              <div className="resource-detail-label">Resource Native Timezone</div>
              <div className="resource-detail-value">{selectedResource.timezone}</div>
              <div className="resource-detail-note">
                Availability rules are enforced in native timezone. Conversions to your display timezone are rendered seamlessly via Luxon IANA rules.
              </div>
            </div>
          )}

        </aside>

        {/* ── Main panel ──────────────────────────────────────── */}
        <section className="content">
          {!selectedResource ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">📅</div>
              <h2>Select a Resource to Get Started</h2>
              <p>Choose a meeting space or consultant room from the left sidebar to view availability.</p>
            </div>
          ) : (
            <>
              <div className="content-header-card">
                <div>
                  <h2 className="header-info-title">{selectedResource.name}</h2>
                  <p className="header-info-subtitle">
                    <span>🗓️ {formatDateLong(selectedDate)}</span>
                    <span>•</span>
                    <span>🌐 Viewing in {displayTimezone}</span>
                  </p>
                </div>
                {!backendOnline && (
                  <div className="badge-offline">
                    <span>⚡</span> Backend offline — run <code style={{fontFamily:'monospace'}}>npm run start:dev</code>
                  </div>
                )}
              </div>

              {!backendOnline ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap">🔌</div>
                  <h2>Connecting to Backend Engine…</h2>
                  <p>Start the NestJS backend and PostgreSQL database to view live real-time slots and execute bookings.</p>
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
