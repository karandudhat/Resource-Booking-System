import React from 'react';

export const COMMON_TIMEZONES = [
  { label: '🇮🇳 Mumbai / Kolkata (IST)',   value: 'Asia/Kolkata' },
  { label: '🇬🇧 London (GMT/BST)',         value: 'Europe/London' },
  { label: '🇺🇸 New York (EST/EDT)',       value: 'America/New_York' },
  { label: '🇯🇵 Tokyo (JST)',              value: 'Asia/Tokyo' },
  { label: '🇦🇺 Sydney (AEST/AEDT)',       value: 'Australia/Sydney' },
  { label: '🌐 UTC',                        value: 'UTC' },
  { label: '🇫🇷 Paris / Berlin (CET)',     value: 'Europe/Paris' },
  { label: '🇦🇪 Dubai (GST)',             value: 'Asia/Dubai' },
  { label: '🇸🇬 Singapore / HK (SGT)',     value: 'Asia/Singapore' },
  { label: '🇺🇸 Los Angeles (PST/PDT)',    value: 'America/Los_Angeles' },
];

export const TimezoneSelector = ({ value, onChange }) => (
  <div>
    <select
      id="timezone-select"
      className="tz-select-field"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Select display timezone"
    >
      {COMMON_TIMEZONES.map(tz => (
        <option key={tz.value} value={tz.value}>{tz.label}</option>
      ))}
    </select>
  </div>
);
