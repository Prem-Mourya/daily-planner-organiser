"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/stats";

export function DailyChart({ points }: { points: DayPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-black/40">No daily data yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
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
            formatter={(value) => [`${value}%`, "Progress"]}
          />
          <Bar dataKey="percent" fill="#171717" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
