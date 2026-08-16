import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Slot } from '../types';

interface UseSlotsResult {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSlots(
  resourceId: string | null,
  date: string | null,
  timezone: string,
): UseSlotsResult {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!resourceId || !date) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getSlots(resourceId, date, timezone)
      .then((data) => {
        if (!cancelled) {
          setSlots(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId, date, timezone, tick]);

  return { slots, loading, error, refresh };
}
