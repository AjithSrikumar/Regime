"use client";

import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, ReferenceLine
} from "recharts";
import { ChartPoint } from "@/lib/api";

interface Props {
  data: ChartPoint[];
}

const PERIODS = [
  { label: "1Y",  days: 252 },
  { label: "3Y",  days: 756 },
  { label: "5Y",  days: 1260 },
  { label: "All", days: 99999 },
];

export default function PerformanceChart({ data }: Props) {
  const [period, setPeriod] = useState("5Y");

  const days = PERIODS.find((p) => p.label === period)?.days ?? 1260;
  const slice = data.slice(-days);

  // Re-base to 100 at start of visible slice
  const startPf  = slice[0]?.portfolio_nav ?? 100;
  const startBm  = slice[0]?.benchmark_nav ?? 100;
  const startGld = slice[0]?.gold_bh_nav   ?? 100;

  const chartData = slice.map((d) => ({
    date: d.date.slice(0, 10),
    Strategy:    +((d.portfolio_nav / startPf)  * 100).toFixed(2),
    "MC150M50":  +((d.benchmark_nav / startBm)  * 100).toFixed(2),
    "Gold B&H":  +((d.gold_bh_nav   / startGld) * 100).toFixed(2),
    regime:      d.regime,
  }));

  return (
    <div className="rounded-2xl border p-6" style={{ background: "#0d1117", borderColor: "#21262d" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#f0f6fc" }}>Strategy Performance</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>NAV indexed to 100 at period start</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === p.label
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              style={period !== p.label ? { background: "rgba(255,255,255,0.06)" } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8b949e", fontSize: 11 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return d.getFullYear().toString();
              }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis
              tick={{ fill: "#8b949e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#8b949e", paddingTop: 8 }}
              formatter={(value) => <span style={{ color: "#8b949e" }}>{value}</span>}
            />
            <Line dataKey="Strategy"  stroke="#3b82f6" strokeWidth={2} dot={false} strokeLinecap="round" />
            <Line dataKey="MC150M50"  stroke="#6b7280" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            <Line dataKey="Gold B&H"  stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const d = new Date(label);
  const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="rounded-xl border p-3 shadow-xl" style={{ background: "#161b22", borderColor: "#30363d" }}>
      <p className="text-xs mb-2 font-medium" style={{ color: "#8b949e" }}>{formatted}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#8b949e" }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: "#f0f6fc" }}>{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
