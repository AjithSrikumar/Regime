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
  // Parallel data fetch — catch errors and show a helpful message
  let regime, allocation, factors, performance, regimeHistory, allocHistory, regimeChanges;
  try {
    [regime, allocation, factors, performance, regimeHistory, allocHistory, regimeChanges] =
      await Promise.all([
        api.regime.latest(),
        api.allocation.latest(),
        api.factors.latest(),
        api.performance.get(500),
        api.regime.history(90),
        api.allocation.history(252),
        api.regime.changes(15),
      ]);
  } catch (err: any) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-5xl mb-6">⚙️</p>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#f0f6fc" }}>
            Setup Required
          </h1>
          <p className="text-base mb-6" style={{ color: "#8b949e" }}>
            {err?.message?.includes("env vars")
              ? "Supabase environment variables are not configured in Vercel."
              : err?.message?.includes("No regime data") || err?.message?.includes("fetch")
              ? "Database is empty — run the seeder first."
              : String(err?.message ?? "Unknown error")}
          </p>
          <div className="rounded-xl border p-5 text-left text-sm space-y-2"
            style={{ background: "#0d1117", borderColor: "#21262d", color: "#8b949e" }}>
            <p className="font-semibold" style={{ color: "#f0f6fc" }}>Checklist:</p>
            <p>1. Supabase SQL Editor → run <code style={{color:"#60a5fa"}}>supabase_seed/schema.sql</code></p>
            <p>2. Run seeder: <code style={{color:"#60a5fa"}}>node supabase_seed/seed_supabase.js "postgresql://..."</code></p>
            <p>3. Vercel → Settings → Environment Variables → add:</p>
            <p className="pl-4"><code style={{color:"#60a5fa"}}>NEXT_PUBLIC_SUPABASE_URL</code></p>
            <p className="pl-4"><code style={{color:"#60a5fa"}}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></p>
            <p>4. Vercel → Deployments → Redeploy</p>
          </div>
        </main>
      </>
    );
  }

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
