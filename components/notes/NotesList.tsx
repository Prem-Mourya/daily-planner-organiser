"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createNote } from "@/app/actions/notes";

export type NoteSummary = {
  id: number;
  title: string;
  updatedAt: string;
  progress: { done: number; total: number; percent: number };
  search: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotesList({ notes }: { notes: NoteSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const filtered = q ? notes.filter((n) => n.search.includes(q)) : notes;

  function handleNew() {
    startTransition(async () => {
      const id = await createNote();
      router.push(`/notes/${id}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-black">Notes</h1>
        <Button variant="solid" onClick={handleNew} disabled={isPending}>
          + New note
        </Button>
      </div>

      <input
        type="text"
        value={query}
        placeholder="Search notes…"
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm text-black outline-none backdrop-blur placeholder:text-black/30 focus:border-black/30"
      />

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-black/40">
            {notes.length === 0
              ? "No notes yet. Create one to start tracking topics, patterns, and anything else."
              : "No notes match your search."}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((note) => (
            <li key={note.id}>
              <Link href={`/notes/${note.id}`} className="block">
                <Card className="transition-colors duration-150 hover:border-black/20">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-black">
                      {note.title}
                    </span>
                    <span className="shrink-0 text-xs text-black/40">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  {note.progress.total > 0 ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full bg-black/70"
                          style={{ width: `${note.progress.percent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-black/40">
                        {note.progress.done}/{note.progress.total}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-black/30">No checklist items yet</p>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
