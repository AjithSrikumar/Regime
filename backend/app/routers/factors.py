from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import FactorResponse
from ..models import Factors, MarketData
from ..engines.factor_engine import build_signal_insights

router = APIRouter(prefix="/factors", tags=["factors"])


@router.get("/latest", response_model=FactorResponse)
def get_latest_factors(db: Session = Depends(get_db)):
    f = db.query(Factors).order_by(Factors.date.desc()).first()
    if not f:
        raise HTTPException(status_code=404, detail="No factor data found")

    md = db.query(MarketData).filter(MarketData.date == f.date).first()

    row = {
        "trend_signal":    f.trend_signal,
        "vol_signal":      f.vol_signal,
        "liq_signal":      f.liq_signal,
        "dual_mom_signal": f.dual_mom_signal,
        "nifty":           md.nifty if md else None,
        "nifty_200dma":    f.nifty_200dma,
        "vix":             md.vix if md else None,
        "vix_20d_ma":      f.vix_20d_ma,
        "gsec_10y":        md.gsec_10y if md else None,
        "gsec_60d_ma":     f.gsec_60d_ma,
    }

    return FactorResponse(
        date             = f.date,
        nifty            = md.nifty if md else None,
        nifty_200dma     = f.nifty_200dma,
        trend_signal     = f.trend_signal,
        vix              = md.vix if md else None,
        vix_20d_ma       = f.vix_20d_ma,
        vol_signal       = f.vol_signal,
        gsec_10y         = md.gsec_10y if md else None,
        gsec_60d_ma      = f.gsec_60d_ma,
        liq_signal       = f.liq_signal,
        dual_mom_signal  = f.dual_mom_signal,
        regime_score     = f.regime_score,
        insights         = build_signal_insights(row),
    )
