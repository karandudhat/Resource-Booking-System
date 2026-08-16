import React from 'react';

export const ResourceSelector = ({ resources, selected, onSelect, loading }) => {
  if (loading || !resources || resources.length === 0) {
    return (
      <div className="resource-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="resource-item" style={{ height: 60, opacity: 0.5, background: 'hsl(var(--muted))' }} />
        ))}
      </div>
    );
  }

  const icons = { London: '🏢', York: '🎙️', Kolkata: '🔬' };
  const getIcon = (name) => {
    for (const [k, v] of Object.entries(icons)) if (name.includes(k)) return v;
    return '📍';
  };

  return (
    <div className="resource-grid" role="listbox">
      {resources.map(r => {
        const isSelected = selected?.id === r.id;
        return (
          <button
            key={r.id}
            className={`resource-item ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(r)}
            role="option"
            aria-selected={isSelected}
          >
            <div className="resource-icon">
              {getIcon(r.name)}
            </div>
            <div className="resource-details">
              <div className="resource-title">{r.name}</div>
              <div className="resource-sub">{r.timezone}</div>
            </div>
            {isSelected && (
              <span className="ui-badge ui-badge-default" style={{ padding: '4px 8px', fontSize: 11 }}>
                Selected
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
