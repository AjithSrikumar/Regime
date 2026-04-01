"use client";

import { FactorsData, Insight } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  factors: FactorsData;
}

const STATUS_CONFIG = {
  bullish: { icon: "✅", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  bearish: { icon: "❌", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  warning: { icon: "⚠️", color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20" },
};

export default function SignalBreakdown({ factors }: Props) {
  const bullishCount = factors.insights.filter((i) => i.status === "bullish").length;
  const total = factors.insights.length;

  return (
    <div className="rounded-2xl border p-6" style={{ background: "#0d1117", borderColor: "#21262d" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#f0f6fc" }}>Signal Breakdown</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
            {bullishCount}/{total} signals bullish
          </p>
        </div>
        <ScoreRing score={factors.regime_score} />
      </div>

      <div className="space-y-3">
        {factors.insights.map((insight) => (
          <SignalCard key={insight.signal} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function SignalCard({ insight }: { insight: Insight }) {
  const cfg = STATUS_CONFIG[insight.status];
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-xl border", cfg.bg, cfg.border)}>
      <span className="text-base mt-0.5 flex-shrink-0">{cfg.icon}</span>
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", cfg.color)}>{insight.label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8b949e" }}>
          {insight.description}
        </p>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 3) * 100;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color = score === 3 ? "#22c55e" : score === 2 ? "#eab308" : score === 1 ? "#f97316" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg width={56} height={56} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle
          cx={28} cy={28} r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>
        {score}/3
      </span>
    </div>
  );
}
