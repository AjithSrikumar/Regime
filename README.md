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
├── backend/          # FastAPI (Python)
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── engines/
│   │   │   ├── factor_engine.py      # Signal computation
│   │   │   ├── allocation_engine.py  # Position sizing
│   │   │   └── backtest_engine.py    # Performance metrics
│   │   ├── routers/
│   │   │   ├── regime.py
│   │   │   ├── allocation.py
│   │   │   ├── factors.py
│   │   │   └── performance.py
│   │   └── data_ingestion/
│   │       └── excel_loader.py       # Seeds DB from Excel
│   └── requirements.txt
├── frontend/         # Next.js 16 (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── components/
│   │   │   ├── RegimeHero.tsx        # Regime indicator + allocation
│   │   │   ├── SignalBreakdown.tsx   # 4-signal cards
│   │   │   ├── PerformanceSummary.tsx
│   │   │   ├── PerformanceChart.tsx  # NAV chart (Recharts)
│   │   │   ├── RegimeHistory.tsx
│   │   │   └── AllocationHistory.tsx
│   │   └── lib/
│   │       ├── api.ts                # API client
│   │       └── utils.ts
│   └── vercel.json
├── NSE_RegimeModel_v2.xlsx           # Source model
└── start.sh                          # Dev startup script
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
- Python 3.11+
- Node.js 18+

### Run locally

```bash
# Clone and start everything
./start.sh
```

Or manually:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
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

- **Frontend**: Vercel (connect `frontend/` directory)
- **Backend**: Railway or Render (connect `backend/` directory)
- **Database**: Supabase PostgreSQL (set `DATABASE_URL` env var)

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
