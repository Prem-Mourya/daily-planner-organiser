"use client";

import { motion } from "framer-motion";

export function ProgressRing({
  percent,
  size = 64,
}: {
  percent: number;
  size?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const strokeWidth = Math.max(2, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#000000"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (clamped / 100) * circumference,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-medium text-black"
        style={{ fontSize: size * 0.22 }}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
