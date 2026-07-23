import { useCallback, useEffect, useSyncExternalStore } from "react";

export type CompareItem = {
  id: string;
  name: string;
  creator: string;
};

const STORAGE_KEY = "oriel-compare-llm";
const CHANGE_EVENT = "oriel-compare-change";
export const COMPARE_MAX = 4;
const EMPTY_ITEMS: CompareItem[] = [];

let memoryItems: CompareItem[] = [];
let ready = false;
let listening = false;
const listeners = new Set<() => void>();

function readStorage(): CompareItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.creator === "string"
      )
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function hydrateFromStorage() {
  memoryItems = readStorage();
  ready = true;
  emitChange();
}

function ensureBrowserSubscription() {
  if (typeof window === "undefined" || listening) return;
  listening = true;

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) hydrateFromStorage();
  });
  window.addEventListener(CHANGE_EVENT, hydrateFromStorage);
  hydrateFromStorage();
}

function writeItems(next: CompareItem[]) {
  memoryItems = next.slice(0, COMPARE_MAX);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryItems));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureBrowserSubscription();
  return () => listeners.delete(listener);
}

function getItemsSnapshot() {
  return memoryItems;
}

function getServerItemsSnapshot(): CompareItem[] {
  return EMPTY_ITEMS;
}

function getReadySnapshot() {
  return ready;
}

function getServerReadySnapshot() {
  return false;
}

export function useCompare() {
  const items = useSyncExternalStore(
    subscribe,
    getItemsSnapshot,
    getServerItemsSnapshot
  );
  const isReady = useSyncExternalStore(
    subscribe,
    getReadySnapshot,
    getServerReadySnapshot
  );

  useEffect(ensureBrowserSubscription, []);

  const has = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const add = useCallback((item: CompareItem) => {
    const current = getItemsSnapshot();
    if (current.some((entry) => entry.id === item.id)) return true;
    if (current.length >= COMPARE_MAX) return false;
    writeItems([...current, item]);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    writeItems(getItemsSnapshot().filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  const toggle = useCallback(
    (item: CompareItem) => {
      if (has(item.id)) {
        remove(item.id);
        return true;
      }
      return add(item);
    },
    [add, has, remove]
  );

  return {
    items,
    count: items.length,
    max: COMPARE_MAX,
    ready: isReady,
    has,
    add,
    remove,
    clear,
    toggle,
  };
}
