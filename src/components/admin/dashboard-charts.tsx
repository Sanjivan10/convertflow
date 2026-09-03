"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Daily = { date: string; pageviews: number; conversions: number };

export function TrafficChart({ data }: { data: Daily[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.slice(5)}
            fontSize={11}
            stroke="#94a3b8"
          />
          <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            name="Pageviews"
            stroke="#0ea5e9"
            fill="url(#pv)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="conversions"
            name="Conversions"
            stroke="#10b981"
            fill="url(#cv)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopToolsChart({
  data,
}: {
  data: { toolSlug: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        No conversions recorded yet.
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="toolSlug"
            width={120}
            fontSize={11}
            stroke="#94a3b8"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" name="Conversions" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
