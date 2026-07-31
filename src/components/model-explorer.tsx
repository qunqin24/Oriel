import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// 只从 explorer-config 取，绝不从 explorer.ts 取——后者 import 了数据文件，
// 会把整份 585KB 数据集打进浏览器包。
import {
  DIMENSIONS,
  DIMENSION_COLUMNS,
  HIGHER_IS_BETTER,
  rowValue,
  unpackRow,
  type ColumnId,
  type Dimension,
  type ExplorerRow,
  type PackedRow,
} from "@/lib/explorer-config";
import {
  formatNumber,
  formatPrice,
  formatSeconds,
  NO_VALUE,
} from "@/lib/format";
import { COMPARE_LIMIT, toggleCompare, useCompare } from "@/lib/compare-store";
import { localizeModelName } from "@/lib/model-name";
import VendorIcon from "@/components/vendor-icon";
import type { Dict, Locale } from "@/i18n";

type Labels = {
  models: Dict["models"];
  common: Dict["common"];
  compare: Dict["compare"];
};

type Props = {
  /** 压缩过的行，见 explorer-config 的 packRow */
  rows: PackedRow[];
  vendors: Array<{ name: string; count: number }>;
  locale: Locale;
  labels: Labels;
  /** 模型详情页的地址前缀，随语言不同 */
  modelBase: string;
};

type SortDir = "asc" | "desc";

const NUMERIC_ALIGN = "text-right";

/**
 * 模型名括号后缀（如 "(high)"、"(Non-reasoning)"）只在中文页面本地化，
 * 英文页面本来就是英文，不需要处理。搜索/排序/URL 一律用 row.name 原文，
 * 这里只影响这一格展示的文字。
 */
function displayName(name: string, locale: Locale): string {
  return locale === "zh" ? localizeModelName(name) : name;
}

function formatCell(
  row: ExplorerRow,
  column: ColumnId,
  locale: Locale
): string {
  switch (column) {
    case "name":
      return row.name;
    case "intelligence":
      return formatNumber(row.intelligence, locale, 1);
    case "coding":
      return formatNumber(row.coding, locale, 1);
    case "agentic":
      return formatNumber(row.agentic, locale, 1);
    case "value":
      return formatNumber(row.value, locale, 1);
    case "priceIn":
      return formatPrice(row.priceIn);
    case "priceOut":
      return formatPrice(row.priceOut);
    case "throughput":
      return formatNumber(row.throughput, locale, 0);
    case "ttft":
      return formatSeconds(row.ttft);
    case "release":
      return row.release ?? NO_VALUE;
  }
}

/**
 * 构建期这几个函数在服务端跑一遍（没有 window，落回默认值），
 * 客户端 hydrate 时再跑一遍、读到真实地址栏参数。两次结果不一样
 * 是预期的水合不匹配（React 会用客户端这次的结果覆盖，一次性完成，
 * 不会有肉眼可见的两帧闪烁）——比之前那种「先挂载出总览、
 * 等 effect 跑完再纠正成实际维度」的做法好，那种做法在浏览器里
 * 是先画一帧再改一帧，用户看得见「总览闪一下又变回来」。
 */
function readParams(): URLSearchParams | null {
  return typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search);
}

function initialDimension(params: URLSearchParams | null): Dimension {
  const dim = params?.get("dim");
  return dim && (DIMENSIONS as readonly string[]).includes(dim)
    ? (dim as Dimension)
    : "overview";
}

function initialQuery(params: URLSearchParams | null): string {
  const q = params?.get("q");
  return q ? q.slice(0, 80) : "";
}

function initialVendors(
  params: URLSearchParams | null,
  vendors: Array<{ name: string; count: number }>
): string[] {
  const vendor = params?.get("vendor");
  if (!vendor) return [];
  const known = new Set(vendors.map((entry) => entry.name));
  return vendor.split(",").filter((name) => known.has(name));
}

