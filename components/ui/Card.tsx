import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("glass rounded-2xl p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
