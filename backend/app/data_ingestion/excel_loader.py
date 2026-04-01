"""
Excel Loader — Parses NSE_RegimeModel_v2.xlsx and seeds the database.

Sheets used:
  Signals              → market_data + factors + regime tables
  Allocation           → allocation table
  Backtest             → performance table
  India VIX Historical Data
  India 10-Year Bond Yield Histor
  GBES Historical Data (Gold BeES ETF)
  USD_INR Historical Data
"""

import os
import pandas as pd
import numpy as np
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..models import MarketData, Factors, Regime, Allocation, Performance
from ..engines.factor_engine import score_to_confidence

FILENAME = "NSE_RegimeModel_v2.xlsx"

def _find_excel() -> str:
    """
    Locate the Excel file across different deployment layouts:
      - EXCEL_PATH env var (explicit override, highest priority)
      - Same dir as this file (backend/app/data_ingestion/)
      - backend/ directory
      - Repo root (3 levels up from this file)
      - Current working directory
    """
    if env_path := os.getenv("EXCEL_PATH"):
        return env_path

    candidates = [
        os.path.join(os.path.dirname(__file__), FILENAME),               # alongside loader
        os.path.join(os.path.dirname(__file__), "..", "..", FILENAME),    # backend/
        os.path.join(os.path.dirname(__file__), "..", "..", "..", FILENAME),  # repo root
        os.path.join(os.getcwd(), FILENAME),                              # CWD
        os.path.join(os.getcwd(), "backend", FILENAME),
    ]
    for p in candidates:
        norm = os.path.normpath(p)
        if os.path.exists(norm):
            return norm

    # Return the repo-root path as the default (will error clearly if missing)
    return os.path.normpath(candidates[2])

EXCEL_PATH = _find_excel()


def load_all(db: Session, excel_path: str = None) -> dict:
    """Load all sheets from Excel and seed database. Returns row counts."""
    path = excel_path or EXCEL_PATH
    print(f"Loading Excel: {path}")

    counts = {}
    counts.update(_load_market_signals(db, path))
    counts.update(_load_allocation(db, path))
    counts.update(_load_performance(db, path))

    db.commit()
    return counts


# ─────────────────────────────────────────────────────────────────────────────
# Signals sheet → market_data, factors, regime
# ─────────────────────────────────────────────────────────────────────────────

