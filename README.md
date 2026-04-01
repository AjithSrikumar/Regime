# Regime — Daily Market Intelligence

> **Know what to do with your money today.**

Regime is a production-grade daily decision engine for Indian retail investors. It translates institutional-quality multi-factor analysis into a single, actionable answer: *What is the market regime and how should I allocate my portfolio?*

Powered by the **NSE MomGold v2 model** — backtested 20+ years (2005–2026) with 20.2% CAGR, 1.38 Sharpe ratio.

---

## What It Does

Every day, Regime evaluates 4 market signals:

| Signal | Indicator | Bullish When |
|--------|-----------|-------------|
| **Trend** | NIFTY 50 vs 200-day SMA | NIFTY > 200 DMA |
| **Volatility** | India VIX vs 20-day MA | VIX < 20d avg (falling) |
| **Liquidity** | G-Sec 10Y vs 60-day MA | Yields falling |
| **Momentum** | Dual Momentum (abs + rel) | Both positive |

Combined into a **Regime Score (0–3)**:
- 🟢 **Score 3 → Risk ON**: Market is favorable — max equity
- 🟡 **Score 2 → Neutral**: Mixed signals — balanced
- 🔴 **Score 0–1 → Risk OFF**: Defensive — shift to gold

---

## Allocation Engine

Based on regime + vol-targeting + drawdown control:

| Regime | Equity | Gold |
|--------|--------|------|
| Risk ON (Score 3) | 80% | 20% |
| Neutral (Score 2) | 50% | 50% |
| Risk OFF (Score 1) | 30% | 70% |
| Risk OFF (Score 0) | 10% | 90% |

Additional adjustments: volatility targeting (15% annual), meta-momentum, gold boost, drawdown triggers (10% & 15%).

---

## Architecture

```
Regime/
├── backend/              # Python — seeding only (not deployed)
│   ├── app/
│   │   ├── engines/      # factor, allocation, backtest engines
│   │   └── data_ingestion/excel_loader.py
│   └── requirements.txt
├── frontend/             # Next.js 16 — deployed to Vercel
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Server component dashboard
│   │   │   └── api/                  # Route Handlers (no external server)
│   │   │       ├── regime/latest|history|changes
│   │   │       ├── allocation/latest|history
│   │   │       ├── factors/latest
│   │   │       ├── performance
│   │   │       └── dashboard
│   │   ├── components/               # UI components
│   │   └── lib/
│   │       ├── api.ts                # Calls /api/* route handlers
│   │       ├── supabase.ts           # Server-side Supabase client
│   │       └── utils.ts
│   └── vercel.json
├── supabase_seed/        # One-time DB seeding (run locally once)
│   ├── schema.sql        # Run in Supabase SQL Editor
│   ├── seed_supabase.py  # Run locally to populate DB
│   └── *.csv             # Pre-exported data files
└── NSE_RegimeModel_v2.xlsx
```

---

## Backtested Performance (2005–2026)

| Metric | Value |
|--------|-------|
| Strategy CAGR | 20.2% |
| Benchmark CAGR | 22.0% |
| Sharpe Ratio | 1.38 |
| Max Drawdown | -24.8% |
| Calmar Ratio | 0.82 |
| Win Rate | 56.3% |
| Years of Data | 20.8 |

---

## Quick Start

### Prerequisites
- Python 3.11+ (seeding only)
- Node.js 18+

### 1. Create tables in Supabase
Paste `supabase_seed/schema.sql` into the Supabase SQL Editor and run it.

### 2. Seed the database (run once)
```bash
pip install psycopg2-binary
export DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-1-....supabase.com:6543/postgres"
python3 supabase_seed/seed_supabase.py
```

### 3. Run the frontend locally
```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

```
GET /regime/latest      Current regime, score, confidence
GET /regime/history     Last N days of regime data
GET /regime/changes     Historical regime transition events
GET /allocation/latest  Current portfolio allocation
GET /allocation/history Historical allocation weights
GET /factors/latest     All signal values + insights
GET /performance        Backtest metrics + chart data
GET /dashboard          All data in one call
```

---

## Deployment

**Stack: Vercel + Supabase only. No separate backend server.**

1. Seed Supabase: run `schema.sql` in SQL Editor, then `seed_supabase.py` locally
2. **Vercel** — connect `frontend/` directory; set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

API routes run as Vercel Serverless Functions — zero infra to maintain.

---

## Data Sources

Historical data (seeded from Excel):
- NIFTY 50: NSE
- India VIX: NSE
- G-Sec 10Y: investing.com
- Gold BeES (GBES): NSE/BSE
- USD/INR: investing.com

---

*Not investment advice. Past performance does not guarantee future results.*
