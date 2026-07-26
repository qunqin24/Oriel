"use client";

import React, { useMemo, useState } from "react";
import type { ColumnDef } from "@/lib/types";

export type SortDir = "asc" | "desc";

type ViewProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string;
  sortKey: string;
  sortDir: SortDir;
  onSort?: (key: string) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  toolbarExtras?: React.ReactNode;
};

function compareValues(a: any, b: any, dir: SortDir) {
  const aNull = a == null || a === "";
  const bNull = b == null || b === "";
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  if (typeof a === "number" && typeof b === "number") {
    return dir === "asc" ? a - b : b - a;
  }
  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  if (as < bs) return dir === "asc" ? -1 : 1;
  if (as > bs) return dir === "asc" ? 1 : -1;
  return 0;
}

export function sortRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  sortKey: string,
  sortDir: SortDir
): T[] {
  const col = columns.find((c) => c.key === sortKey);
  if (!col) return rows;
  return [...rows].sort((a, b) =>
    compareValues(col.getValue(a), col.getValue(b), sortDir)
  );
}

export function filterRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    columns.some((c) => {
      const raw = c.getValue(row);
      if (String(raw ?? "").toLowerCase().includes(q)) return true;
      const extra = c.getSearchText?.(row);
      return String(extra ?? "").toLowerCase().includes(q);
    })
  );
}

/**
 * 纯展示表格:排序、搜索、工具栏均由外部受控。
 * 可在服务端渲染(Astro SSR)或客户端使用。
 */
export function LeaderboardTableView<T>({
  rows,
  columns,
  getRowKey,
  sortKey,
  sortDir,
  onSort,
  query,
  onQueryChange,
  searchPlaceholder = "搜索模型…",
  totalCount,
  toolbarExtras,
}: ViewProps<T>) {
  return (
    <div className="flex flex-col w-full min-w-0">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-3">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative w-full sm:max-w-sm">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              value={query ?? ""}
              onChange={(e) => onQueryChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 sm:py-1.5 text-sm bg-card hairline-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          {toolbarExtras}
        </div>
        <div className="text-xs text-muted-foreground font-mono shrink-0 self-end sm:self-auto">
          {rows.length} / {totalCount ?? rows.length} 结果
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto instrument-panel overscroll-x-contain">
        <table className="w-full text-sm text-left min-w-xl">
          <thead className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground bg-muted">
            <tr>
              <th className="sticky left-0 z-20 px-2.5 sm:px-4 py-2 font-semibold w-10 text-center border-b border-border bg-muted">
                #
              </th>
              {columns.map((col, i) => {
                const active = sortKey === col.key;
                const sortable = col.sortable !== false;
                const isFirst = i === 0;
                const alone = columns.length <= 2;

                return (
                  <th
                    key={col.key}
                    className={`px-2.5 sm:px-4 py-2 font-semibold whitespace-nowrap border-b border-border bg-muted
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                      ${isFirst && !alone ? "sticky left-10 z-20 w-44 max-w-44 sm:w-60 sm:max-w-60 shadow-[1px_0_0_var(--border)]" : "w-auto"}
                    `}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        className={`flex items-center gap-1 hover:text-foreground transition-colors ${active ? "text-oriel-gold font-bold" : ""} ${col.align === "right" ? "ml-auto" : col.align === "center" ? "mx-auto" : ""}`}
                      >
                        {col.label}
                        <span className="font-mono w-3 text-center opacity-70">
                          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr key={getRowKey(row)} className="bg-card hover:bg-muted/30 transition-colors group">
                <td className="sticky left-0 z-10 px-2.5 sm:px-4 py-1.5 text-center bg-card group-hover:bg-muted/30">
                  <span className={`inline-block min-w-5 font-mono text-xs font-semibold
                    ${index === 0 ? "text-(--rank-1)" : index === 1 ? "text-(--rank-2)" : index === 2 ? "text-(--rank-3)" : "text-muted-foreground"}`}>
                    {index + 1}
                  </span>
                </td>
                {columns.map((col, i) => {
                  const raw = col.getValue(row);
                  const text = col.format ? col.format(raw, row) : raw == null ? "—" : String(raw);
                  const isFirst = i === 0;
                  const alone = columns.length <= 2;
                  const isNode = typeof text !== "string" && typeof text !== "number";

                  return (
                    <td
                      key={col.key}
                      className={`px-2.5 sm:px-4 py-1.5
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                        ${typeof raw === "number" && !isNode ? "mono-data" : ""}
                        ${isFirst ? "font-medium text-foreground" : "text-muted-foreground text-[13px]"}
                        ${isFirst && !alone ? "sticky left-10 z-10 max-w-44 sm:max-w-60 bg-card group-hover:bg-muted/30 shadow-[1px_0_0_var(--border)]" : ""}
                      `}
                    >
                      {isFirst && !isNode ? (
                        <div className="truncate" data-tip={String(raw)}>
                          {text}
                        </div>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  未找到匹配的模型数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ControlledProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string;
  defaultSortKey?: string;
  defaultSortDir?: SortDir;
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
};

/** 自带排序/搜索 state 的受控包装,供无 URL 同步需求的页面直接使用。 */
export function LeaderboardTable<T>({
  rows,
  columns,
  getRowKey,
  defaultSortKey,
  defaultSortDir = "desc",
  searchPlaceholder = "搜索模型…",
}: ControlledProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(
    defaultSortKey ?? columns.find((c) => c.sortable !== false)?.key ?? columns[0]?.key
  );
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  const sorted = useMemo(() => {
    return sortRows(filterRows(rows, columns, query), columns, sortKey, sortDir);
  }, [rows, columns, sortKey, sortDir, query]);

  function onSort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col || col.sortable === false) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultSortDir);
    }
  }

  return (
    <LeaderboardTableView
      rows={sorted}
      columns={columns}
      getRowKey={getRowKey}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={searchPlaceholder}
      totalCount={rows.length}
    />
  );
}
