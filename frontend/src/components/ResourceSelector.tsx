import React from 'react';

export const ResourceSelector = ({ resources, selected, onSelect, loading }) => {
  if (loading || !resources || resources.length === 0) {
    return (
      <div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="resource-item-btn" style={{ opacity: 0.5, height: 50 }} />
        ))}
      </div>
    );
  }

  const icons = { Kolkata: '🔬', London: '🏢', York: '🎙️', Tokyo: '🎙️', Sydney: '🏢' };
  const getIcon = (name) => {
    for (const [k, v] of Object.entries(icons)) if (name.includes(k)) return v;
    return '📍';
  };

  return (
    <div>
      {resources.map(r => {
        const isSelected = selected?.id === r.id;
        return (
          <button
            key={r.id}
            className={`resource-item-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(r)}
          >
            <div className="resource-item-icon">
              {getIcon(r.name)}
            </div>
            <div className="resource-item-info">
              <div className="resource-item-name">{r.name}</div>
              <div className="resource-item-tz">{r.timezone}</div>
            </div>
            {isSelected && (
              <div className="resource-item-check">✓</div>
            )}
          </button>
        );
      })}
    </div>
  );
};
