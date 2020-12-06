import { useCallback, } from 'react';
import { useSpringValue, Value } from './useSpringValue';

export function useTrail<T extends Value>(
  number: number,
  initialValues: T
): [T[], (to: Partial<T>) => void, (to: Partial<T>) => void] {
  const springValues = new Array(number)
    .fill(0)
    .map((_) => useSpringValue(initialValues));

  const set = useCallback((nextValue: Partial<T>) => {
    springValues.forEach((s, i) => {
      const [_, setter] = s;
      setTimeout(() => {
        setter(nextValue);
      }, i * 50); // TODO better implementation
    });
  }, []);

  const hardSet = useCallback((nextValue: Partial<T>) => {
    springValues.forEach((s) => {
      const hardSetter = s[2];
      hardSetter(nextValue);
    });
  }, []);

  return [springValues.map((s) => s[0]), set, hardSet];
}
