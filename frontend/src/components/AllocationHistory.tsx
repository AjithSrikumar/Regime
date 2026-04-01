"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";
import { AllocationHistoryPoint } from "@/lib/api";

interface Props {
  data: AllocationHistoryPoint[];
}

export default function AllocationHistory({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date.slice(0, 10),
    Equity: d.equity_pct,
    Gold:   d.gold_pct,
  }));

  return (
    <div className="rounded-2xl border p-6" style={{ background: "#0d1117", borderColor: "#21262d" }}>
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: "#f0f6fc" }}>Allocation History</h2>
        <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>Dynamic equity vs gold weighting over time</p>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8b949e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: "#8b949e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={40}
            />
            <Tooltip content={<AllocTooltip />} />
            <Area
              type="monotone"
              dataKey="Equity"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#equity)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="Gold"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gold)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AllocTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  return (
    <div className="rounded-xl border p-3 shadow-xl" style={{ background: "#161b22", borderColor: "#30363d" }}>
      <p className="text-xs mb-2" style={{ color: "#8b949e" }}>
        {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
          <span style={{ color: "#8b949e" }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: "#f0f6fc" }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
