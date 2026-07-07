const STORAGE_PREFIX = "eventia.form.";

export function formStorageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

export function loadFormDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveFormDraft(key: string, data: unknown): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore quota or serialization errors.
  }
}

export function clearFormDraft(key: string): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}