def _load_market_signals(db: Session, path: str) -> dict:
    df = pd.read_excel(path, sheet_name="Signals", header=1, engine="openpyxl")
    df.columns = ["date", "nifty", "nifty_200dma", "trend_signal",
                  "vix", "vix_20d_ma", "vol_signal",
                  "gsec_10y", "gsec_60d_ma", "liq_signal",
                  "regime_score", "regime"]
    df = df.dropna(subset=["date"]).copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date

    # Load raw price sheets for gold / usd_inr / mc150m50
    gold_df  = _load_price_sheet(path, "GBES Historical Data")
    vix_df   = _load_price_sheet(path, "India VIX Historical Data")
    gsec_df  = _load_price_sheet(path, "India 10-Year Bond Yield Histor")
    fx_df    = _load_price_sheet(path, "USD_INR Historical Data")

    # Merge extra columns
    df = df.merge(gold_df.rename(columns={"price": "gold_price"}), on="date", how="left")
    df = df.merge(fx_df.rename(columns={"price": "usd_inr"}), on="date", how="left")

    # Dual Momentum signal — not in Signals sheet, default 0 (will be filled from Allocation)
    df["dual_mom_signal"] = 0

    # Truncate existing rows
    db.execute(text("DELETE FROM market_data"))
    db.execute(text("DELETE FROM factors"))
    db.execute(text("DELETE FROM regime"))

    market_rows = 0
    factor_rows = 0
    regime_rows = 0
    prev_regime = None

    for _, row in df.iterrows():
        d = row["date"]

        # market_data
        md = MarketData(
            date       = d,
            nifty      = _safe(row["nifty"]),
            vix        = _safe(row["vix"]),
            gsec_10y   = _safe(row["gsec_10y"]),
            gold_price = _safe(row.get("gold_price")),
            usd_inr    = _safe(row.get("usd_inr")),
        )
        db.merge(md)
        market_rows += 1

        # factors
        f = Factors(
            date             = d,
            nifty_200dma     = _safe(row["nifty_200dma"]),
            trend_signal     = _int(row["trend_signal"]),
            vix_20d_ma       = _safe(row["vix_20d_ma"]),
            vol_signal       = _int(row["vol_signal"]),
            gsec_60d_ma      = _safe(row["gsec_60d_ma"]),
            liq_signal       = _int(row["liq_signal"]),
            dual_mom_signal  = 0,
            regime_score     = _int(row["regime_score"]),
        )
        db.merge(f)
        factor_rows += 1

        # regime
        regime_label = str(row["regime"]) if pd.notna(row["regime"]) else "Risk OFF"
        changed = (prev_regime is not None) and (regime_label != prev_regime)
        r = Regime(
            date           = d,
            regime         = regime_label,
            regime_score   = _int(row["regime_score"]),
            confidence     = score_to_confidence(_int(row["regime_score"])),
            prev_regime    = prev_regime,
            regime_changed = changed,
        )
        db.merge(r)
        regime_rows += 1
        prev_regime = regime_label

    return {
        "market_data": market_rows,
        "factors": factor_rows,
        "regime": regime_rows,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Allocation sheet
# ─────────────────────────────────────────────────────────────────────────────

def _load_allocation(db: Session, path: str) -> dict:
    df = pd.read_excel(path, sheet_name="Allocation", header=12, engine="openpyxl")
    df = df.iloc[:, :13]
    df.columns = [
        "date", "regime_score", "regime",
        "base_mom_weight", "vol_adj_mom_weight", "dual_mom_signal",
        "meta_mom_weight", "gold_boost",
        "final_mom_weight", "final_gold_weight",
        "momentum_drawdown", "dd_adj_mom_weight", "dd_adj_gold_weight",
    ]
    df = df.dropna(subset=["date"]).copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date

    db.execute(text("DELETE FROM allocation"))

    rows = 0
    for _, row in df.iterrows():
        a = Allocation(
            date                 = row["date"],
            base_mom_weight      = _safe(row["base_mom_weight"]),
            vol_adj_mom_weight   = _safe(row["vol_adj_mom_weight"]),
            dual_mom_signal      = _int(row.get("dual_mom_signal", 0)),
            meta_mom_weight      = _safe(row["meta_mom_weight"]),
            gold_boost           = _safe(row["gold_boost"]),
            final_mom_weight     = _safe(row["final_mom_weight"]),
            final_gold_weight    = _safe(row["final_gold_weight"]),
            momentum_drawdown    = _safe(row["momentum_drawdown"]),
            dd_adj_mom_weight    = _safe(row["dd_adj_mom_weight"]),
            dd_adj_gold_weight   = _safe(row["dd_adj_gold_weight"]),
        )
        db.merge(a)
        rows += 1

    # Sync dual_mom_signal from allocation back to factors
    alloc_signals = {
        a.date: a.dual_mom_signal
        for a in db.query(Allocation).all()
    }
    for f in db.query(Factors).all():
        if f.date in alloc_signals:
            f.dual_mom_signal = alloc_signals[f.date]

    return {"allocation": rows}


# ─────────────────────────────────────────────────────────────────────────────
# Backtest sheet
# ─────────────────────────────────────────────────────────────────────────────

def _load_performance(db: Session, path: str) -> dict:
    df = pd.read_excel(path, sheet_name="Backtest", header=19, engine="openpyxl")
    df = df.iloc[:, :12]
    df.columns = [
        "date", "regime",
        "mom_weight", "gold_weight",
        "momentum_return", "gold_return",
        "transaction_cost", "portfolio_return",
        "portfolio_nav", "portfolio_drawdown",
        "benchmark_nav", "gold_bh_nav",
    ]
    df = df.dropna(subset=["date"]).copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date

    db.execute(text("DELETE FROM performance"))

    rows = 0
    for _, row in df.iterrows():
        p = Performance(
            date              = row["date"],
            regime            = str(row.get("regime", "Risk OFF")),
            mom_weight        = _safe(row["mom_weight"]),
            gold_weight       = _safe(row["gold_weight"]),
            momentum_return   = _safe(row["momentum_return"]),
            gold_return       = _safe(row["gold_return"]),
            transaction_cost  = _safe(row["transaction_cost"]),
            portfolio_return  = _safe(row["portfolio_return"]),
            portfolio_nav     = _safe(row["portfolio_nav"]),
            portfolio_drawdown= _safe(row["portfolio_drawdown"]),
            benchmark_nav     = _safe(row["benchmark_nav"]),
            gold_bh_nav       = _safe(row["gold_bh_nav"]),
        )
        db.merge(p)
        rows += 1

    return {"performance": rows}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_price_sheet(path: str, sheet_name: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(path, sheet_name=sheet_name, header=0, engine="openpyxl")
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        df = df.rename(columns={"date": "date", "price": "price"})
        df = df[["date", "price"]].dropna(subset=["date"])
        df["date"] = pd.to_datetime(df["date"]).dt.date
        return df
    except Exception as e:
        print(f"Warning: could not load sheet '{sheet_name}': {e}")
        return pd.DataFrame(columns=["date", "price"])


def _safe(val) -> float | None:
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return float(val)
    except Exception:
        return None


def _int(val) -> int:
    v = _safe(val)
    return int(v) if v is not None else 0
