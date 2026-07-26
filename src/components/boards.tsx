"use client";

import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  arenaColumns,
  speechToSpeechColumns,
  speechToTextColumns,
} from "@/lib/columns";
import type {
  ArenaModel,
  SpeechToSpeechModel,
  SpeechToTextModel,
} from "@/lib/types";

export function ArenaBoard({
  rows,
  placeholder = "搜索模型…",
}: {
  rows: ArenaModel[];
  placeholder?: string;
}) {
  return (
    <LeaderboardTable
      rows={rows}
      columns={arenaColumns}
      getRowKey={(row) => row.id}
      defaultSortKey="elo"
      searchPlaceholder={placeholder}
    />
  );
}

export function SpeechToSpeechBoard({ rows }: { rows: SpeechToSpeechModel[] }) {
  return (
    <LeaderboardTable
      rows={rows}
      columns={speechToSpeechColumns}
      getRowKey={(row) => row.id}
      defaultSortKey="bba"
      searchPlaceholder="搜索语音对话模型…"
    />
  );
}

export function SpeechToTextBoard({ rows }: { rows: SpeechToTextModel[] }) {
  return (
    <LeaderboardTable
      rows={rows}
      columns={speechToTextColumns}
      getRowKey={(row) => row.id}
      defaultSortKey="wer"
      defaultSortDir="asc"
      searchPlaceholder="搜索语音转写模型…"
    />
  );
}
