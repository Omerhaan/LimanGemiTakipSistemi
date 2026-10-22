import { useState, useEffect } from 'react';

/**
 * Belirtilen gecikme süresi boyunca değişmeyen en son değeri döner.
 * Arama kutularında her tuş vuruşunda API çağrısı yapılmasını önlemek için kullanılır.
 * 
 * @param value İzlenecek değer
 * @param delay Gecikme süresi (milisaniye, varsayılan 350ms)
 * @returns Geciktirilmiş değer
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
