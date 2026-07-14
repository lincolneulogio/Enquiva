"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { clearFormDraft, loadFormDraft, saveFormDraft } from "@/lib/form-persistence";

type PersistOptions<T extends FieldValues> = {
  enabled?: boolean;
  exclude?: (keyof T)[];
  debounceMs?: number;
};

export function useFormPersistence<T extends FieldValues>(
  storageKey: string,
  { watch, reset, getValues }: Pick<UseFormReturn<T>, "watch" | "reset" | "getValues">,
  options?: PersistOptions<T>,
) {
  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 300;
  const excluded = useMemo(
    () => new Set((options?.exclude ?? []).map(String)),
    [options?.exclude],
  );
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hydratedRef.current) return;
    hydratedRef.current = true;

    const saved = loadFormDraft<Partial<T>>(storageKey);
    if (saved && Object.keys(saved).length > 0) {
      reset({ ...getValues(), ...saved } as T);
    }
  }, [enabled, storageKey, reset, getValues]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = watch((values) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const toSave = { ...values } as Record<string, unknown>;
        for (const key of excluded) {
          delete toSave[key];
        }
        saveFormDraft(storageKey, toSave);
      }, debounceMs);
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [watch, storageKey, enabled, debounceMs, excluded]);

  const clearDraft = useCallback(() => {
    clearFormDraft(storageKey);
  }, [storageKey]);

  return { clearDraft };
}

type PersistedStateOptions = {
  enabled?: boolean;
  debounceMs?: number;
};

export function usePersistedState<T>(
  storageKey: string,
  initialValue: T,
  options?: PersistedStateOptions,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const enabled = options?.enabled ?? true;
  const debounceMs = options?.debounceMs ?? 300;
  const hydratedRef = useRef(false);
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    if (!enabled || hydratedRef.current) return;
    hydratedRef.current = true;

    const saved = loadFormDraft<Partial<T>>(storageKey);
    if (saved !== null && typeof saved === "object") {
      // Merge para que claves nuevas (p. ej. termsUrl) no queden undefined.
      const merged = { ...initialValue, ...saved };
      setState(merged);
    }
  }, [storageKey, enabled, initialValue]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      saveFormDraft(storageKey, state);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [storageKey, state, enabled, debounceMs]);

  const clear = useCallback(() => {
    clearFormDraft(storageKey);
    const resetValue = initialValue;
    setState(resetValue);
  }, [storageKey, initialValue]);

  return [state, setState, clear];
}

export function usePersistedFormFields<T extends Record<string, unknown>>(
  storageKey: string,
  initialState: T,
  options?: PersistedStateOptions,
) {
  const initialRef = useRef(initialState);
  // Solo usa el initialState de montaje para no re-fusionar en cada render del padre.
  const seed = initialRef.current;
  const key = storageKey;
  const [values, setValues, clear] = usePersistedState(key, seed, options);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    const nextValue = value;
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  }, [setValues]);

  return { values, setValue, setValues, clear };
}
