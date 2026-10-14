import { useCallback, useMemo } from 'react';

export function useFilterParams<T extends Record<string, string | number | undefined | null> = Record<string, any>>(
  defaultValues: T = {} as T
) {
  // Read current URL params
  const currentParams = useMemo(() => {
    if (typeof window === 'undefined') return defaultValues;
    const searchParams = new URLSearchParams(window.location.search);
    const result: Record<string, any> = { ...defaultValues };

    Object.keys(defaultValues).forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null && val !== undefined) {
        if (typeof defaultValues[key] === 'number') {
          const num = Number(val);
          result[key] = !isNaN(num) ? num : defaultValues[key];
        } else {
          result[key] = val;
        }
      }
    });

    return result as T;
  }, []);

  const getParam = useCallback((key: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get(key) || undefined;
  }, []);

  // Update URL params
  const setFilterParams = useCallback(
    (newParams: Partial<T> | ((prev: T) => Partial<T>)) => {
      if (typeof window === 'undefined') return;
      const searchParams = new URLSearchParams(window.location.search);

      const updates = typeof newParams === 'function' ? newParams(currentParams) : newParams;

      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '' || val === defaultValues[key]) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, String(val));
        }
      });

      const newQuery = searchParams.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
    },
    [currentParams, defaultValues]
  );

  const setParams = useCallback((newParams: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        searchParams.delete(key);
      } else {
        searchParams.set(key, String(val));
      }
    });

    const newQuery = searchParams.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  const resetFilterParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    Object.keys(defaultValues).forEach((key) => {
      searchParams.delete(key);
    });
    const newQuery = searchParams.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [defaultValues]);

  return {
    params: currentParams,
    setFilterParams,
    resetFilterParams,
    getParam,
    setParams,
  };
}

export default useFilterParams;
