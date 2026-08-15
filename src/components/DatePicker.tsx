import React from 'react';

interface Props {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

// Format today as YYYY-MM-DD in local time for the min attribute
function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const DatePicker: React.FC<Props> = ({ value, onChange, disabled }) => {
  return (
    <div className="datepicker-wrapper">
      <label htmlFor="date-input" className="field-label">
        📅 Select Date
      </label>
      <input
        id="date-input"
        type="date"
        className="date-input"
        value={value}
        min={todayLocal()}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Select booking date"
      />
    </div>
  );
};
