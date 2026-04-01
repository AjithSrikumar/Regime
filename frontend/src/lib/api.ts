/**
 * All API routes are Next.js Route Handlers (/api/*) — no external backend.
 * In server components (page.tsx) we use an absolute URL so Next.js can
 * self-fetch during SSR.  In dev that's http://localhost:3000; in production
 * Vercel sets VERCEL_URL automatically.
 */
function base() {
  if (typeof window !== "undefined") return ""; // client-side: use relative path
  // Server-side: need absolute URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export interface RegimeData {
  date: string;
  regime: "Risk ON" | "Neutral" | "Risk OFF";
  regime_score: number;
  confidence: number;
  prev_regime: string | null;
  regime_changed: boolean;
  nifty: number | null;
  vix: number | null;
  gsec_10y: number | null;
}

export interface AllocationData {
  date: string;
  regime: string;
  equity_pct: number;
  gold_pct: number;
  debt_pct: number;
  description: string;
}

export interface Insight {
  signal: string;
  status: "bullish" | "bearish" | "warning";
  label: string;
  description: string;
}

export interface FactorsData {
  date: string;
  nifty: number | null;
  nifty_200dma: number | null;
  trend_signal: number;
  vix: number | null;
  vix_20d_ma: number | null;
  vol_signal: number;
  gsec_10y: number | null;
  gsec_60d_ma: number | null;
  liq_signal: number;
  dual_mom_signal: number;
  regime_score: number;
  insights: Insight[];
}

export interface PerformanceMetrics {
  strategy_cagr: number;
  benchmark_cagr: number;
  gold_cagr: number;
  annual_vol: number;
  sharpe_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
  win_rate: number;
  best_day: number;
  worst_day: number;
  years_of_data: number;
  final_nav: number;
}

export interface RegimeDistribution {
  risk_on_days: number;
  risk_on_pct: number;
  neutral_days: number;
  neutral_pct: number;
  risk_off_days: number;
  risk_off_pct: number;
}

export interface ChartPoint {
  date: string;
  portfolio_nav: number;
  benchmark_nav: number;
  gold_bh_nav: number;
  portfolio_dd: number;
  regime: string;
}

export interface PerformanceData {
  metrics: PerformanceMetrics;
  regime_distribution: RegimeDistribution;
  chart_data: ChartPoint[];
}

export interface RegimeHistoryPoint {
  date: string;
  regime: string;
  regime_score: number;
  confidence: number;
  regime_changed: boolean;
  nifty: number | null;
  vix: number | null;
}

export interface AllocationHistoryPoint {
  date: string;
  equity_pct: number;
  gold_pct: number;
  debt_pct: number;
  base_equity: number;
  drawdown: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${base()}/api${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status} ${url}`);
  return res.json();
}

export const api = {
  regime: {
    latest: ()             => fetchJson<RegimeData>("/regime/latest"),
    history: (days = 90)   => fetchJson<RegimeHistoryPoint[]>(`/regime/history?days=${days}`),
    changes: (limit = 15)  => fetchJson<{ date: string; new_regime: string; old_regime: string; score: number }[]>(`/regime/changes?limit=${limit}`),
  },
  allocation: {
    latest: ()             => fetchJson<AllocationData>("/allocation/latest"),
    history: (days = 365)  => fetchJson<AllocationHistoryPoint[]>(`/allocation/history?days=${days}`),
  },
  factors: {
    latest: ()             => fetchJson<FactorsData>("/factors/latest"),
  },
  performance: {
    get: (chartDays = 500) => fetchJson<PerformanceData>(`/performance?chart_days=${chartDays}`),
  },
};
