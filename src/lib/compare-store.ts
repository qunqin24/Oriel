import { useSyncExternalStore } from "react";

/**
 * 对比选择的唯一实现。
 *
 * 旧站把这套状态写了两遍——base-layout.astro 里一段 100 行的 vanilla script，
 * 外加一个 React store——两边各自读写 localStorage，靠自定义事件勉强同步。
 * 这里只保留一份，所有 island 通过 useSyncExternalStore 订阅同一个快照。
 */

export const COMPARE_KEY = "oriel-compare";
export const COMPARE_LIMIT = 4;

export type CompareEntry = {
  slug: string;
  name: string;
  creator: string;
};

let snapshot: CompareEntry[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): CompareEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is CompareEntry =>
          entry && typeof entry.slug === "string" && typeof entry.name === "string"
      )
      .slice(0, COMPARE_LIMIT);
  } catch {
    return [];
  }
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  snapshot = parse(window.localStorage.getItem(COMPARE_KEY));
  loaded = true;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(next: CompareEntry[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式下 localStorage 会抛异常。选择依然在本次会话内有效。
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  load();
  listeners.add(listener);
  // 另一个标签页改了选择，这边跟着更新。
  const onStorage = (event: StorageEvent) => {
    if (event.key !== COMPARE_KEY) return;
    snapshot = parse(event.newValue);
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): CompareEntry[] {
  load();
  return snapshot;
}

/** 服务端渲染时永远是空的——localStorage 那时还不存在，硬猜会导致水合不一致。 */
const EMPTY: CompareEntry[] = [];
function getServerSnapshot(): CompareEntry[] {
  return EMPTY;
}

export function toggleCompare(entry: CompareEntry): void {
  load();
  const existing = snapshot.some((item) => item.slug === entry.slug);
  if (existing) {
    commit(snapshot.filter((item) => item.slug !== entry.slug));
    return;
  }
  if (snapshot.length >= COMPARE_LIMIT) return;
  commit([...snapshot, entry]);
}

export function removeCompare(slug: string): void {
  load();
  commit(snapshot.filter((item) => item.slug !== slug));
}

export function clearCompare(): void {
  commit([]);
}

export function useCompare(): {
  entries: CompareEntry[];
  slugs: Set<string>;
  isFull: boolean;
} {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    entries,
    slugs: new Set(entries.map((entry) => entry.slug)),
    isFull: entries.length >= COMPARE_LIMIT,
  };
}
