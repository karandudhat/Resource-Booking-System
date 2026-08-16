import React from 'react';

export const ResourceSelector = ({ resources, selected, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="resource-skeleton">
        {[1, 2, 3].map(i => <div key={i} className="skeleton" />)}
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="resource-skeleton">
        {[1, 2, 3].map(i => <div key={i} className="skeleton" />)}
      </div>
    );
  }

  const icons = { London: '🏢', York: '🎙️', Kolkata: '🔬' };
  const getIcon = (name) => {
    for (const [k, v] of Object.entries(icons)) if (name.includes(k)) return v;
    return '📍';
  };

  return (
    <div className="resource-list" role="listbox">
      {resources.map(r => (
        <button
          key={r.id}
          className={`resource-card ${selected?.id === r.id ? 'selected' : ''}`}
          onClick={() => onSelect(r)}
          role="option"
          aria-selected={selected?.id === r.id}
          id={`resource-btn-${r.id}`}
        >
          <div className="resource-card-bg" />
          <div className="resource-icon-wrap">
            <span>{getIcon(r.name)}</span>
          </div>
          <div className="resource-info">
            <span className="resource-name">{r.name}</span>
            <div className="resource-tz-row">
              <span className="tz-dot" />
              <span className="resource-tz">{r.timezone}</span>
            </div>
          </div>
          {selected?.id === r.id && (
            <div className="resource-check">✓</div>
          )}
        </button>
      ))}
    </div>
  );
};
