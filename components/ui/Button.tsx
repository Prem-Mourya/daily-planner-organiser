import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Button({
  variant = "solid",
  className,
  ...buttonProps
}: {
  variant?: "solid" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
        variant === "solid"
          ? "bg-black text-white hover:bg-neutral-800"
          : "bg-transparent text-black border border-black/15 hover:bg-black/5",
        className
      )}
      {...buttonProps}
    />
  );
}
