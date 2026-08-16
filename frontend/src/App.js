import React, { useState, useEffect, useCallback } from 'react';
import { ResourceSelector } from './components/ResourceSelector';
import { DatePicker } from './components/DatePicker';
import { TimezoneSelector, COMMON_TIMEZONES } from './components/TimezoneSelector';
import { SlotGrid } from './components/SlotGrid';
import { BookingConfirmation } from './components/BookingConfirmation';
import { UpcomingBookingsTable } from './components/UpcomingBookingsTable';
import { api } from './api/client';
import { useSlots } from './hooks/useSlots';

/* ── All Resources ─── */
const MOCK_RESOURCES = [
  { id: '33333333-3333-3333-3333-333333333333', name: 'Lab C — Kolkata',     timezone: 'Asia/Kolkata' },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Room A — London',     timezone: 'Europe/London' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Studio B — New York', timezone: 'America/New_York' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Meeting Room D — Tokyo', timezone: 'Asia/Tokyo' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Workspace E — Sydney', timezone: 'Australia/Sydney' },
];

function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (COMMON_TIMEZONES.some(t => t.value === tz)) return tz;
  } catch (e) {}
  return 'Asia/Kolkata';
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLong(dateStr) {
  try {
    return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

export default function App() {
  const [resources,       setResources]       = useState(MOCK_RESOURCES);
  const [resourcesLoading, ] = useState(false);
  const [backendOnline,   setBackendOnline]   = useState(false);

  const [selectedResource, setSelectedResource] = useState(MOCK_RESOURCES[0]);
  const [selectedDate,     setSelectedDate]     = useState(todayString());
  const [displayTimezone,  setDisplayTimezone]  = useState(detectTimezone);

  const [confirmingSlot, setConfirmingSlot] = useState(null);
  const [bookingSlot,    setBookingSlot]    = useState(null);
  const [bookingResult,  setBookingResult]  = useState(null);
  const [resultSlot,     setResultSlot]     = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Step 1: User clicks "Book Slot" → Trigger confirmation prompt
  const handleSlotClick = useCallback((slot) => {
    if (!selectedResource || !backendOnline) return;
    setConfirmingSlot(slot);
  }, [selectedResource, backendOnline]);

  // Step 2: User confirms booking in modal
  const handleConfirmBooking = useCallback(async (slot) => {
    setConfirmingSlot(null);
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
    setRefreshTrigger(prev => prev + 1);
  }, [selectedResource, refresh]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmingSlot(null);
  }, []);

  const dismissResult = useCallback(() => {
    setBookingResult(null);
    setResultSlot(null);
  }, []);

  return (
    <div className="app-wrapper">

      {/* ── Top Navbar Header ────────────────────────────────────────── */}
      <header className="top-navbar">
        <div className="navbar-content">
          <div className="brand-block">
            <div className="brand-icon-box">⚡</div>
            <div className="brand-text-block">
              <h1>Resource Booking</h1>
              <p>Smart workspace scheduling</p>
            </div>
          </div>

          <div className="navbar-right">
            <select
              className="tz-header-select"
              value={displayTimezone}
              onChange={e => setDisplayTimezone(e.target.value)}
            >
              <option value="Asia/Kolkata">🌐 UTC (Asia/Kolkata)</option>
              <option value="Europe/London">🌐 UTC (Europe/London)</option>
              <option value="America/New_York">🌐 UTC (America/New_York)</option>
              <option value="UTC">🌐 UTC (Global)</option>
            </select>

            <div className="gist-pill">
              PostgreSQL GiST Lock
            </div>

            <div className="notification-bell">
              🔔
              <span className="bell-count">3</span>
            </div>

            <div className="user-profile-pill">
              <div className="user-avatar">DU</div>
              <div className="user-details">
                <span className="name">demo-user</span>
                <span className="role">Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Container ──────────────────────────────────── */}
      <main className="main-container">

        {/* ── Left Sidebar Column ────────────────────────────────────── */}
        <aside className="sidebar-column">

          {/* 1. Select Resource */}
          <div className="sidebar-box">
            <h2 className="sidebar-step-title">1. Select Resource</h2>
            <p className="sidebar-step-sub">Choose a room or workspace</p>
            <ResourceSelector
              resources={resources}
              selected={selectedResource}
              onSelect={r => setSelectedResource(r)}
              loading={resourcesLoading}
            />
          </div>

          {/* 2. Booking Date */}
          <div className="sidebar-box">
            <h2 className="sidebar-step-title" style={{ marginBottom: 12 }}>2. Booking Date</h2>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              disabled={false}
            />
          </div>

          {/* 3. Display Timezone */}
          <div className="sidebar-box">
            <h2 className="sidebar-step-title" style={{ marginBottom: 12 }}>3. Display Timezone</h2>
            <TimezoneSelector
              value={displayTimezone}
              onChange={setDisplayTimezone}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              All times are shown in your selected timezone
            </p>
          </div>

          {/* RESOURCE TIMEZONE GRAY CARD */}
          {selectedResource && (
            <div className="resource-tz-gray-card">
              <div className="label">RESOURCE TIMEZONE</div>
              <div className="value">{selectedResource.timezone}</div>
              <div className="desc">
                Availability is evaluated in native timezone via Luxon IANA rules.
              </div>
            </div>
          )}

        </aside>

        {/* ── Right Content Column ────────────────────────────────────── */}
        <section className="content-column">

          {/* Title Banner Row */}
          <div className="resource-header-row">
            <div>
              <div className="resource-title-wrap">
                <h2 className="resource-main-name">{selectedResource?.name}</h2>
                <span className="live-badge">Live</span>
              </div>
              <p className="resource-date-sub">
                {formatDateLong(selectedDate)} • Timezone: UTC ({displayTimezone})
              </p>
            </div>
          </div>

          {/* Slot Grid View */}
          <SlotGrid
            slots={slots}
            loading={slotsLoading}
            error={slotsError}
            displayTimezone={displayTimezone}
            onBook={handleSlotClick}
            bookingSlot={bookingSlot}
          />

          {/* Dynamic Upcoming Bookings Table */}
          <UpcomingBookingsTable
            resourceId={selectedResource?.id}
            resourceName={selectedResource?.name}
            refreshTrigger={refreshTrigger}
          />

        </section>

      </main>

      {/* Booking Confirmation / Modal Flow */}
      <BookingConfirmation
        confirmingSlot={confirmingSlot}
        resourceName={selectedResource?.name}
        result={bookingResult}
        slot={resultSlot}
        displayTimezone={displayTimezone}
        onConfirm={handleConfirmBooking}
        onCancelConfirm={handleCancelConfirm}
        onCloseResult={dismissResult}
      />
    </div>
  );
}
