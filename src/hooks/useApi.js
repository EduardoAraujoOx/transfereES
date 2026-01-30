import { useState, useEffect, useCallback } from 'react';

export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    let cancelled = false;

    async function doLoad() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erro ao carregar dados');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    doLoad();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, refetch: load };
}
