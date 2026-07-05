"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bucketWeekly, type DayPoint } from "@/lib/stats";

export function WeeklyChart({ points }: { points: DayPoint[] }) {
  const weeks = bucketWeekly(points);

  if (weeks.length === 0) {
    return <p className="text-sm text-black/40">No weekly data yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={weeks} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
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
            cursor={{ stroke: "#d4d4d4" }}
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
          <Line
            type="monotone"
            dataKey="percent"
            stroke="#171717"
            strokeWidth={2}
            dot={{ fill: "#171717", r: 3 }}
            activeDot={{ fill: "#000000", r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
