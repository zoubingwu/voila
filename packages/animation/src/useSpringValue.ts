import { useState, useRef, useEffect, useCallback } from 'react';
import { SpringValue, SpringValueConfig } from './SpringValue';

export type Value = Record<string, number>;

export function useSpringValue<T extends Value>(
  initialValues: T,
  config?: Partial<
    Pick<
      SpringValueConfig,
      'damping' | 'stiffness' | 'velocity' | 'clamp'
    >
  >
): [
  T,
  (to: Partial<T>) => void,
  (to: Partial<T>) => void,
  Map<string, SpringValue>
] {
  const springsRef = useRef<Map<string, SpringValue>>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc.set(
        key,
        new SpringValue({
          ...(config || {}),
          from: initialValues[key],
        })
      );

      return acc;
    }, new Map())
  );

  const springs = springsRef.current;
  const completeCount = useRef(0);
  const [values, setValues] = useState(initialValues);

  const setValuesWrapper = useCallback(
    (values: Partial<T>) => {
      completeCount.current = 0;

      Object.keys(values).forEach((key) => {
        const spring = springs.get(key);
        if (spring) {
          spring.set(values[key]!);
        }
      });
    },
    [values, completeCount.current]
  );

  const hardSetValues = useCallback(
    (values: Partial<T>) => {
      completeCount.current = 0;

      Object.keys(values).forEach((key) => {
        const spring = springs.get(key);
        if (spring) {
          spring.hardSet(values[key]!);
        }
      });
    },
    [values, completeCount.current]
  );

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    springs.forEach((value, key) => {
      const unsub = value.subscribe({
        next: (v) => {
          setValues((prev) => ({ ...prev, [key]: v }));
        },
        complete: () => {
          completeCount.current++;
        },
      });

      unsubs.push(unsub);
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return [values, setValuesWrapper, hardSetValues, springs];
}
