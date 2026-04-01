"use client";

import { RegimeData, AllocationData } from "@/lib/api";
import { REGIME_CONFIG, RegimeType, formatDate, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  regime: RegimeData;
  allocation: AllocationData;
}

export default function RegimeHero({ regime, allocation }: Props) {
  const cfg = REGIME_CONFIG[regime.regime as RegimeType] ?? REGIME_CONFIG["Risk OFF"];
  const isRiskOn = regime.regime === "Risk ON";
  const isNeutral = regime.regime === "Neutral";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-8 md:p-10",
      cfg.border,
      cfg.bg,
      "shadow-2xl",
      cfg.glow
    )}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 40%, ${cfg.color}, transparent 60%)` }}
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* Left: Regime Signal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-3 h-3 rounded-full pulse-dot", cfg.dot)} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#8b949e" }}>
              Market Regime · {formatDate(regime.date)}
            </span>
          </div>

          <h1 className={cn("text-5xl md:text-6xl font-bold tracking-tight mb-2", cfg.text)}>
            {regime.regime}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className={cn("text-sm px-3 py-1 rounded-full border font-medium", cfg.badge)}>
              Score {regime.regime_score}/3
            </span>
            <span className={cn("text-sm px-3 py-1 rounded-full border font-medium", cfg.badge)}>
              {regime.confidence}% confidence
            </span>
            {regime.regime_changed && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-medium">
                ⚡ Regime Changed
              </span>
            )}
          </div>

          {/* Action CTA */}
          <div className={cn(
            "inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-lg",
            cfg.actionColor,
            "transition-colors shadow-lg"
          )}>
            {isRiskOn ? "🚀" : isNeutral ? "⚖️" : "🛡️"} {cfg.action}
          </div>
        </div>

        {/* Right: Allocation */}
        <div className="flex-shrink-0 min-w-[220px]">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#8b949e" }}>
            Today&apos;s Allocation
          </p>

          <AllocationBars equity={allocation.equity_pct} gold={allocation.gold_pct} debt={allocation.debt_pct} />

          <p className="text-xs mt-3" style={{ color: "#8b949e" }}>
            {allocation.description}
          </p>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="relative z-10 mt-8 pt-6 border-t grid grid-cols-3 gap-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <StatItem label="NIFTY 50" value={regime.nifty ? formatNumber(regime.nifty, 0) : "—"} />
        <StatItem label="India VIX" value={regime.vix ? formatNumber(regime.vix, 2) : "—"} />
        <StatItem label="G-Sec 10Y" value={regime.gsec_10y ? `${formatNumber(regime.gsec_10y, 2)}%` : "—"} />
      </div>
    </div>
  );
}

function AllocationBars({ equity, gold, debt }: { equity: number; gold: number; debt: number }) {
  return (
    <div className="space-y-3">
      <AllocationBar label="Equity" value={equity} color="#3b82f6" icon="📈" />
      <AllocationBar label="Gold" value={gold} color="#f59e0b" icon="🥇" />
      {debt > 0 && <AllocationBar label="Debt" value={debt} color="#8b5cf6" icon="🏦" />}
    </div>
  );
}

function AllocationBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium" style={{ color: "#f0f6fc" }}>
          {icon} {label}
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "#8b949e" }}>{label}</p>
      <p className="text-lg font-semibold" style={{ color: "#f0f6fc" }}>{value}</p>
    </div>
  );
}
