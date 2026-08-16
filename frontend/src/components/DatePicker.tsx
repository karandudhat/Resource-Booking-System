import React from 'react';

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export const DatePicker = ({ value, onChange, disabled }) => {
  const today = todayLocal();

  return (
    <div>
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
