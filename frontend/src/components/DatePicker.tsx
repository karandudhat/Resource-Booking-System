import React from 'react';

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function tomorrowLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function nextMondayLocal() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export const DatePicker = ({ value, onChange, disabled }) => {
  const today = todayLocal();
  const tomorrow = tomorrowLocal();
  const nextMonday = nextMondayLocal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="ui-label">Booking Date</label>
      
      <div className="ui-tabs-list">
        <button
          type="button"
          className={`ui-tabs-trigger ${value === today ? 'active' : ''}`}
          onClick={() => onChange(today)}
        >
          Today
        </button>
        <button
          type="button"
          className={`ui-tabs-trigger ${value === tomorrow ? 'active' : ''}`}
          onClick={() => onChange(tomorrow)}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={`ui-tabs-trigger ${value === nextMonday ? 'active' : ''}`}
          onClick={() => onChange(nextMonday)}
        >
          Next Mon
        </button>
      </div>

      <input
        type="date"
        className="ui-input"
        value={value}
        min={today}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Select booking date"
      />
    </div>
  );
};
