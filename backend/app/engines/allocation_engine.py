"""
Allocation Engine — Regime-Driven Position Sizing with Vol-Targeting,
Meta-Momentum, Gold Boost, and Drawdown Control.

Source: NSE_RegimeModel_v2.xlsx — Allocation sheet

Parameters (⚙️ MODEL PARAMETERS):
  Target Volatility   : 15%  (annualised)
  Transaction Cost    : 0.2%
  Vol Window          : 20 days
  Confirmation Days   : 5
  DD Trigger 1        : 10%  (30% cut to Momentum weight)
  DD Trigger 2        : 15%  (50% cut to Momentum weight)
  Gold Boost          : +10% if dual-mom signal is weak

Regime → Base Allocation:
  Score 3 (Risk ON)   : Momentum 80%, Gold 20%
  Score 2 (Neutral)   : Momentum 50%, Gold 50%
  Score 1 (Risk OFF)  : Momentum 30%, Gold 70%
  Score 0 (Risk OFF)  : Momentum 10%, Gold 90%
"""

import numpy as np
import pandas as pd


# ── Model Parameters ─────────────────────────────────────────────────────────
TARGET_VOL      = 0.15
TRANSACTION_COST = 0.002
VOL_WINDOW      = 20
DD_TRIGGER_1    = 0.10    # 30% cut
DD_TRIGGER_2    = 0.15    # 50% cut
GOLD_BOOST      = 0.10
TRADING_DAYS    = 252

# Score → Base Momentum Weight
BASE_WEIGHTS = {3: 0.80, 2: 0.50, 1: 0.30, 0: 0.10}


def compute_allocation(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input  : DataFrame with columns including:
               regime_score, dual_mom_signal, nifty (for vol calc),
               mc150m50 (for momentum returns & drawdown)
             sorted ascending by date.
    Output : Input df with allocation columns appended.
    """
    df = df.copy().sort_values("date").reset_index(drop=True)

    # ── 1. Base Momentum Weight from Regime Score ─────────────────────────────
    df["base_mom_weight"] = df["regime_score"].map(BASE_WEIGHTS)

    # ── 2. Volatility Targeting ───────────────────────────────────────────────
    # Realised vol of momentum asset (MC150M50) over VOL_WINDOW days
    if "mc150m50" in df.columns and df["mc150m50"].notna().sum() > VOL_WINDOW:
        mom_returns = df["mc150m50"].pct_change()
    else:
        # Fallback: use NIFTY returns
        mom_returns = df["nifty"].pct_change()

    realised_vol = mom_returns.rolling(VOL_WINDOW, min_periods=VOL_WINDOW).std() * np.sqrt(TRADING_DAYS)
    realised_vol = realised_vol.fillna(TARGET_VOL)  # default before window fills

    vol_scalar = (TARGET_VOL / realised_vol.clip(lower=0.01)).clip(upper=1.5)
    df["vol_adj_mom_weight"] = (df["base_mom_weight"] * vol_scalar).clip(upper=1.0)

    # ── 3. Dual Momentum (Meta-Momentum) Adjustment ───────────────────────────
    # When dual_mom_signal=0, halve the momentum weight
    if "dual_mom_signal" not in df.columns:
        df["dual_mom_signal"] = 0

    df["meta_mom_weight"] = np.where(
        df["dual_mom_signal"] == 1,
        df["vol_adj_mom_weight"],
        df["vol_adj_mom_weight"] * 0.5
    )

    # ── 4. Gold Boost ─────────────────────────────────────────────────────────
    # Add GOLD_BOOST to gold when dual momentum is weak (defensive)
    df["gold_boost"] = np.where(df["dual_mom_signal"] == 0, GOLD_BOOST, 0.0)

    # Raw final weights (before DD control)
    df["final_mom_weight"] = (df["meta_mom_weight"] - df["gold_boost"]).clip(lower=0.0)
    df["final_gold_weight"] = 1.0 - df["final_mom_weight"]

    # ── 5. Drawdown Control ───────────────────────────────────────────────────
    # Calculate rolling drawdown of momentum asset
    if "mc150m50" in df.columns and df["mc150m50"].notna().sum() > 1:
        price_series = df["mc150m50"].fillna(method="ffill")
    else:
        price_series = df["nifty"].fillna(method="ffill")

    rolling_max = price_series.expanding().max()
    df["momentum_drawdown"] = (price_series - rolling_max) / rolling_max
    df["momentum_drawdown"] = df["momentum_drawdown"].fillna(0)

    # Apply DD triggers
    dd = df["momentum_drawdown"].abs()
    dd_adj_factor = np.where(dd > DD_TRIGGER_2, 0.50,
                    np.where(dd > DD_TRIGGER_1, 0.70, 1.0))

    df["dd_adj_mom_weight"] = (df["final_mom_weight"] * dd_adj_factor).clip(lower=0.0, upper=1.0)
    df["dd_adj_gold_weight"] = 1.0 - df["dd_adj_mom_weight"]

    return df


def get_allocation_description(equity_pct: float, gold_pct: float, regime: str) -> str:
    """Human-readable allocation description."""
    if regime == "Risk ON":
        return f"Strong market conditions — {equity_pct:.0f}% equity, {gold_pct:.0f}% gold for growth"
    elif regime == "Neutral":
        return f"Mixed signals — balanced {equity_pct:.0f}% equity / {gold_pct:.0f}% gold exposure"
    else:
        return f"Defensive posture — {gold_pct:.0f}% gold protection, {equity_pct:.0f}% equity"
