import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, SessionLocal
from .models import Base
from .routers import regime, allocation, factors, performance


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Seed DB from Excel on first run
    db = SessionLocal()
    try:
        from .models import Regime
        count = db.query(Regime).count()
        if count == 0:
            print("Database empty — seeding from Excel...")
            from .data_ingestion.excel_loader import load_all
            counts = load_all(db)
            print(f"Seeded: {counts}")
        else:
            print(f"Database already has {count} regime rows — skipping seed.")
    except Exception as e:
        print(f"Seed error (non-fatal): {e}")
    finally:
        db.close()

    yield


app = FastAPI(
    title="Regime API",
    description="NSE MomGold v2 — Regime-Aware Allocation Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://regime.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(regime.router)
app.include_router(allocation.router)
app.include_router(factors.router)
app.include_router(performance.router)


@app.get("/")
def root():
    return {
        "name": "Regime API",
        "version": "1.0.0",
        "description": "NSE MomGold v2 — Daily market regime detection and allocation engine",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    db = SessionLocal()
    try:
        from .models import Regime
        count = db.query(Regime).count()
        return {"status": "ok", "regime_rows": count}
    finally:
        db.close()


@app.get("/dashboard")
def dashboard():
    """All data for the home screen in one request."""
    from .routers.regime import get_latest_regime
    from .routers.allocation import get_latest_allocation
    from .routers.factors import get_latest_factors
    from .routers.performance import get_performance, _compute_metrics, _compute_dist
    db = SessionLocal()
    try:
        regime_data = get_latest_regime(db)
        alloc_data  = get_latest_allocation(db)
        factor_data = get_latest_factors(db)

        from .models import Performance
        all_rows = db.query(Performance).order_by(Performance.date).all()
        metrics  = _compute_metrics(all_rows)

        return {
            "regime":             regime_data,
            "allocation":         alloc_data,
            "factors":            factor_data,
            "performance_summary": metrics,
        }
    finally:
        db.close()
