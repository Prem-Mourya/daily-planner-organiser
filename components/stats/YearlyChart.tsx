"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bucketYearly, type DayPoint } from "@/lib/stats";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(monthKey: string): string {
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  return MONTH_LABELS[monthIndex] ?? monthKey;
}

export function YearlyChart({ points }: { points: DayPoint[] }) {
  const months = bucketYearly(points).map((m) => ({ ...m, label: monthLabel(m.month) }));

  if (months.length === 0) {
    return <p className="text-sm text-black/40">No yearly data yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={months} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#737373", fontSize: 11 }}
            stroke="#d4d4d4"
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#737373", fontSize: 11 }}
            stroke="#d4d4d4"
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "#00000008" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              fontSize: 12,
              color: "#171717",
            }}
            labelStyle={{ color: "#171717", fontWeight: 600 }}
            formatter={(value) => [`${value}%`, "Avg progress"]}
          />
          <Bar dataKey="percent" fill="#404040" radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
