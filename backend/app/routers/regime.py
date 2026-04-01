from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date

from ..database import get_db
from ..schemas import RegimeResponse
from ..models import Regime, MarketData

router = APIRouter(prefix="/regime", tags=["regime"])


@router.get("/latest", response_model=RegimeResponse)
def get_latest_regime(db: Session = Depends(get_db)):
    row = db.query(Regime).order_by(Regime.date.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail="No regime data found")

    md = db.query(MarketData).filter(MarketData.date == row.date).first()

    return RegimeResponse(
        date          = row.date,
        regime        = row.regime,
        regime_score  = row.regime_score,
        confidence    = row.confidence,
        prev_regime   = row.prev_regime,
        regime_changed= row.regime_changed,
        nifty         = md.nifty if md else None,
        vix           = md.vix if md else None,
        gsec_10y      = md.gsec_10y if md else None,
    )


@router.get("/history")
def get_regime_history(days: int = 90, db: Session = Depends(get_db)):
    rows = (
        db.query(Regime, MarketData)
        .outerjoin(MarketData, Regime.date == MarketData.date)
        .order_by(Regime.date.desc())
        .limit(days)
        .all()
    )
    result = []
    for r, md in reversed(rows):
        result.append({
            "date":          str(r.date),
            "regime":        r.regime,
            "regime_score":  r.regime_score,
            "confidence":    r.confidence,
            "regime_changed":r.regime_changed,
            "nifty":         md.nifty if md else None,
            "vix":           md.vix if md else None,
        })
    return result


@router.get("/changes")
def get_regime_changes(limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(Regime)
        .filter(Regime.regime_changed == True)
        .order_by(Regime.date.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "date":       str(r.date),
            "new_regime": r.regime,
            "old_regime": r.prev_regime,
            "score":      r.regime_score,
        }
        for r in rows
    ]
