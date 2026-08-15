import React from 'react';
import { Resource } from '../types';

interface Props {
  resources: Resource[];
  selected: Resource | null;
  onSelect: (r: Resource) => void;
  loading: boolean;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
};

export const ResourceSelector: React.FC<Props> = ({ resources, selected, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="resource-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="resource-card skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="resource-list" role="listbox" aria-label="Select a resource">
      {resources.map((r) => (
        <button
          key={r.id}
          className={`resource-card ${selected?.id === r.id ? 'selected' : ''}`}
          onClick={() => onSelect(r)}
          role="option"
          aria-selected={selected?.id === r.id}
          id={`resource-btn-${r.id}`}
        >
          <div className="resource-icon">
            {r.name.includes('Room') ? '🏢' : r.name.includes('Studio') ? '🎙️' : '🔬'}
          </div>
          <div className="resource-info">
            <span className="resource-name">{r.name}</span>
            <span className="resource-tz">{r.timezone}</span>
          </div>
          {selected?.id === r.id && <div className="resource-check">✓</div>}
        </button>
      ))}
    </div>
  );
};
