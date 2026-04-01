-- Regime schema — run once in Supabase SQL Editor
-- Tables: market_data, factors, regime, allocation, performance

CREATE TABLE IF NOT EXISTS market_data (
  date        DATE PRIMARY KEY,
  nifty       FLOAT,
  vix         FLOAT,
  gsec_10y    FLOAT,
  gold_price  FLOAT,
  usd_inr     FLOAT,
  mc150m50    FLOAT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factors (
  date              DATE PRIMARY KEY,
  nifty_200dma      FLOAT,
  trend_signal      INTEGER,
  vix_20d_ma        FLOAT,
  vol_signal        INTEGER,
  gsec_60d_ma       FLOAT,
  liq_signal        INTEGER,
  dual_mom_signal   INTEGER DEFAULT 0,
  regime_score      INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regime (
  date            DATE PRIMARY KEY,
  regime          TEXT,
  regime_score    INTEGER,
  confidence      FLOAT,
  prev_regime     TEXT,
  regime_changed  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allocation (
  date                  DATE PRIMARY KEY,
  base_mom_weight       FLOAT,
  vol_adj_mom_weight    FLOAT,
  dual_mom_signal       INTEGER DEFAULT 0,
  meta_mom_weight       FLOAT,
  gold_boost            FLOAT,
  final_mom_weight      FLOAT,
  final_gold_weight     FLOAT,
  momentum_drawdown     FLOAT,
  dd_adj_mom_weight     FLOAT,
  dd_adj_gold_weight    FLOAT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance (
  date                DATE PRIMARY KEY,
  regime              TEXT,
  mom_weight          FLOAT,
  gold_weight         FLOAT,
  momentum_return     FLOAT,
  gold_return         FLOAT,
  transaction_cost    FLOAT,
  portfolio_return    FLOAT,
  portfolio_nav       FLOAT,
  portfolio_drawdown  FLOAT,
  benchmark_nav       FLOAT,
  gold_bh_nav         FLOAT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);