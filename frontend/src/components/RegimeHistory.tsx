"use client";

import { RegimeHistoryPoint } from "@/lib/api";
import { REGIME_CONFIG, RegimeType, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  history: RegimeHistoryPoint[];
  changes: { date: string; new_regime: string; old_regime: string; score: number }[];
}

export default function RegimeHistory({ history, changes }: Props) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: "#0d1117", borderColor: "#21262d" }}>
      <h2 className="text-base font-semibold mb-1" style={{ color: "#f0f6fc" }}>Regime Changes</h2>
      <p className="text-xs mb-5" style={{ color: "#8b949e" }}>Recent market regime transitions</p>

      <div className="space-y-2">
        {changes.slice(0, 8).map((c, i) => {
          const cfg = REGIME_CONFIG[c.new_regime as RegimeType] ?? REGIME_CONFIG["Risk OFF"];
          const prevCfg = REGIME_CONFIG[c.old_regime as RegimeType] ?? REGIME_CONFIG["Risk OFF"];
          return (
            <div
              key={c.date}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", prevCfg.badge)}>
                    {c.old_regime}
                  </span>
                  <span className="text-xs" style={{ color: "#8b949e" }}>→</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
                    {c.new_regime}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#8b949e" }}>{formatDate(c.date)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold" style={{ color: cfg.color }}>
                  Score {c.score}/3
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
