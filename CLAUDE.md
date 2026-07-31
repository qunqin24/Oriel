<!-- BEGIN:astro-agent-rules -->
# This is NOT the Astro you know

Stack: **Astro 7.1.3** + React 19 islands + Tailwind 4 + TypeScript, package manager pnpm.

Astro 7 is past your training cutoff (models generally know Astro 5 at best), and **both 6.x and 7.x shipped breaking changes**. Unlike Next.js, Astro ships **no local docs directory** — the only reliable source of truth is the type definitions:

- `node_modules/astro/dist/types/public/config.d.ts` — config options
- `node_modules/astro/dist/types/public/common.d.ts` — `getStaticPaths`, page props
- `node_modules/astro/dist/types/public/elements.d.ts` — `client:*` directives
- `node_modules/astro/dist/virtual-modules/*.d.ts` — virtual modules (`astro:i18n`, `astro:transitions`, …)

**Read the relevant type definition to confirm a signature before writing any Astro API. Do not go from memory.**

Known traps (already verified — don't rediscover them):

- `ViewTransitions` no longer exists; it is `ClientRouter`, imported from `astro:transitions`
- `Astro.glob()` was removed — use `import.meta.glob`
- `server:defer` (server islands) requires an adapter; unavailable in a pure static build
- Content collection schemas are Zod v4; `entry.slug` and `entry.render()` were removed
- `<script>` in `.astro` files is no longer hoisted and bundled — it is emitted in place
<!-- END:astro-agent-rules -->

# Architecture rules for this repo

These are load-bearing. Breaking one is silent — the build still passes.

**Never import `src/lib/data.ts` (or anything that imports it) from a `.tsx` island.**
`data.ts` statically imports 12 JSON files totalling ~700KB. Anything an island imports goes
into the browser bundle. Islands import `src/lib/explorer-config.ts` (pure config, no data);
build-time row projections live in `src/lib/explorer.ts` and are passed in as props.
Check with `pnpm build` — no file in `dist/_astro/*.js` other than `client.*` should exceed ~40KB.

**`.astro` for everything static; React only where interaction is unavoidable.**
There are exactly four islands: `model-explorer`, `compare-board`, `compare-tray`,
`compare-button`. Tabs, disclosure, and theme switching are done with CSS and native
elements, not JS. Home, changes, media, and about must load **no React** — their only
scripts are Astro's own runtime (ClientRouter 13.3KB + prefetch 2.4KB). Keep it that way.

**Theme survives soft navigation via `astro:before-swap`, not `after-swap`.**
`ClientRouter`'s `swapRootAttributes` wipes every attribute on `<html>`, including
`data-theme` and the inline canvas colour set on first paint. The head script writes the
theme onto `event.newDocument.documentElement` *before* the swap, so the attributes that get
copied over are already correct. Using `after-swap` would paint one frame of the wrong theme.
Astro will not re-run that script (it dedupes by `textContent`), so the listener is the only
thing keeping the theme alive across navigations. `pnpm verify` simulates the whole flow.

**`tray` is opt-in on `base.astro`.** Mounting any island pulls in ~180KB of React runtime.
Only pages that actually involve comparison pass `tray`.

**Compare state has exactly one implementation** — `src/lib/compare-store.ts`, via
`useSyncExternalStore`. Do not add a parallel vanilla-JS copy in a layout; that is what the
previous version did and the two halves drifted.

**Add UI strings to `src/i18n/zh.ts` first.** It defines the dictionary shape; `en.ts` is typed
against it, so a missing translation is a type error. Never hardcode user-facing text in a
component. Model and vendor names are proper nouns — they are never translated.

**Don't hardcode counts in copy.** Coverage numbers and history length change daily. Use
`{placeholder}` in the dictionary and `fill()` at render.

**Honesty rules that are features, not polish.** Missing data must read as "not tested", never
as a blank or a zero. Trend lines must not be drawn across an `index_version` change, and must
not be drawn at all below `MIN_TREND_POINTS`. Elo boards must show their confidence intervals.
`pnpm verify` asserts all of these — run it after any change to the data layer or these views.

# 品牌

**Oriel**(读作"奥瑞尔")— A window into machine intelligence.

原本有凸窗、金色等含义,整体听感像一个温和的角色名。不直接描述榜单,却有"观察窗口"的隐喻。
