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
    <div className="shadcn-app">

      {/* ── Navbar Header ─────────────────────────────────────────────── */}
      <header className="shadcn-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="brand-icon">⚡</div>
            <div>
              <h1 className="brand-title">Resource Booking</h1>
              <p className="brand-subtitle">shadcn/ui Design Engine</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="ui-badge ui-badge-success">
              PostgreSQL GiST Lock
            </span>
            <span className="ui-badge ui-badge-outline" style={{ fontFamily: 'monospace' }}>
              demo-user
            </span>
          </div>
        </div>
      </header>

      <main className="app-main">

        {/* ── Sidebar Panel ────────────────────────────────────────── */}
        <aside className="sidebar-panel">

          <div className="ui-card">
            <div className="ui-card-header">
              <span className="ui-card-title">Select Resource</span>
              <span className="ui-card-description">Choose a room or workspace</span>
            </div>
            <div className="ui-card-content">
              <ResourceSelector
                resources={resources}
                selected={selectedResource}
                onSelect={r => setSelectedResource(r)}
                loading={resourcesLoading}
              />
            </div>
          </div>

          <div className="ui-card">
            <div className="ui-card-content" style={{ paddingTop: 24 }}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={false}
              />
            </div>
          </div>

          <div className="ui-card">
            <div className="ui-card-content" style={{ paddingTop: 24 }}>
              <TimezoneSelector
                value={displayTimezone}
                onChange={setDisplayTimezone}
              />
            </div>
          </div>

          {selectedResource && (
            <div className="ui-card" style={{ background: 'hsl(var(--muted))', borderColor: 'transparent' }}>
              <div className="ui-card-content" style={{ padding: 16 }}>
                <span className="ui-label" style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>
                  Resource Timezone
                </span>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{selectedResource.timezone}</div>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 4, lineHeight: 1.4 }}>
                  Availability is evaluated in native timezone via Luxon IANA rules.
                </p>
              </div>
            </div>
          )}

        </aside>

        {/* ── Content Panel ────────────────────────────────────────── */}
        <section className="content-panel">
          {!selectedResource ? (
            <div className="ui-card" style={{ padding: 60, textAlign: 'center' }}>
              <h2 className="ui-card-title">Select a Resource</h2>
              <p className="ui-card-description">Pick a room or consultant from the sidebar to view available booking slots.</p>
            </div>
          ) : (
            <>
              <div className="ui-card">
                <div className="ui-card-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 className="ui-card-title" style={{ fontSize: 20 }}>{selectedResource.name}</h2>
                    <p className="ui-card-description" style={{ marginTop: 2 }}>
                      {formatDateLong(selectedDate)} • Timezone: {displayTimezone}
                    </p>
                  </div>

                  {!backendOnline && (
                    <span className="ui-badge ui-badge-warning">
                      Backend Offline
                    </span>
                  )}
                </div>
              </div>

              {!backendOnline ? (
                <div className="ui-card" style={{ padding: 40, textAlign: 'center' }}>
                  <h3 className="ui-card-title">Backend Connection Required</h3>
                  <p className="ui-card-description" style={{ marginTop: 4 }}>
                    Start NestJS and PostgreSQL to interact with live database availability.
                  </p>
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
