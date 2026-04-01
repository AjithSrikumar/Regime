#!/usr/bin/env node
/**
 * Regime — Supabase seeder (Node.js version)
 *
 * Usage (Windows CMD / PowerShell):
 *   cd supabase_seed
 *   npm install pg
 *   node seed_supabase.js "postgresql://postgres.xxx:PASSWORD@host:6543/postgres"
 *
 * Or set env var first:
 *   set DATABASE_URL=postgresql://...
 *   node seed_supabase.js
 */

const fs   = require("fs");
const path = require("path");
const { Client } = require("pg");

// ── Connection string ─────────────────────────────────────────────────────────
const DATABASE_URL =
  process.argv[2] ||
  process.env.DATABASE_URL ||
  "";

if (!DATABASE_URL) {
  console.error("ERROR: pass the Supabase connection string as first argument.");
  console.error('  node seed_supabase.js "postgresql://postgres.xxx:PASSWORD@host:6543/postgres"');
  process.exit(1);
}

// ── Tables and their column order ─────────────────────────────────────────────
const TABLES = [
  {
    name: "market_data",
    cols: ["date","nifty","vix","gsec_10y","gold_price","usd_inr","mc150m50"],
  },
  {
    name: "factors",
    cols: ["date","nifty_200dma","trend_signal","vix_20d_ma","vol_signal",
           "gsec_60d_ma","liq_signal","dual_mom_signal","regime_score"],
  },
  {
    name: "regime",
    cols: ["date","regime","regime_score","confidence","prev_regime","regime_changed"],
  },
  {
    name: "allocation",
    cols: ["date","base_mom_weight","vol_adj_mom_weight","dual_mom_signal",
           "meta_mom_weight","gold_boost","final_mom_weight","final_gold_weight",
           "momentum_drawdown","dd_adj_mom_weight","dd_adj_gold_weight"],
  },
  {
    name: "performance",
    cols: ["date","regime","mom_weight","gold_weight","momentum_return",
           "gold_return","transaction_cost","portfolio_return",
           "portfolio_nav","portfolio_drawdown","benchmark_nav","gold_bh_nav"],
  },
];

const BATCH = 500;
const DIR   = __dirname;

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(filepath) {
  const text  = fs.readFileSync(filepath, "utf8");
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const obj  = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() ?? ""; });
    return obj;
  });
}

function coerce(v) {
  if (v === "" || v === "None" || v === "NULL") return null;
  if (v === "True")  return true;
  if (v === "False") return false;
  const n = Number(v);
  return isNaN(n) ? v : n;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to Supabase...");
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Connected ✓\n");

  for (const { name, cols } of TABLES) {
    const csvPath = path.join(DIR, `${name}.csv`);
    if (!fs.existsSync(csvPath)) {
      console.log(`  SKIP ${name} — ${csvPath} not found`);
      continue;
    }

    const rawRows = parseCSV(csvPath);
    const rows    = rawRows.map((r) => cols.map((c) => coerce(r[c])));

    // Truncate existing data
    await client.query(`TRUNCATE TABLE ${name} CASCADE`);

    // Build parameterised INSERT
    const colList  = cols.join(", ");
    const inserted = rows.length;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch  = rows.slice(i, i + BATCH);
      const values = [];
      const params = batch.map((row, ri) => {
        values.push(...row);
        const placeholders = row.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(", ");
        return `(${placeholders})`;
      });

      await client.query(
        `INSERT INTO ${name} (${colList}) VALUES ${params.join(", ")} ON CONFLICT (date) DO NOTHING`,
        values
      );

      process.stdout.write(`  ${name}: ${Math.min(i + BATCH, inserted)}/${inserted} rows\r`);
    }

    console.log(`  ${name}: ${inserted} rows ✓          `);
  }

  await client.end();
  console.log("\n✅  Seeding complete. Your Supabase DB is ready.");
}

main().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
