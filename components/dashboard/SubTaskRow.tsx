"use client";

import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";

export function SubTaskRow({
  title,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-1.5 pl-9 transition-opacity duration-150"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <Checkbox checked={checked} onChange={onToggle} size="sm" />
      <span className="relative text-sm text-black/70">
        {title}
        <motion.span
          aria-hidden
          className="absolute left-0 top-1/2 h-px bg-black/40"
          initial={false}
          animate={{ width: checked ? "100%" : "0%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </span>
    </div>
  );
}
