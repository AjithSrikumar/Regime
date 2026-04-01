import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import RegimeHero from "@/components/RegimeHero";
import SignalBreakdown from "@/components/SignalBreakdown";
import PerformanceSummary from "@/components/PerformanceSummary";
import PerformanceChart from "@/components/PerformanceChart";
import RegimeHistory from "@/components/RegimeHistory";
import AllocationHistory from "@/components/AllocationHistory";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Parallel data fetch
  const [regime, allocation, factors, performance, regimeHistory, allocHistory, regimeChanges] =
    await Promise.all([
      api.regime.latest(),
      api.allocation.latest(),
      api.factors.latest(),
      api.performance.get(500),
      api.regime.history(90),
      api.allocation.history(252),
      api.regime.changes(15),
    ]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero: Regime + Allocation */}
        <RegimeHero regime={regime} allocation={allocation} />

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Signals */}
          <SignalBreakdown factors={factors} />

          {/* Performance summary */}
          <PerformanceSummary
            metrics={performance.metrics}
            distribution={performance.regime_distribution}
          />

          {/* Regime changes */}
          <RegimeHistory history={regimeHistory} changes={regimeChanges} />
        </div>

        {/* Full-width performance chart */}
        <PerformanceChart data={performance.chart_data} />

        {/* Allocation history */}
        <AllocationHistory data={allocHistory} />

        {/* Footer */}
        <footer className="text-center py-8 text-xs" style={{ color: "#484f58" }}>
          <p>
            Regime · NSE MomGold v2 · Multi-Factor Regime Detection Engine
          </p>
          <p className="mt-1">
            Data: 2005–2026 · Backtested net of 0.2% transaction costs · Not investment advice
          </p>
        </footer>
      </main>
    </>
  );
}
