"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/template", label: "Weekly" },
  { href: "/stats", label: "Stats" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 py-6">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm transition-colors duration-150",
              isActive
                ? "font-semibold text-black underline underline-offset-4"
                : "text-black/50 hover:text-black"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
