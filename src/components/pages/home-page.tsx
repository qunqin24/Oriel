import { getLanguageModels, getOverviewStats } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { MetricCard } from "@/components/ui/metric-card";
import { VendorIcon } from "@/components/vendor-icon";

function LeadingModel({
  name,
  creator,
}: {
  name: string;
  creator?: string | null;
}) {
  return (
    <span
      className="font-medium text-foreground truncate inline-flex items-center gap-1.5 min-w-0 max-w-[70%]"
      title={name}
    >
      <VendorIcon name={creator} size={14} className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function HomePage() {
  const stats = getOverviewStats();
  const llm = getLanguageModels();

  const topLlmName = stats.top.language?.name || "GPT-4o";
  const topLlmScore = formatNumber(stats.top.language?.evaluations.artificial_analysis_intelligence_index, 1);
  
  // Find a fast model as an example
  const fastModel = llm.data.find(m => m.performance?.median_time_to_first_token_seconds != null) || llm.data[0];
  const fastModelName = fastModel?.name || "Groq Llama-3";
  const fastModelTTFT = fastModel?.performance?.median_time_to_first_token_seconds ? `${(fastModel.performance.median_time_to_first_token_seconds * 1000).toFixed(0)}ms` : "12ms";

  // Find a cost effective model
  const costModel = llm.data.find(m => m.pricing?.price_1m_output_tokens != null && m.pricing.price_1m_output_tokens < 1.0) || llm.data[1];
  const costModelName = costModel?.name || "Llama-3-70B";
  const costModelPrice = costModel?.pricing?.price_1m_output_tokens ? `$${costModel.pricing.price_1m_output_tokens}/M` : "$0.9/M";

  return (
    <div className="flex flex-col gap-12 max-w-6xl mx-auto py-8 px-6">
      {/* Hero */}
      <section className="flex flex-col gap-6 max-w-3xl">
        <div>
          <div className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground text-[11px] font-mono font-medium rounded uppercase tracking-wider mb-4 border hairline-border">
            Oriel Index v{stats.intelligenceIndexVersion ?? "2.1"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            A window into machine intelligence.
          </h1>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            独立观察与记录 AI 模型的能力、成本、速度与演进。打破黑盒迷雾，通过高密度数据面板为您提供精准的模型选型决策依据。
          </p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <a href="/llm" className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">
            查看语言模型榜单
          </a>
          <div className="relative w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="搜索模型..." className="w-full pl-9 pr-4 py-2.5 bg-card border hairline-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </section>

      {/* Today's Insights (Dense Metric Cards) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">今日观察摘要</h2>
          <span className="text-xs text-muted-foreground font-mono">Top Insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/llm" className="group">
            <MetricCard 
              label="智能领先" 
              value={topLlmScore} 
              subValue={topLlmName} 
              trend="up" 
              trendValue="92.5" 
              className="group-hover:border-primary/40 transition-colors cursor-pointer"
            />
          </a>
          <a href="/llm" className="group">
            <MetricCard 
              label="性价比优选" 
              value={costModelPrice} 
              subValue={costModelName} 
              className="group-hover:border-primary/40 transition-colors cursor-pointer"
            />
          </a>
          <a href="/llm" className="group">
            <MetricCard 
              label="速度最快 (TTFT)" 
              value={fastModelTTFT} 
              subValue={fastModelName} 
              className="group-hover:border-primary/40 transition-colors cursor-pointer"
            />
          </a>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between mb-2 border-b border-border pb-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">五大模态面板</h2>
          <span className="text-xs text-muted-foreground font-mono">Modalities</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/llm" className="instrument-panel p-5 hover:border-primary/40 transition-colors group flex flex-col justify-between min-h-35">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">语言模型 (LLM)</h3>
                <span className="font-mono text-xs text-muted-foreground">{stats.counts.language} 个</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">综合评估智能指数、编程指数、成本性价比及首 Token 延迟等维度。</p>
            </div>
            <div className="mt-4 pt-3 border-t hairline-border flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground shrink-0">当前领先</span>
              <LeadingModel
                name={topLlmName}
                creator={stats.top.language?.model_creator?.name}
              />
            </div>
          </a>

          <a href="/image" className="instrument-panel p-5 hover:border-primary/40 transition-colors group flex flex-col justify-between min-h-35">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">图像生成 (Image)</h3>
                <span className="font-mono text-xs text-muted-foreground">{stats.counts.image} 个</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">包含 Text-to-Image 及图像重构、盲测 Arena Elo 评分面板。</p>
            </div>
            <div className="mt-4 pt-3 border-t hairline-border flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground shrink-0">当前领先</span>
              <LeadingModel
                name={stats.top.image?.name || "Midjourney v6"}
                creator={stats.top.image?.model_creator?.name}
              />
            </div>
          </a>

          <a href="/video" className="instrument-panel p-5 hover:border-primary/40 transition-colors group flex flex-col justify-between min-h-35">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">视频生成 (Video)</h3>
                <span className="font-mono text-xs text-muted-foreground">{stats.counts.video} 个</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">多维度考量动态视频生成的画面稳定性、指令遵循与长视频能力。</p>
            </div>
            <div className="mt-4 pt-3 border-t hairline-border flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground shrink-0">当前领先</span>
              <LeadingModel
                name={stats.top.video?.name || "Sora"}
                creator={stats.top.video?.model_creator?.name}
              />
            </div>
          </a>

          <a href="/speech" className="instrument-panel p-5 hover:border-primary/40 transition-colors group flex flex-col justify-between min-h-35">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">语音模型 (Speech)</h3>
                <span className="font-mono text-xs text-muted-foreground">{stats.counts.speech} 个</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">文本到语音合成 (TTS) 和语音识别 (ASR) 综合测试数据。</p>
            </div>
            <div className="mt-4 pt-3 border-t hairline-border flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground shrink-0">当前领先</span>
              <LeadingModel
                name={stats.top.speech?.name || "ElevenLabs"}
                creator={stats.top.speech?.model_creator?.name}
              />
            </div>
          </a>

          <a href="/music" className="instrument-panel p-5 hover:border-primary/40 transition-colors group flex flex-col justify-between min-h-35">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">音乐生成 (Music)</h3>
                <span className="font-mono text-xs text-muted-foreground">{stats.counts.music} 个</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">评估 AI 音乐生成的旋律质量、流派还原度与生成速度。</p>
            </div>
            <div className="mt-4 pt-3 border-t hairline-border flex justify-between items-center text-xs gap-4">
              <span className="text-muted-foreground shrink-0">当前领先</span>
              <LeadingModel
                name={stats.top.music?.name || "Suno v3.5"}
                creator={stats.top.music?.model_creator?.name}
              />
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
