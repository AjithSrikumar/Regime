"""
Backtest Engine — Recreates BACKTEST sheet from NSE_RegimeModel_v2.xlsx.

Computes:
  - Daily portfolio returns (net of transaction costs)
  - Portfolio NAV (start=100)
  - Portfolio drawdown
  - Benchmark NAVs (MC150M50 B&H, Gold B&H)
  - Performance metrics: CAGR, Sharpe, Max DD, Calmar, Win Rate
"""

import numpy as np
import pandas as pd
from typing import dict as Dict


TRANSACTION_COST = 0.002
RISK_FREE_RATE   = 0.0    # Rf=0 (as per Excel)
TRADING_DAYS     = 252
STARTING_NAV     = 100.0


def compute_backtest(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input  : DataFrame with columns:
               date, regime, dd_adj_mom_weight, dd_adj_gold_weight,
               mc150m50 (or nifty), gold_price
             sorted ascending by date.
    Output : Input df with backtest columns appended.
    """
    df = df.copy().sort_values("date").reset_index(drop=True)

    # Daily returns of underlying assets
    if "mc150m50" in df.columns and df["mc150m50"].notna().sum() > 2:
        df["mom_return"] = df["mc150m50"].pct_change().fillna(0)
    else:
        df["mom_return"] = df["nifty"].pct_change().fillna(0)

    if "gold_price" in df.columns and df["gold_price"].notna().sum() > 2:
        df["gold_return"] = df["gold_price"].pct_change().fillna(0)
    else:
        df["gold_return"] = 0.0

    # ── Portfolio Return ──────────────────────────────────────────────────────
    # Transaction cost applied when weights change
    weight_change = (
        df["dd_adj_mom_weight"].diff().abs() +
        df["dd_adj_gold_weight"].diff().abs()
    ).fillna(0)
    df["transaction_cost"] = (weight_change * TRANSACTION_COST).clip(upper=TRANSACTION_COST * 2)

    df["portfolio_return"] = (
        df["dd_adj_mom_weight"].shift(1).fillna(df["dd_adj_mom_weight"].iloc[0]) * df["mom_return"] +
        df["dd_adj_gold_weight"].shift(1).fillna(df["dd_adj_gold_weight"].iloc[0]) * df["gold_return"] -
        df["transaction_cost"]
    )

    # ── NAV Calculation ───────────────────────────────────────────────────────
    df["portfolio_nav"] = STARTING_NAV * (1 + df["portfolio_return"]).cumprod()

    # ── Drawdown ──────────────────────────────────────────────────────────────
    rolling_max = df["portfolio_nav"].expanding().max()
    df["portfolio_drawdown"] = (df["portfolio_nav"] - rolling_max) / rolling_max

    # ── Benchmark NAVs ────────────────────────────────────────────────────────
    df["benchmark_nav"] = STARTING_NAV * (1 + df["mom_return"]).cumprod()
    df["gold_bh_nav"]   = STARTING_NAV * (1 + df["gold_return"]).cumprod()

    return df


def compute_performance_metrics(df: pd.DataFrame) -> dict:
    """Compute summary performance metrics from backtest DataFrame."""
    returns = df["portfolio_return"].dropna()
    nav     = df["portfolio_nav"].dropna()

    if len(returns) < 2:
        return {}

    years   = len(returns) / TRADING_DAYS
    cagr    = (nav.iloc[-1] / STARTING_NAV) ** (1 / years) - 1
    ann_vol = returns.std() * np.sqrt(TRADING_DAYS)
    sharpe  = cagr / ann_vol if ann_vol > 0 else 0
    max_dd  = df["portfolio_drawdown"].min()
    calmar  = cagr / abs(max_dd) if max_dd < 0 else 0
    win_rate = (returns > 0).mean()
    best_day  = returns.max()
    worst_day = returns.min()

    # Benchmark CAGR
    bm_returns = df["mom_return"].dropna()
    bm_nav     = df["benchmark_nav"].dropna()
    bm_cagr    = (bm_nav.iloc[-1] / STARTING_NAV) ** (1 / years) - 1 if len(bm_nav) > 1 else 0

    gold_returns = df["gold_return"].dropna()
    gold_nav     = df["gold_bh_nav"].dropna()
    gold_cagr    = (gold_nav.iloc[-1] / STARTING_NAV) ** (1 / years) - 1 if len(gold_nav) > 1 else 0

    return {
        "strategy_cagr": round(cagr * 100, 2),
        "benchmark_cagr": round(bm_cagr * 100, 2),
        "gold_cagr": round(gold_cagr * 100, 2),
        "annual_vol": round(ann_vol * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "max_drawdown": round(max_dd * 100, 2),
        "calmar_ratio": round(calmar, 2),
        "win_rate": round(win_rate * 100, 2),
        "best_day": round(best_day * 100, 2),
        "worst_day": round(worst_day * 100, 2),
        "years_of_data": round(years, 1),
        "final_nav": round(nav.iloc[-1], 2),
    }


def compute_regime_distribution(df: pd.DataFrame) -> dict:
    """Return percentage of days in each regime."""
    if "regime" not in df.columns:
        return {}
    total = len(df)
    dist  = df["regime"].value_counts()
    return {
        "Risk ON":   {"days": int(dist.get("Risk ON", 0)),   "pct": round(dist.get("Risk ON",  0) / total * 100, 1)},
        "Neutral":   {"days": int(dist.get("Neutral", 0)),   "pct": round(dist.get("Neutral",  0) / total * 100, 1)},
        "Risk OFF":  {"days": int(dist.get("Risk OFF", 0)),  "pct": round(dist.get("Risk OFF", 0) / total * 100, 1)},
    }
