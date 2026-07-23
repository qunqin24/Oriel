"use client";

import type { ComponentType } from "react";
import Adobe from "@lobehub-icons/Adobe/components/Mono.js";
import Ai2 from "@lobehub-icons/Ai2/components/Mono.js";
import Ai21 from "@lobehub-icons/Ai21/components/Mono.js";
import Alibaba from "@lobehub-icons/Alibaba/components/Mono.js";
import Anthropic from "@lobehub-icons/Anthropic/components/Mono.js";
import Arcee from "@lobehub-icons/Arcee/components/Mono.js";
import AssemblyAI from "@lobehub-icons/AssemblyAI/components/Mono.js";
import Aws from "@lobehub-icons/Aws/components/Mono.js";
import Baidu from "@lobehub-icons/Baidu/components/Mono.js";
import ByteDance from "@lobehub-icons/ByteDance/components/Mono.js";
import Cohere from "@lobehub-icons/Cohere/components/Mono.js";
import DeepSeek from "@lobehub-icons/DeepSeek/components/Mono.js";
import ElevenLabs from "@lobehub-icons/ElevenLabs/components/Mono.js";
import Fal from "@lobehub-icons/Fal/components/Mono.js";
import FishAudio from "@lobehub-icons/FishAudio/components/Mono.js";
import Flux from "@lobehub-icons/Flux/components/Mono.js";
import Google from "@lobehub-icons/Google/components/Mono.js";
import Groq from "@lobehub-icons/Groq/components/Mono.js";
import IBM from "@lobehub-icons/IBM/components/Mono.js";
import Ideogram from "@lobehub-icons/Ideogram/components/Mono.js";
import Inception from "@lobehub-icons/Inception/components/Mono.js";
import Kimi from "@lobehub-icons/Kimi/components/Mono.js";
import Kling from "@lobehub-icons/Kling/components/Mono.js";
import LG from "@lobehub-icons/LG/components/Mono.js";
import Liquid from "@lobehub-icons/Liquid/components/Mono.js";
import LongCat from "@lobehub-icons/LongCat/components/Mono.js";
import Luma from "@lobehub-icons/Luma/components/Mono.js";
import Meta from "@lobehub-icons/Meta/components/Mono.js";
import Microsoft from "@lobehub-icons/Microsoft/components/Mono.js";
import Midjourney from "@lobehub-icons/Midjourney/components/Mono.js";
import Minimax from "@lobehub-icons/Minimax/components/Mono.js";
import Mistral from "@lobehub-icons/Mistral/components/Mono.js";
import Moonshot from "@lobehub-icons/Moonshot/components/Mono.js";
import NousResearch from "@lobehub-icons/NousResearch/components/Mono.js";
import Nvidia from "@lobehub-icons/Nvidia/components/Mono.js";
import OpenAI from "@lobehub-icons/OpenAI/components/Mono.js";
import Perplexity from "@lobehub-icons/Perplexity/components/Mono.js";
import Pika from "@lobehub-icons/Pika/components/Mono.js";
import PixVerse from "@lobehub-icons/PixVerse/components/Mono.js";
import Recraft from "@lobehub-icons/Recraft/components/Mono.js";
import Runway from "@lobehub-icons/Runway/components/Mono.js";
import Snowflake from "@lobehub-icons/Snowflake/components/Mono.js";
import Stability from "@lobehub-icons/Stability/components/Mono.js";
import Stepfun from "@lobehub-icons/Stepfun/components/Mono.js";
import Suno from "@lobehub-icons/Suno/components/Mono.js";
import Tencent from "@lobehub-icons/Tencent/components/Mono.js";
import TII from "@lobehub-icons/TII/components/Mono.js";
import Udio from "@lobehub-icons/Udio/components/Mono.js";
import Upstage from "@lobehub-icons/Upstage/components/Mono.js";
import Vidu from "@lobehub-icons/Vidu/components/Mono.js";
import XAI from "@lobehub-icons/XAI/components/Mono.js";
import XiaomiMiMo from "@lobehub-icons/XiaomiMiMo/components/Mono.js";
import ZAI from "@lobehub-icons/ZAI/components/Mono.js";

type Props = {
  name: string | null | undefined;
  size?: number;
  className?: string;
};

type IconProps = { size?: number | string; className?: string };
type BrandIcon = ComponentType<IconProps>;

