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

function nextWeekLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export const DatePicker = ({ value, onChange, disabled }) => {
  const today = todayLocal();
  const tomorrow = tomorrowLocal();
  const nextWeek = nextWeekLocal();

  return (
    <div>
      <div className="date-tab-group">
        <button
          type="button"
          className={`date-tab-btn ${value === today ? 'active' : ''}`}
          onClick={() => onChange(today)}
        >
          Today
        </button>
        <button
          type="button"
          className={`date-tab-btn ${value === tomorrow ? 'active' : ''}`}
          onClick={() => onChange(tomorrow)}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={`date-tab-btn ${value === nextWeek ? 'active' : ''}`}
          onClick={() => onChange(nextWeek)}
        >
          Next 7 Days
        </button>
      </div>

      <input
        type="date"
        className="date-input-field"
        value={value}
        min={today}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};
