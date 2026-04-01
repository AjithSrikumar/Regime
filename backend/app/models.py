from sqlalchemy import Column, Date, Float, String, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base


class MarketData(Base):
    __tablename__ = "market_data"

    date = Column(Date, primary_key=True)
    nifty = Column(Float)
    vix = Column(Float)
    gsec_10y = Column(Float)
    gold_price = Column(Float)      # GBES ETF price
    usd_inr = Column(Float)
    mc150m50 = Column(Float)        # Midcap150 Momentum50 price (derived from returns)
    created_at = Column(DateTime, server_default=func.now())


class Factors(Base):
    __tablename__ = "factors"

    date = Column(Date, primary_key=True)
    nifty_200dma = Column(Float)
    trend_signal = Column(Integer)          # 1=Bullish, 0=Bearish
    vix_20d_ma = Column(Float)
    vol_signal = Column(Integer)            # 1=Low Vol, 0=High Vol
    gsec_60d_ma = Column(Float)
    liq_signal = Column(Integer)            # 1=Falling yields, 0=Rising
    dual_mom_signal = Column(Integer)       # 1=Strong, 0=Weak
    regime_score = Column(Integer)          # 0–3
    created_at = Column(DateTime, server_default=func.now())


class Regime(Base):
    __tablename__ = "regime"

    date = Column(Date, primary_key=True)
    regime = Column(String)                 # "Risk ON", "Neutral", "Risk OFF"
    regime_score = Column(Integer)          # 0–3
    confidence = Column(Float)              # 0–100 mapped from score
    prev_regime = Column(String)
    regime_changed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Allocation(Base):
    __tablename__ = "allocation"

    date = Column(Date, primary_key=True)
    base_mom_weight = Column(Float)
    vol_adj_mom_weight = Column(Float)
    dual_mom_signal = Column(Integer, default=0)
    meta_mom_weight = Column(Float)
    gold_boost = Column(Float)
    final_mom_weight = Column(Float)
    final_gold_weight = Column(Float)
    momentum_drawdown = Column(Float)
    dd_adj_mom_weight = Column(Float)       # Final equity allocation
    dd_adj_gold_weight = Column(Float)      # Final gold allocation
    created_at = Column(DateTime, server_default=func.now())


class Performance(Base):
    __tablename__ = "performance"

    date = Column(Date, primary_key=True)
    regime = Column(String)
    mom_weight = Column(Float)
    gold_weight = Column(Float)
    momentum_return = Column(Float)
    gold_return = Column(Float)
    transaction_cost = Column(Float)
    portfolio_return = Column(Float)
    portfolio_nav = Column(Float)
    portfolio_drawdown = Column(Float)
    benchmark_nav = Column(Float)           # MC150M50 B&H
    gold_bh_nav = Column(Float)             # Gold B&H
    created_at = Column(DateTime, server_default=func.now())
