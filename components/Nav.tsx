"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { logout } from "@/app/actions/auth";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/template", label: "Weekly" },
  { href: "/stats", label: "Stats" },
  { href: "/notes", label: "Notes" },
] as const;

export function Nav({ authEnabled = false }: { authEnabled?: boolean }) {
  const pathname = usePathname();

  // The login screen is pre-auth — no nav.
  if (pathname === "/login") return null;

  return (
    <nav className="flex items-center gap-6 py-6">
      {LINKS.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
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
      {authEnabled ? (
        <form action={logout} className="ml-auto">
          <button
            type="submit"
            className="text-sm text-black/40 transition-colors duration-150 hover:text-black"
          >
            Log out
          </button>
        </form>
      ) : null}
    </nav>
  );
}
