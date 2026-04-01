from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas import PerformanceResponse, PerformanceMetrics, RegimeDistribution
from ..models import Performance, Regime

router = APIRouter(prefix="/performance", tags=["performance"])


@router.get("", response_model=PerformanceResponse)
def get_performance(
    chart_days: int = Query(default=500, ge=30, le=5200),
    db: Session = Depends(get_db)
):
    # All rows for metrics
    all_rows = db.query(Performance).order_by(Performance.date).all()
    if not all_rows:
        return PerformanceResponse(
            metrics=_empty_metrics(),
            regime_distribution=_empty_dist(),
            chart_data=[]
        )

    metrics = _compute_metrics(all_rows)
    dist    = _compute_dist(db)

    # Chart data — last N rows
    chart_rows = all_rows[-chart_days:]
    chart_data = [
        {
            "date":            str(r.date),
            "portfolio_nav":   round(r.portfolio_nav or 100, 2),
            "benchmark_nav":   round(r.benchmark_nav or 100, 2),
            "gold_bh_nav":     round(r.gold_bh_nav or 100, 2),
            "portfolio_dd":    round((r.portfolio_drawdown or 0) * 100, 2),
            "regime":          r.regime,
        }
        for r in chart_rows
    ]

    return PerformanceResponse(
        metrics=metrics,
        regime_distribution=dist,
        chart_data=chart_data,
    )


def _compute_metrics(rows) -> PerformanceMetrics:
    import numpy as np

    rets = [r.portfolio_return or 0 for r in rows if r.portfolio_return is not None]
    navs = [r.portfolio_nav for r in rows if r.portfolio_nav is not None]
    dds  = [r.portfolio_drawdown or 0 for r in rows if r.portfolio_drawdown is not None]
    bm_navs = [r.benchmark_nav for r in rows if r.benchmark_nav is not None]
    gold_navs = [r.gold_bh_nav for r in rows if r.gold_bh_nav is not None]

    if not navs or not rets:
        return _empty_metrics()

    TRADING_DAYS = 252
    years   = len(rets) / TRADING_DAYS
    start   = 100.0
    final_nav = navs[-1]
    cagr    = (final_nav / start) ** (1 / years) - 1
    ann_vol = float(np.std(rets)) * (TRADING_DAYS ** 0.5)
    sharpe  = cagr / ann_vol if ann_vol > 0 else 0
    max_dd  = min(dds)
    calmar  = cagr / abs(max_dd) if max_dd < 0 else 0
    win_rate = sum(1 for r in rets if r > 0) / len(rets)

    bm_cagr   = (bm_navs[-1] / start) ** (1 / years) - 1 if bm_navs else 0
    gold_cagr = (gold_navs[-1] / start) ** (1 / years) - 1 if gold_navs else 0

    return PerformanceMetrics(
        strategy_cagr  = round(cagr * 100, 2),
        benchmark_cagr = round(bm_cagr * 100, 2),
        gold_cagr      = round(gold_cagr * 100, 2),
        annual_vol     = round(ann_vol * 100, 2),
        sharpe_ratio   = round(sharpe, 2),
        max_drawdown   = round(max_dd * 100, 2),
        calmar_ratio   = round(calmar, 2),
        win_rate       = round(win_rate * 100, 2),
        best_day       = round(max(rets) * 100, 2),
        worst_day      = round(min(rets) * 100, 2),
        years_of_data  = round(years, 1),
        final_nav      = round(final_nav, 2),
    )


def _compute_dist(db: Session) -> RegimeDistribution:
    rows = db.query(Regime).all()
    total = len(rows) or 1
    on  = sum(1 for r in rows if r.regime == "Risk ON")
    neu = sum(1 for r in rows if r.regime == "Neutral")
    off = sum(1 for r in rows if r.regime == "Risk OFF")
    return RegimeDistribution(
        risk_on_days  = on,  risk_on_pct  = round(on / total * 100, 1),
        neutral_days  = neu, neutral_pct  = round(neu / total * 100, 1),
        risk_off_days = off, risk_off_pct = round(off / total * 100, 1),
    )


def _empty_metrics() -> PerformanceMetrics:
    return PerformanceMetrics(
        strategy_cagr=0, benchmark_cagr=0, gold_cagr=0,
        annual_vol=0, sharpe_ratio=0, max_drawdown=0,
        calmar_ratio=0, win_rate=0, best_day=0, worst_day=0,
        years_of_data=0, final_nav=100,
    )


def _empty_dist() -> RegimeDistribution:
    return RegimeDistribution(
        risk_on_days=0, risk_on_pct=0,
        neutral_days=0, neutral_pct=0,
        risk_off_days=0, risk_off_pct=0,
    )
