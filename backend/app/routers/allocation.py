from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import AllocationResponse
from ..models import Allocation, Regime
from ..engines.allocation_engine import get_allocation_description

router = APIRouter(prefix="/allocation", tags=["allocation"])


@router.get("/latest", response_model=AllocationResponse)
def get_latest_allocation(db: Session = Depends(get_db)):
    alloc = db.query(Allocation).order_by(Allocation.date.desc()).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="No allocation data found")

    regime = db.query(Regime).filter(Regime.date == alloc.date).first()
    regime_label = regime.regime if regime else "Risk OFF"

    equity = round((alloc.dd_adj_mom_weight or 0) * 100, 1)
    gold   = round((alloc.dd_adj_gold_weight or 0) * 100, 1)
    debt   = round(max(0.0, 100.0 - equity - gold), 1)

    return AllocationResponse(
        date        = alloc.date,
        regime      = regime_label,
        equity_pct  = equity,
        gold_pct    = gold,
        debt_pct    = debt,
        description = get_allocation_description(equity, gold, regime_label),
    )


@router.get("/history")
def get_allocation_history(days: int = 365, db: Session = Depends(get_db)):
    rows = (
        db.query(Allocation)
        .order_by(Allocation.date.desc())
        .limit(days)
        .all()
    )
    return [
        {
            "date":         str(r.date),
            "equity_pct":   round((r.dd_adj_mom_weight or 0) * 100, 1),
            "gold_pct":     round((r.dd_adj_gold_weight or 0) * 100, 1),
            "debt_pct":     0.0,
            "base_equity":  round((r.base_mom_weight or 0) * 100, 1),
            "drawdown":     round((r.momentum_drawdown or 0) * 100, 2),
        }
        for r in reversed(rows)
    ]
