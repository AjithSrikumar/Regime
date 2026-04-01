"""
Factor Engine — Translates raw market data into regime signals.

Signals (from NSE_RegimeModel_v2.xlsx Signals sheet):
  1. Trend Signal   : NIFTY_50 > 200d SMA  → 1 (Bullish) else 0
  2. Vol Signal     : India VIX < VIX 20d MA → 1 (Low Vol) else 0
  3. Liq Signal     : G-Sec 10Y < G-Sec 60d MA → 1 (Falling yields) else 0

Regime Score  = Trend + Vol + Liq  (0–3)
Regime Label  :
  3 → "Risk ON"
  2 → "Neutral"
  1 → "Risk OFF"
  0 → "Risk OFF"
"""

import pandas as pd
import numpy as np
from typing import Optional


# ── Parameters (match Excel ⚙️ MODEL PARAMETERS) ────────────────────────────
TREND_WINDOW     = 200   # NIFTY 200d SMA
VIX_WINDOW       = 20    # VIX 20d MA
GSEC_WINDOW      = 60    # G-Sec 60d MA
CONFIRMATION_DAYS = 5    # signal must persist N days to flip (not used in score, but in regime)


def compute_signals(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input  : DataFrame with columns [date, nifty, vix, gsec_10y]
             sorted ascending by date.
    Output : Input df with added signal columns.
    """
    df = df.copy().sort_values("date").reset_index(drop=True)

    # ── 1. Trend Signal ──────────────────────────────────────────────────────
    df["nifty_200dma"] = df["nifty"].rolling(TREND_WINDOW, min_periods=1).mean()
    df["trend_signal"] = (df["nifty"] > df["nifty_200dma"]).astype(int)

    # ── 2. Volatility Signal ─────────────────────────────────────────────────
    df["vix_20d_ma"] = df["vix"].rolling(VIX_WINDOW, min_periods=1).mean()
    df["vol_signal"] = (df["vix"] < df["vix_20d_ma"]).astype(int)

    # ── 3. Liquidity Signal ──────────────────────────────────────────────────
    df["gsec_60d_ma"] = df["gsec_10y"].rolling(GSEC_WINDOW, min_periods=1).mean()
    df["liq_signal"] = (df["gsec_10y"] < df["gsec_60d_ma"]).astype(int)

    # ── Regime Score & Label ─────────────────────────────────────────────────
    df["regime_score"] = df["trend_signal"] + df["vol_signal"] + df["liq_signal"]
    df["regime"] = df["regime_score"].apply(_score_to_regime)

    return df


def _score_to_regime(score: int) -> str:
    if score == 3:
        return "Risk ON"
    elif score == 2:
        return "Neutral"
    else:
        return "Risk OFF"


def score_to_confidence(score: int) -> float:
    """Map 0–3 regime score to a 0–100 confidence percentage."""
    mapping = {3: 95.0, 2: 65.0, 1: 35.0, 0: 5.0}
    return mapping.get(score, 50.0)


def build_signal_insights(row: dict) -> list[dict]:
    """
    Given a dict with signal values, return human-readable insight cards.
    Each card: {signal, status, label, description}
    """
    insights = []

    trend = row.get("trend_signal", 0)
    vol   = row.get("vol_signal", 0)
    liq   = row.get("liq_signal", 0)
    dual  = row.get("dual_mom_signal", 0)

    nifty      = row.get("nifty", 0)
    dma200     = row.get("nifty_200dma", 0)
    vix        = row.get("vix", 0)
    vix_ma     = row.get("vix_20d_ma", 0)
    gsec       = row.get("gsec_10y", 0)
    gsec_ma    = row.get("gsec_60d_ma", 0)

    # Trend
    if trend == 1:
        desc = f"NIFTY {nifty:,.0f} above 200DMA {dma200:,.0f} — uptrend intact"
        insights.append({"signal": "trend", "status": "bullish", "label": "Trend: Bullish", "description": desc})
    else:
        desc = f"NIFTY {nifty:,.0f} below 200DMA {dma200:,.0f} — downtrend risk"
        insights.append({"signal": "trend", "status": "bearish", "label": "Trend: Bearish", "description": desc})

    # Volatility
    if vol == 1:
        desc = f"VIX {vix:.1f} below 20d avg {vix_ma:.1f} — volatility subsiding"
        insights.append({"signal": "volatility", "status": "bullish", "label": "Volatility: Low", "description": desc})
    else:
        desc = f"VIX {vix:.1f} above 20d avg {vix_ma:.1f} — elevated market stress"
        insights.append({"signal": "volatility", "status": "bearish", "label": "Volatility: High", "description": desc})

    # Liquidity
    if liq == 1:
        desc = f"G-Sec {gsec:.2f}% falling below 60d avg {gsec_ma:.2f}% — liquidity easing"
        insights.append({"signal": "liquidity", "status": "bullish", "label": "Liquidity: Easing", "description": desc})
    else:
        desc = f"G-Sec {gsec:.2f}% above 60d avg {gsec_ma:.2f}% — yields rising"
        insights.append({"signal": "liquidity", "status": "bearish", "label": "Liquidity: Tightening", "description": desc})

    # Dual Momentum
    if dual == 1:
        insights.append({"signal": "momentum", "status": "bullish", "label": "Momentum: Strong", "description": "Absolute & relative momentum both positive"})
    else:
        insights.append({"signal": "momentum", "status": "warning", "label": "Momentum: Weak", "description": "Dual momentum signal reduced — defensive tilt"})

    return insights
