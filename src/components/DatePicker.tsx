import React from 'react';

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export const DatePicker = ({ value, onChange, disabled }) => (
  <div className="datepicker-wrapper">
    <label htmlFor="date-input" className="field-label">
      <span>📅</span> Select Date
    </label>
    <input
      id="date-input"
      type="date"
      className="date-input"
      value={value}
      min={todayLocal()}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Select booking date"
    />
  </div>
);
