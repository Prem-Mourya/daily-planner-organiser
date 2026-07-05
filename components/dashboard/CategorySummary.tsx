"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import type { CategoryBucket } from "@/lib/progress";

export type CategoryLookup = { id: number; name: string }[];

function resolveName(categoryId: number | null, categories: CategoryLookup): string {
  if (categoryId === null) return "Uncategorized";
  return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
}

export function CategorySummary({
  breakdown,
  categories,
}: {
  breakdown: CategoryBucket[];
  categories: CategoryLookup;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 text-left"
      >
        <h2 className="text-sm font-semibold text-black">Today by category</h2>
        {breakdown.length > 0 ? (
          <span className="text-xs text-black/40">{breakdown.length}</span>
        ) : null}
        <motion.span
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.2 }}
          className="ml-auto flex h-5 w-5 items-center justify-center text-black/40"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="category-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {breakdown.length === 0 ? (
              <p className="mt-3 text-sm text-black/40">Nothing to track yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {breakdown.map((bucket) => {
                  const name = resolveName(bucket.categoryId, categories);
                  return (
                    <li key={bucket.categoryId ?? "uncategorized"}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-black/80">{name}</span>
                        <span className="text-black/40">
                          {bucket.completed}/{bucket.total}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full bg-black/70 transition-[width] duration-500 ease-out"
                          style={{ width: `${bucket.percent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
