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
    <div className="datepicker-container">
      <label htmlFor="date-input" className="field-label">
        <span>📅</span> Select Booking Date
      </label>
      
      <div className="quick-date-chips">
        <button
          type="button"
          className={`chip-btn ${value === today ? 'active' : ''}`}
          onClick={() => onChange(today)}
        >
          Today
        </button>
        <button
          type="button"
          className={`chip-btn ${value === tomorrow ? 'active' : ''}`}
          onClick={() => onChange(tomorrow)}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={`chip-btn ${value === nextMonday ? 'active' : ''}`}
          onClick={() => onChange(nextMonday)}
        >
          Next Mon
        </button>
      </div>

      <div className="date-input-wrapper">
        <input
          id="date-input"
          type="date"
          className="date-input"
          value={value}
          min={today}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          aria-label="Select booking date"
        />
      </div>
    </div>
  );
};
