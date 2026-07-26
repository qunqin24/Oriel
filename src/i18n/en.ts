import type { Dict } from "./index.ts";

export const en: Dict = {
  site: {
    name: "Oriel",
    tagline: "A window into machine intelligence",
    description:
      "Independent tracking of 586 language models and 11 media arenas — capability, price, and speed, captured daily.",
  },

  nav: {
    home: "Observatory",
    models: "Language models",
    changes: "Changes",
    media: "Media",
    catBoard: "Cat Board",
    compare: "Compare",
    about: "Method",
  },

  rail: {
    snapshot: "Snapshot",
    models: "models",
    vendors: "vendors",
    indexVersion: "Index version",
    source: "Source",
    sourceName: "Artificial Analysis",
    theme: "Switch theme",
    trend: "Models tracked",
  },

  home: {
    frontierTitle: "Capability frontier",
    frontierAxis: "Intelligence index × release date",
    frontierNote: "Each dot is a model. The gold line is the ceiling at that date.",
    frontierEmpty: "Not enough model data to draw a frontier",
    recentChanges: "Recent changes",
    allChanges: "All changes",
    topBoard: "Intelligence index",
    fullBoard: "Full leaderboard",
    mediaTitle: "Media arenas",
    mediaNote: "Image, video, speech, and music, ranked by Elo",
    viewAll: "View all",
  },

  models: {
    title: "Language models",
    lead: "Filter by intelligence, coding, agentic ability, value, or speed. Every filter lives in the URL, so you can share the exact view.",
    search: "Search models or vendors",
    searchLabel: "Search",
    vendor: "Vendor",
    clearFilters: "Clear filters",
    ofTotal: "of",
    empty: "No models match these filters",
    emptyHint: "Try a broader vendor filter or a different search term.",
    coverage: "have this metric",
    coverageHint: "Only some models are tested on this dimension. Untested models are left out of the ranking.",
    dims: {
      overview: "Overview",
      intelligence: "Intelligence",
      coding: "Coding",
      agentic: "Agentic",
      value: "Value",
      speed: "Speed",
    },
    cols: {
      name: "Model",
      creator: "Vendor",
      intelligence: "Intelligence",
      coding: "Coding",
      agentic: "Agentic",
      value: "Value",
      priceIn: "Input",
      priceOut: "Output",
      speed: "Throughput",
      ttft: "First token",
      release: "Released",
    },
    units: {
      perMillion: "per 1M tokens",
      tokensPerSecond: "tokens/sec",
    },
  },

  model: {
    released: "Released",
    firstSeen: "Tracked since",
    rankAmong: "Ranks {rank} of {total} models with this metric",
    noData: "Not tested",
    noDataHint: "Artificial Analysis has not published this metric for this model.",
    intelligence: "Intelligence index",
    coding: "Coding index",
    agentic: "Agentic index",
    pricing: "Pricing",
    performance: "Performance",
    priceIn: "Input",
    priceOut: "Output",
    cacheHit: "Cache read",
    cacheWrite: "Cache write",
    throughput: "Output throughput",
    ttft: "Time to first token",
    ttfat: "First answer token",
    e2e: "End-to-end response",
    trajectory: "History",
    trajectoryThin: "Building history — a trend needs more days than we have",
    trajectoryFlat: "Unchanged across {days} days of records",
    trajectoryRange: "{days} days of records",
    alternatives: "Cheaper at this level",
    alternativesNote: "Models with a comparable intelligence index and a lower output price",
    alternativesEmpty: "No cheaper model at this capability level",
    backToBoard: "Back to leaderboard",
  },

  changes: {
    title: "Changes",
    lead: "Each snapshot is compared with the previous day: models added and removed, scores and prices moved.",
    empty: "No changes recorded yet",
    emptyHint: "Comparison starts from the second snapshot.",
    types: {
      added: "Added",
      removed: "Removed",
      score: "Score",
      price: "Price",
    },
    metrics: {
      intelligence: "Intelligence index",
      coding: "Coding index",
      agentic: "Agentic index",
      priceIn: "Input price",
      priceOut: "Output price",
      throughput: "Output throughput",
      latency: "Time to first token",
    },
    firstScore: "First measured",
    withdrawn: "Metric withdrawn",
    eventCount: "changes",
  },

  media: {
    title: "Media arenas",
    lead: "Human preference rankings for image, video, speech, and music models. Elo is shown with a 95% confidence interval — where intervals overlap, the ranking gap is not meaningful.",
    elo: "Elo",
    ci: "95% confidence interval",
    ciNote: "Models with overlapping error bars are not meaningfully ranked apart",
    score: "Score",
    wer: "Word error rate index",
    werNote: "Lower is better",
    tieCaveat: "{count} models tie at the best published value. At this precision the board cannot separate them.",
    expand: "Show all {count}",
    collapse: "Show less",
    boards: {
      textToImage: "Text to image",
      imageEditing: "Image editing",
      textToVideo: "Text to video",
      imageToVideo: "Image to video",
      textToVideoAudio: "Text to video with audio",
      imageToVideoAudio: "Image to video with audio",
      textToSpeech: "Text to speech",
      speechToSpeech: "Speech to speech",
      speechToText: "Speech to text",
      musicInstrumental: "Instrumental music",
      musicWithVocals: "Music with vocals",
    },
  },

  compare: {
    title: "Compare",
    lead: "Up to four models side by side. The best value in each row is marked in gold.",
    empty: "No models selected",
    emptyHint: "Add models from the leaderboard or any model page.",
    browse: "Browse models",
    add: "Compare",
    added: "Added",
    remove: "Remove",
    clear: "Clear all",
    full: "Compare holds four models",
    tray: "Compare tray",
    open: "Open comparison",
  },

  about: {
    title: "Method",
    lead: "Oriel does not run evaluations. It records and presents them. Everything here comes from Artificial Analysis — below is what the numbers mean and where to read them carefully.",

    sourceTitle: "Where the data comes from",
    sourceBody:
      "Every figure comes from the public Artificial Analysis API, fetched once a day at 00:23 UTC and committed straight into this site's repository. Oriel runs no benchmarks of its own and applies no weighting, correction, or recalibration — the numbers here are the numbers upstream published.",

    indexTitle: "The intelligence index",
    indexBody:
      "The intelligence index is Artificial Analysis's composite of several benchmarks, currently v{version}. One thing matters above all: **scores from different versions are not comparable**. Upstream recalibrates every model when the version changes, so trend lines here break at version boundaries rather than joining into a smooth but meaningless curve. Score movements across a version change are excluded from the changes feed for the same reason.",

    valueTitle: "How value is calculated",
    valueFormula: "Value = mean of available benchmark scores ÷ price per 1M output tokens",
    valueBody:
      "This one is Oriel's own derivation, not upstream data. It is computed only when a model has at least two benchmark scores and an output price — with a single score the ratio is too noisy, and a cheap small model measured on one benchmark would top the list on nothing. It measures points per dollar. It does not tell you whether a model fits your work.",

    coverageTitle: "Coverage",
    coverageBody:
      "Of {total} language models, only some are measured on any given metric: intelligence {intelligence}, coding {coding}, agentic {agentic}, pricing {price}, performance {performance}. A dash means not tested — not tested badly. Those are different claims, so selecting a dimension removes models without that metric from the board instead of leaving you to read several hundred dashes.",

    historyTitle: "History",
    historyBody:
      "Daily snapshots start on {first} and now cover {days} days. Earlier days were backfilled from this repository's git history — before that, each fetch simply overwrote the previous one. The record is still short: trend charts and the changes feed need weeks before they say much. Where there aren't enough points, they say so rather than drawing a misleading line.",

    arenaTitle: "Arena rankings",
    arenaBody:
      "Media boards are Elo ratings from head-to-head human votes, with a 95% confidence interval. **Where error bars overlap, the ranking gap carries no statistical meaning** — 3rd and 7th place may be indistinguishable. The bars are drawn so you can see that, instead of being handed a clean column of ranks that hides it.",

    limitsTitle: "Known limits",
    limitsBody:
      "The speech-to-text word error rate index is published to one decimal place, leaving many models tied at the same value; that board cannot actually order them, and the page marks how many are tied. Performance figures (throughput, latency) are medians measured at a particular time over a particular route, and move with provider load and your location. Prices cover base token billing only — no volume discounts, committed-use rates, or caching strategy.",
  },

  catBoard: {
    title: "Cat Board",
    lead: "A self-funded, independently run community benchmark — not official, not run by Oriel. The question set is private and rotates monthly, so this is one narrow view of long-term trends, not an authoritative or complete ranking. Don't take it as gospel.",
    sourceNote: "Source",
    sourceLinkLabel: "llm2014/llm_benchmark",
    siteLinkLabel: "Original site",
    reportDate: "This edition",
    tabs: {
      logic: "Logic",
      code: "Code",
      vision: "Vision",
    },
    unavailable: "Data temporarily unavailable",
    unavailableHint: "The third-party fetch failed or hasn't run yet. The rest of the site is unaffected.",
    codeNote: "The code methodology was revised to v3: no longer a single score, but per-project Pass / Skip / Pending / Failed, plus a \"correction rounds / final grade\" pair.",
    codeStatus: {
      pass: "Pass",
      skip: "Skipped",
      pending: "Pending",
      failed: "Failed",
    },
    monthCaveat: "The question set rotates monthly; only the latest edition is shown. Scores are not comparable across months, so this site does not chart a trend for them.",
    think: { on: "On", off: "Standard" },
    thinkHint: "Whether this run had the model's extended-thinking mode on — the same model often appears twice, once with it on and once off.",
    staleWarning: "This category hasn't been updated in {months} months",
  },

  common: {
    models: "models",
    vendors: "vendors",
    noValue: "—",
    skipToContent: "Skip to content",
    menu: "Menu",
    dataTable: "Data table",
    notFoundTitle: "Nothing at this address",
    notFoundBody: "The model may have been renamed, or dropped from the upstream data. Search for it on the leaderboard.",
  },
};
