"use client";

import { PerformanceMetrics, RegimeDistribution } from "@/lib/api";

interface Props {
  metrics: PerformanceMetrics;
  distribution: RegimeDistribution;
}

export default function PerformanceSummary({ metrics, distribution }: Props) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: "#0d1117", borderColor: "#21262d" }}>
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: "#f0f6fc" }}>
          Backtested Performance
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
          {metrics.years_of_data} years · 2005–2026 · net of costs
        </p>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard label="Strategy CAGR" value={`${metrics.strategy_cagr}%`} positive />
        <MetricCard label="Sharpe Ratio" value={metrics.sharpe_ratio.toFixed(2)} positive />
        <MetricCard label="Max Drawdown" value={`${metrics.max_drawdown}%`} positive={false} />
        <MetricCard label="Win Rate" value={`${metrics.win_rate}%`} positive />
      </div>

      {/* vs benchmark */}
      <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <p className="text-xs mb-2 font-medium" style={{ color: "#8b949e" }}>vs Benchmarks</p>
        <div className="space-y-1.5">
          <BenchmarkRow label="Strategy" value={metrics.strategy_cagr} color="#3b82f6" />
          <BenchmarkRow label="MC150M50 B&H" value={metrics.benchmark_cagr} color="#8b949e" />
          <BenchmarkRow label="Gold B&H" value={metrics.gold_cagr} color="#f59e0b" />
        </div>
      </div>

      {/* Regime distribution */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: "#8b949e" }}>Regime Distribution</p>
        <div className="space-y-2">
          <DistRow label="Risk ON" days={distribution.risk_on_days} pct={distribution.risk_on_pct} color="#22c55e" />
          <DistRow label="Neutral" days={distribution.neutral_days} pct={distribution.neutral_pct} color="#eab308" />
          <DistRow label="Risk OFF" days={distribution.risk_off_days} pct={distribution.risk_off_pct} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
      <p className="text-xs mb-1" style={{ color: "#8b949e" }}>{label}</p>
      <p className={`text-xl font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
    </div>
  );
}

function BenchmarkRow({ label, value, color }: { label: string; value: number; color: string }) {
  const max = 25;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-28 flex-shrink-0" style={{ color: "#8b949e" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-12 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function DistRow({ label, days, pct, color }: { label: string; days: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-xs flex-1" style={{ color: "#8b949e" }}>{label}</span>
      <div className="w-24 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: "#8b949e" }}>{pct}%</span>
    </div>
  );
}
