import React from 'react';

export const COMMON_TIMEZONES = [
  { label: 'UTC',                        value: 'UTC' },
  { label: '🇬🇧 London (GMT/BST)',         value: 'Europe/London' },
  { label: '🇫🇷 Paris / Berlin (CET)',     value: 'Europe/Paris' },
  { label: '🇷🇺 Moscow (MSK)',             value: 'Europe/Moscow' },
  { label: '🇦🇪 Dubai (GST)',             value: 'Asia/Dubai' },
  { label: '🇮🇳 Mumbai / Kolkata (IST)',   value: 'Asia/Kolkata' },
  { label: '🇹🇭 Bangkok (ICT)',            value: 'Asia/Bangkok' },
  { label: '🇸🇬 Singapore / HK (SGT)',     value: 'Asia/Singapore' },
  { label: '🇯🇵 Tokyo (JST)',              value: 'Asia/Tokyo' },
  { label: '🇦🇺 Sydney (AEST/AEDT)',       value: 'Australia/Sydney' },
  { label: '🇺🇸 New York (EST/EDT)',       value: 'America/New_York' },
  { label: '🇺🇸 Chicago (CST/CDT)',        value: 'America/Chicago' },
  { label: '🇺🇸 Denver (MST/MDT)',         value: 'America/Denver' },
  { label: '🇺🇸 Los Angeles (PST/PDT)',    value: 'America/Los_Angeles' },
  { label: '🇧🇷 São Paulo (BRT)',          value: 'America/Sao_Paulo' },
];

export const TimezoneSelector = ({ value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label htmlFor="timezone-select" className="ui-label">
      Display Timezone
    </label>
    <select
      id="timezone-select"
      className="ui-select"
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