function initialSortColumn(
  params: URLSearchParams | null,
  dimension: Dimension
): ColumnId {
  const sort = params?.get("sort");
  return (sort as ColumnId) || DIMENSION_COLUMNS[dimension].sort;
}

function initialSortDir(params: URLSearchParams | null): SortDir {
  return params?.get("dir") === "asc" ? "asc" : "desc";
}

export default function ModelExplorer({
  rows: packed,
  vendors,
  locale,
  labels,
  modelBase,
}: Props) {
  const [dimension, setDimension] = useState<Dimension>(() =>
    initialDimension(readParams())
  );
  const [query, setQuery] = useState<string>(() => initialQuery(readParams()));
  const [selectedVendors, setSelectedVendors] = useState<string[]>(() =>
    initialVendors(readParams(), vendors)
  );
  const [sortColumn, setSortColumn] = useState<ColumnId>(() =>
    initialSortColumn(readParams(), initialDimension(readParams()))
  );
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    initialSortDir(readParams())
  );
  const [vendorQuery, setVendorQuery] = useState("");
  const vendorMenuRef = useRef<HTMLDetailsElement>(null);

  // <details> 原生只在点 <summary> 时开关——点菜单外面、或按 Esc，
  // 也得能关掉，不然筛选面板会一直挡在表格上面。
  useEffect(() => {
    const closeIfOutside = (event: MouseEvent) => {
      const menu = vendorMenuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && vendorMenuRef.current?.open) {
        vendorMenuRef.current.open = false;
      }
    };
    document.addEventListener("click", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  // 解包一次，之后所有筛选排序都用对象形态。
  const rows = useMemo(() => packed.map(unpackRow), [packed]);

  const { slugs, isFull } = useCompare();

  // 状态写回地址栏，让任何一屏都能直接分享。
  useEffect(() => {
    const params = new URLSearchParams();
    if (dimension !== "overview") params.set("dim", dimension);
    if (query) params.set("q", query);
    if (selectedVendors.length) params.set("vendor", selectedVendors.join(","));
    if (sortColumn !== DIMENSION_COLUMNS[dimension].sort) params.set("sort", sortColumn);
    if (sortDir === "asc") params.set("dir", "asc");
    const search = params.toString();
    const url = search ? `?${search}` : window.location.pathname;
    // ClientRouter 把导航 index 与滚动位置放在 history.state 里；这里如果
    // 写成 null，浏览器返回到榜单时 Astro 会因为 popstate 没有 state 而
    // 直接退出，只改地址、不交换 DOM。保留原 state，只改当前条目的 URL。
    window.history.replaceState(window.history.state, "", url);
    // 详情页的「返回榜单」链接从这里读回筛选状态，否则点进一个模型
    // 再点返回，看到的永远是默认总览，而不是刚才那个维度/筛选/排序。
    sessionStorage.setItem(
      "oriel:models-return",
      search ? `${window.location.pathname}?${search}` : window.location.pathname
    );

    // 带参数进入本页时，models.astro 会在交换前把这块藏起来，避免
    // 静态 HTML 里的「总览」被过渡动画持有一帧。现在渲染的已经是目标
    // 维度了，可以揭开。
    document
      .querySelector("[data-explorer-mount][data-pending]")
      ?.removeAttribute("data-pending");
  }, [dimension, query, selectedVendors, sortColumn, sortDir]);

  const config = DIMENSION_COLUMNS[dimension];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const vendorSet = selectedVendors.length ? new Set(selectedVendors) : null;
    const focus = config.focus;

    return rows.filter((row) => {
      // 选定某个维度时，没有该项数据的模型直接不进表——
      // 让读者对着 388 行破折号猜，比少列几行更糟。
      if (focus && rowValue(row, focus as ColumnId) == null) return false;
      if (vendorSet && !vendorSet.has(row.creator)) return false;
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        row.creator.toLowerCase().includes(needle)
      );
    });
  }, [rows, query, selectedVendors, config.focus]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    if (sortColumn === "name") {
      next.sort((a, b) =>
        sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
      return next;
    }
    next.sort((a, b) => {
      const av = rowValue(a, sortColumn);
      const bv = rowValue(b, sortColumn);
      // 缺失值永远沉底，不管升序还是降序。
      if (av == null && bv == null) return a.name.localeCompare(b.name);
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return next;
  }, [filtered, sortColumn, sortDir]);

  const changeDimension = useCallback((next: Dimension) => {
    setDimension(next);
    setSortColumn(DIMENSION_COLUMNS[next].sort);
    setSortDir(HIGHER_IS_BETTER[DIMENSION_COLUMNS[next].sort as Exclude<ColumnId, "name">]
      ? "desc"
      : "asc");
  }, []);

  const changeSort = useCallback(
    (column: ColumnId) => {
      if (column === sortColumn) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return;
      }
      setSortColumn(column);
      setSortDir(
        column === "name"
          ? "asc"
          : HIGHER_IS_BETTER[column as Exclude<ColumnId, "name">]
            ? "desc"
            : "asc"
      );
    },
    [sortColumn]
  );

  const filteredVendors = useMemo(() => {
    const needle = vendorQuery.trim().toLowerCase();
    if (!needle) return vendors;
    return vendors.filter((vendor) => vendor.name.toLowerCase().includes(needle));
  }, [vendors, vendorQuery]);

  const hasFilters =
    query !== "" || selectedVendors.length > 0 || dimension !== "overview";

  const coverageCount = config.focus
    ? rows.filter((row) => rowValue(row, config.focus as ColumnId) != null).length
    : rows.length;

  return (
    <div className="flex flex-col gap-5">
      {/* 维度：换的不只是排序，是这一屏在回答什么问题 */}
      <div
        className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1"
        role="tablist"
      >
        {DIMENSIONS.map((dim) => (
          <button
            key={dim}
            type="button"
            role="tab"
            aria-selected={dim === dimension}
            onClick={() => changeDimension(dim)}
            className={`shrink-0 rounded-sm border px-2.5 py-1 text-[13px] transition-colors ${
              dim === dimension
                ? "border-rule bg-panel text-fg"
                : "border-transparent text-mute hover:text-fg"
            }`}
          >
            {labels.models.dims[dim]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">{labels.models.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.models.search}
            className="w-full rounded-sm border border-rule bg-transparent px-2.5 py-1.5 text-sm text-fg placeholder:text-mute focus:border-mute focus:outline-none"
          />
        </label>

        <details ref={vendorMenuRef} className="relative">
          <summary className="cursor-pointer list-none rounded-sm border border-rule px-2.5 py-1.5 text-sm text-mute transition-colors hover:text-fg">
            {labels.models.vendor}
            {selectedVendors.length > 0 && (
              <span className="data ml-1.5 text-gold">{selectedVendors.length}</span>
            )}
          </summary>
          <div className="panel absolute left-0 z-30 mt-1 flex w-64 flex-col gap-2 p-2 shadow-lg">
            <input
              type="search"
              value={vendorQuery}
              onChange={(event) => setVendorQuery(event.target.value)}
              placeholder={labels.models.vendor}
              className="w-full rounded-sm border border-rule bg-transparent px-2 py-1 text-xs text-fg placeholder:text-mute focus:border-mute focus:outline-none"
            />
            <ul className="scrollbar-none max-h-64 overflow-y-auto">
              {filteredVendors.map((vendor) => (
                <li key={vendor.name}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-xs hover:bg-ground">
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.name)}
                      onChange={() =>
                        setSelectedVendors((current) =>
                          current.includes(vendor.name)
                            ? current.filter((name) => name !== vendor.name)
                            : [...current, vendor.name]
                        )
                      }
                      className="accent-[var(--gold)]"
                    />
                    <span className="min-w-0 flex-1 truncate text-fg">
                      {vendor.name}
                    </span>
                    <span className="data text-mute">{vendor.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedVendors([]);
              changeDimension("overview");
            }}
            className="rounded-sm px-2 py-1.5 text-xs text-mute transition-colors hover:text-fg"
          >
            {labels.models.clearFilters}
          </button>
        )}

        <p className="data ml-auto text-[12px] text-mute">
          {sorted.length} {labels.models.ofTotal} {rows.length}
        </p>
      </div>

      {/* 稀疏度摆在明面上：这个维度只有一部分模型被测过 */}
      {config.focus && (
        <p className="text-[12px] text-mute">
          {coverageCount} / {rows.length} {labels.models.coverage}。
          {labels.models.coverageHint}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="panel px-5 py-10 text-center">
          <p className="text-sm text-fg">{labels.models.empty}</p>
          <p className="mt-1 text-xs text-mute">{labels.models.emptyHint}</p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="w-8 py-2 pr-2 text-right">
                  <span className="eyebrow">#</span>
                </th>
                {config.columns.map((column) => {
                  const active = column === sortColumn;
                  const numeric = column !== "name";
                  return (
                    <th
                      key={column}
                      scope="col"
                      className={`py-2 whitespace-nowrap ${numeric ? `pl-3 ${NUMERIC_ALIGN}` : "pr-3 text-left"}`}
                      aria-sort={
                        active
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => changeSort(column)}
                        className={`eyebrow transition-colors hover:!text-fg ${
                          active ? "!text-fg" : ""
                        }`}
                      >
                        {column === "name"
                          ? labels.models.cols.name
                          : labels.models.cols[
                              column === "throughput"
                                ? "speed"
                                : (column as keyof Dict["models"]["cols"])
                            ]}
                        {active && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="w-20 py-2 pl-3 text-right">
                  <span className="sr-only">{labels.compare.add}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, index) => {
                const selected = slugs.has(row.slug);
                return (
                  <tr
                    key={row.slug}
                    className="border-b border-rule/50 transition-colors hover:bg-panel/60"
                  >
                    <td
                      className={`data py-1.5 pr-2 text-right text-[12px] ${
                        index === 0 ? "text-gold" : "text-mute"
                      }`}
                    >
                      {index + 1}
                    </td>
                    {config.columns.map((column) =>
                      column === "name" ? (
                        <td key={column} className="min-w-0 max-w-[22rem] py-1.5 pr-3">
                          <a
                            href={`${modelBase}/${row.slug}`}
                            className="block truncate text-fg transition-colors hover:text-gold"
                            title={displayName(row.name, locale)}
                          >
                            {displayName(row.name, locale)}
                          </a>
                          <span className="flex min-w-0 items-center gap-1.5 truncate text-[12px] text-mute">
                            <VendorIcon name={row.creator} size={12} />
                            <span className="truncate">{row.creator}</span>
                          </span>
                        </td>
                      ) : (
                        <td
                          key={column}
                          className={`data py-1.5 pl-3 ${NUMERIC_ALIGN} whitespace-nowrap ${
                            rowValue(row, column) == null ? "text-mute/50" : "text-fg"
                          }`}
                        >
                          {formatCell(row, column, locale)}
                        </td>
                      )
                    )}
                    <td className="py-1.5 pl-3 text-right">
                      <button
                        type="button"
                        disabled={isFull && !selected}
                        onClick={() =>
                          toggleCompare({
                            slug: row.slug,
                            name: row.name,
                            creator: row.creator,
                          })
                        }
                        title={
                          isFull && !selected
                            ? `${labels.compare.full} (${COMPARE_LIMIT})`
                            : selected
                              ? labels.compare.remove
                              : labels.compare.add
                        }
                        className={`rounded-sm border px-1.5 py-0.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                          selected
                            ? "border-gold/50 text-gold"
                            : "border-rule text-mute hover:text-fg"
                        }`}
                      >
                        {selected ? labels.compare.added : labels.compare.add}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
