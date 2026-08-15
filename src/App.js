import React, { useState, useEffect, useCallback } from 'react';
import { ResourceSelector } from './components/ResourceSelector';
import { DatePicker } from './components/DatePicker';
import { TimezoneSelector, COMMON_TIMEZONES } from './components/TimezoneSelector';
import { SlotGrid } from './components/SlotGrid';
import { BookingConfirmation } from './components/BookingConfirmation';
import { api } from './api/client';
import { useSlots } from './hooks/useSlots';

// Detect the user's browser timezone, falling back to UTC
function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (COMMON_TIMEZONES.some((t) => t.value === tz)) return tz;
  } catch (e) {}
  return 'UTC';
}

// Format today as YYYY-MM-DD
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function App() {
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [displayTimezone, setDisplayTimezone] = useState(detectTimezone());

  // Booking state
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [resultSlot, setResultSlot] = useState(null);

  // Fetch resources on mount
  useEffect(() => {
    api.getResources()
      .then((data) => {
        setResources(data);
        setResourcesLoading(false);
        if (data.length > 0) setSelectedResource(data[0]);
      })
      .catch(() => setResourcesLoading(false));
  }, []);

  // Fetch slots reactively
  const { slots, loading: slotsLoading, error: slotsError, refresh } = useSlots(
    selectedResource ? selectedResource.id : null,
    selectedDate,
    displayTimezone,
  );

  const handleBook = useCallback(async (slot) => {
    if (!selectedResource) return;
    setBookingSlot(slot);
    setBookingResult(null);

    const result = await api.createBooking({
      resourceId: selectedResource.id,
      startUtc: slot.startUtc,
      endUtc: slot.endUtc,
    });

    setBookingSlot(null);
    setResultSlot(slot);
    setBookingResult(result);
    refresh();
  }, [selectedResource, refresh]);

  const dismissResult = useCallback(() => {
    setBookingResult(null);
    setResultSlot(null);
  }, []);

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header" role="banner">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">📆</span>
            <div>
              <h1 className="header-title">Resource Booking</h1>
              <p className="header-subtitle">Reserve shared spaces &amp; consultants</p>
            </div>
          </div>
          <div className="header-user">
            <span className="user-avatar">👤</span>
            <span className="user-name">demo-user</span>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        {/* ── Left sidebar ─────────────────────────────────── */}
        <aside className="sidebar" aria-label="Booking options">
          <section className="sidebar-section">
            <h2 className="section-title">Choose a Resource</h2>
            <ResourceSelector
              resources={resources}
              selected={selectedResource}
              onSelect={(r) => setSelectedResource(r)}
              loading={resourcesLoading}
            />
          </section>

          <section className="sidebar-section">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              disabled={!selectedResource}
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
              <div className="resource-detail-label">Resource timezone</div>
              <div className="resource-detail-value">{selectedResource.timezone}</div>
              <div className="resource-detail-note">
                Availability is defined in this timezone. DST transitions are
                automatically handled.
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <section className="content" aria-label="Available time slots">
          {!selectedResource ? (
            <div className="empty-state">
              <div className="empty-icon">👈</div>
              <h2>Select a resource to get started</h2>
              <p>Choose from the rooms and studios on the left.</p>
            </div>
          ) : (
            <>
              <div className="content-header">
                <div>
                  <h2 className="content-title">{selectedResource.name}</h2>
                  <p className="content-subtitle">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <SlotGrid
                slots={slots}
                loading={slotsLoading}
                error={slotsError}
                displayTimezone={displayTimezone}
                onBook={handleBook}
                bookingSlot={bookingSlot}
              />
            </>
          )}
        </section>
      </main>

      {/* ── Toast notification ───────────────────────────── */}
      <BookingConfirmation
        result={bookingResult}
        slot={resultSlot}
        displayTimezone={displayTimezone}
        onClose={dismissResult}
      />
    </div>
  );
}

export default App;
