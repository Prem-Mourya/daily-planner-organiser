"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const SIZE_MAP = {
  sm: 18,
  md: 22,
} as const;

export function Checkbox({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  const dimension = SIZE_MAP[size];

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150",
        checked ? "bg-black" : "bg-transparent border border-black/20"
      )}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        viewBox="0 0 24 24"
        width={dimension * 0.65}
        height={dimension * 0.65}
        fill="none"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </svg>
    </motion.button>
  );
}
