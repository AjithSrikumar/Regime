#!/usr/bin/env python3
"""
Regime — one-time Supabase seeder.

Run from anywhere that has Python + psycopg2-binary + the CSV files:
  pip install psycopg2-binary
  python3 seed_supabase.py

Set DATABASE_URL before running:
  export DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
  python3 seed_supabase.py

Or pass it as an argument:
  python3 seed_supabase.py "postgresql://postgres.xxxx:PASSWORD@..."
"""

import sys, os, csv, psycopg2
from pathlib import Path

# ── Connection ────────────────────────────────────────────────────────────────
DATABASE_URL = (
    sys.argv[1] if len(sys.argv) > 1
    else os.environ.get("DATABASE_URL", "")
)
if not DATABASE_URL:
    print("ERROR: Set DATABASE_URL env var or pass as argument.")
    sys.exit(1)

# psycopg2 needs postgresql://, not postgres://
url = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to Supabase...")
conn = psycopg2.connect(url, sslmode="require")
conn.autocommit = False
cur  = conn.cursor()

# ── CSV directory (same folder as this script) ────────────────────────────────
CSV_DIR = Path(__file__).parent

TABLES = [
    ("market_data",  ["date","nifty","vix","gsec_10y","gold_price","usd_inr","mc150m50"]),
    ("factors",      ["date","nifty_200dma","trend_signal","vix_20d_ma","vol_signal",
                      "gsec_60d_ma","liq_signal","dual_mom_signal","regime_score"]),
    ("regime",       ["date","regime","regime_score","confidence","prev_regime","regime_changed"]),
    ("allocation",   ["date","base_mom_weight","vol_adj_mom_weight","dual_mom_signal",
                      "meta_mom_weight","gold_boost","final_mom_weight","final_gold_weight",
                      "momentum_drawdown","dd_adj_mom_weight","dd_adj_gold_weight"]),
    ("performance",  ["date","regime","mom_weight","gold_weight","momentum_return",
                      "gold_return","transaction_cost","portfolio_return",
                      "portfolio_nav","portfolio_drawdown","benchmark_nav","gold_bh_nav"]),
]

BATCH = 500

def coerce(v: str):
    if v == "" or v.upper() == "NONE":
        return None
    if v.upper() in ("TRUE", "FALSE"):
        return v.upper() == "TRUE"
    try: return int(v)
    except ValueError: pass
    try: return float(v)
    except ValueError: pass
    return v

try:
    for table, cols in TABLES:
        csv_path = CSV_DIR / f"{table}.csv"
        if not csv_path.exists():
            print(f"  SKIP {table} — {csv_path} not found")
            continue

        with open(csv_path, newline="") as f:
            reader  = csv.DictReader(f)
            rows    = [[coerce(row[c]) for c in cols] for row in reader]

        # Truncate first
        cur.execute(f"TRUNCATE TABLE {table} CASCADE")

        placeholders = ", ".join(["%s"] * len(cols))
        col_names    = ", ".join(cols)
        sql          = (
            f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) "
            "ON CONFLICT (date) DO NOTHING"
        )

        for i in range(0, len(rows), BATCH):
            cur.executemany(sql, rows[i:i+BATCH])
            print(f"  {table}: {min(i+BATCH, len(rows))}/{len(rows)} rows", end="\r")

        conn.commit()
        print(f"  {table}: {len(rows)} rows ✓          ")

    print("\n✅ Seeding complete.")
except Exception as e:
    conn.rollback()
    print(f"\n❌ Error: {e}")
    sys.exit(1)
finally:
    cur.close()
    conn.close()
