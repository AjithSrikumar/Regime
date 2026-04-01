from datetime import date
from typing import Optional, List
from pydantic import BaseModel


class RegimeResponse(BaseModel):
    date: date
    regime: str
    regime_score: int
    confidence: float
    prev_regime: Optional[str]
    regime_changed: bool
    nifty: Optional[float]
    vix: Optional[float]
    gsec_10y: Optional[float]


class AllocationResponse(BaseModel):
    date: date
    regime: str
    equity_pct: float       # dd_adj_mom_weight * 100
    gold_pct: float         # dd_adj_gold_weight * 100
    debt_pct: float         # 0 in this model
    description: str


class FactorResponse(BaseModel):
    date: date
    nifty: Optional[float]
    nifty_200dma: Optional[float]
    trend_signal: int
    vix: Optional[float]
    vix_20d_ma: Optional[float]
    vol_signal: int
    gsec_10y: Optional[float]
    gsec_60d_ma: Optional[float]
    liq_signal: int
    dual_mom_signal: int
    regime_score: int
    insights: List[dict]


class PerformanceMetrics(BaseModel):
    strategy_cagr: float
    benchmark_cagr: float
    gold_cagr: float
    annual_vol: float
    sharpe_ratio: float
    max_drawdown: float
    calmar_ratio: float
    win_rate: float
    best_day: float
    worst_day: float
    years_of_data: float
    final_nav: float


class RegimeDistribution(BaseModel):
    risk_on_days: int
    risk_on_pct: float
    neutral_days: int
    neutral_pct: float
    risk_off_days: int
    risk_off_pct: float


class PerformanceResponse(BaseModel):
    metrics: PerformanceMetrics
    regime_distribution: RegimeDistribution
    # time-series for charting — last N days
    chart_data: List[dict]


class DashboardResponse(BaseModel):
    regime: RegimeResponse
    allocation: AllocationResponse
    factors: FactorResponse
    performance_summary: PerformanceMetrics