const RULES: { test: (n: string) => boolean; Icon: BrandIcon }[] = [
  { test: (n) => n.includes("openai"), Icon: OpenAI },
  {
    test: (n) => n.includes("anthropic") || n.includes("claude"),
    Icon: Anthropic,
  },
  {
    test: (n) =>
      n.includes("google") || n.includes("gemini") || n.includes("deepmind"),
    Icon: Google,
  },
  { test: (n) => n.includes("deepseek"), Icon: DeepSeek },
  { test: (n) => n.includes("meta") || n.includes("llama"), Icon: Meta },
  { test: (n) => n.includes("mistral"), Icon: Mistral },
  {
    test: (n) =>
      n.includes("alibaba") || n.includes("qwen") || n.includes("通义"),
    Icon: Alibaba,
  },
  { test: (n) => n.includes("moonshot"), Icon: Moonshot },
  { test: (n) => n.includes("kimi"), Icon: Kimi },
  {
    test: (n) =>
      n.includes("spacexai") || n.includes("xai") || n.includes("grok"),
    Icon: XAI,
  },
  { test: (n) => n.includes("nvidia"), Icon: Nvidia },
  { test: (n) => n.includes("amazon") || n === "aws", Icon: Aws },
  { test: (n) => n.includes("ibm"), Icon: IBM },
  { test: (n) => n.includes("allen") || n === "ai2", Icon: Ai2 },
  { test: (n) => n.includes("xiaomi"), Icon: XiaomiMiMo },
  { test: (n) => n.includes("liquid"), Icon: Liquid },
  { test: (n) => n.includes("lg ai") || n.startsWith("lg "), Icon: LG },
  { test: (n) => n.includes("minimax"), Icon: Minimax },
  { test: (n) => n.includes("nous"), Icon: NousResearch },
  { test: (n) => n.includes("upstage"), Icon: Upstage },
  { test: (n) => n.includes("ai21"), Icon: Ai21 },
  { test: (n) => n.includes("cohere"), Icon: Cohere },
  { test: (n) => n.includes("perplexity"), Icon: Perplexity },
  { test: (n) => n.includes("stepfun") || n.includes("step fun"), Icon: Stepfun },
  { test: (n) => n.includes("microsoft"), Icon: Microsoft },
  { test: (n) => n.includes("baidu") || n.includes("wenxin"), Icon: Baidu },
  {
    test: (n) =>
      n.includes("bytedance") || n.includes("doubao") || n.includes("seed"),
    Icon: ByteDance,
  },
  {
    test: (n) => n.includes("tencent") || n.includes("hunyuan"),
    Icon: Tencent,
  },
  { test: (n) => n.includes("longcat"), Icon: LongCat },
  { test: (n) => n.includes("snowflake"), Icon: Snowflake },
  { test: (n) => n.includes("arcee"), Icon: Arcee },
  {
    test: (n) =>
      n === "z ai" ||
      n === "zai" ||
      n.includes("zhipu") ||
      n.includes("chatglm"),
    Icon: ZAI,
  },
  { test: (n) => n.includes("tii"), Icon: TII },
  { test: (n) => n.includes("inception"), Icon: Inception },
  { test: (n) => n.includes("midjourney"), Icon: Midjourney },
  {
    test: (n) => n.includes("stability") || n.includes("stable diffusion"),
    Icon: Stability,
  },
  { test: (n) => n.includes("suno"), Icon: Suno },
  { test: (n) => n.includes("eleven"), Icon: ElevenLabs },
  { test: (n) => n.includes("runway"), Icon: Runway },
  { test: (n) => n.includes("luma"), Icon: Luma },
  { test: (n) => n.includes("pika"), Icon: Pika },
  { test: (n) => n.includes("kling"), Icon: Kling },
  {
    test: (n) =>
      n.includes("black forest") || n.includes("bfl") || n.includes("flux"),
    Icon: Flux,
  },
  { test: (n) => n === "fal" || n.startsWith("fal "), Icon: Fal },
  { test: (n) => n.includes("recraft"), Icon: Recraft },
  { test: (n) => n.includes("ideogram"), Icon: Ideogram },
  { test: (n) => n.includes("adobe"), Icon: Adobe },
  { test: (n) => n.includes("pixverse") || n.includes("pix verse"), Icon: PixVerse },
  { test: (n) => n.includes("vidu"), Icon: Vidu },
  { test: (n) => n.includes("udio"), Icon: Udio },
  { test: (n) => n.includes("groq"), Icon: Groq },
  { test: (n) => n.includes("fish audio") || n.includes("fishaudio"), Icon: FishAudio },
  { test: (n) => n.includes("assembly"), Icon: AssemblyAI },
];

export function VendorIcon({ name, size = 16, className = "" }: Props) {
  if (!name) return null;

  const n = name.toLowerCase().trim();
  const hit = RULES.find((r) => r.test(n));

  if (!hit) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--line-strong, #ccc)",
          color: "var(--ink, #111)",
          fontSize: Math.max(9, size * 0.55),
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  const { Icon } = hit;
  return <Icon size={size} className={className} />;
}
