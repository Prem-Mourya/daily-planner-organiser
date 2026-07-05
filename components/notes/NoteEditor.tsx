"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { noteProgress, toStored, type OutlineItem } from "@/lib/notes";
import { saveNoteItems, renameNote, deleteNote } from "@/app/actions/notes";

const INDENT = 22; // px per depth level

type FocusTarget = { id: string; pos: "start" | "end" } | null;

// Clamp so no line is ever more than one level deeper than the line above it.
function normalize(list: OutlineItem[]): OutlineItem[] {
  const out: OutlineItem[] = [];
  let prevDepth = -1;
  for (let i = 0; i < list.length; i++) {
    const max = i === 0 ? 0 : prevDepth + 1;
    const depth = Math.min(list[i].depth, max);
    out.push({ ...list[i], depth });
    prevDepth = depth;
  }
  return out;
}

// End index (exclusive) of the subtree rooted at `i` — the run of following
// lines deeper than it.
function subtreeEnd(list: OutlineItem[], i: number): number {
  let end = i + 1;
  while (end < list.length && list[end].depth > list[i].depth) end++;
  return end;
}

export function NoteEditor({
  noteId,
  initialTitle,
  initialOutline,
}: {
  noteId: number;
  initialTitle: string;
  initialOutline: OutlineItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<OutlineItem[]>(
    initialOutline.length
      ? initialOutline
      : [{ id: `seed-${noteId}`, content: "", isCheckbox: true, isChecked: false, depth: 0 }]
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [, startTransition] = useTransition();

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const inputRefs = useRef(new Map<string, HTMLInputElement | null>());
  const pendingFocus = useRef<FocusTarget>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    startTransition(() => {
      saveNoteItems(noteId, toStored(itemsRef.current));
    });
  }, [noteId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 500);
  }, [saveNow]);

  // Apply focus requested by the last structural change, after the DOM updates.
  useEffect(() => {
    const pf = pendingFocus.current;
    if (!pf) return;
    pendingFocus.current = null;
    const el = inputRefs.current.get(pf.id);
    if (el) {
      el.focus();
      const p = pf.pos === "end" ? el.value.length : 0;
      el.setSelectionRange(p, p);
    }
  });

  // Flush any pending save when leaving the editor.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const commit = useCallback(
    (next: OutlineItem[], focus?: FocusTarget) => {
      if (focus) pendingFocus.current = focus;
      itemsRef.current = next;
      setItems(next);
      scheduleSave();
    },
    [scheduleSave]
  );

  function setContent(i: number, content: string) {
    commit(items.map((it, idx) => (idx === i ? { ...it, content } : it)));
  }

  function toggleCheck(i: number) {
    commit(
      items.map((it, idx) =>
        idx === i && it.isCheckbox ? { ...it, isChecked: !it.isChecked } : it
      )
    );
  }

  function toggleType(i: number) {
    commit(
      items.map((it, idx) =>
        idx === i ? { ...it, isCheckbox: !it.isCheckbox, isChecked: false } : it
      )
    );
  }

  function addAfter(i: number) {
    const pos = subtreeEnd(items, i); // new sibling goes after the current subtree
    const item: OutlineItem = {
      id: crypto.randomUUID(),
      content: "",
      isCheckbox: items[i].isCheckbox,
      isChecked: false,
      depth: items[i].depth,
    };
    commit([...items.slice(0, pos), item, ...items.slice(pos)], { id: item.id, pos: "end" });
  }

  function indent(i: number) {
    if (i === 0 || items[i].depth > items[i - 1].depth) return; // can't skip a level
    const end = subtreeEnd(items, i);
    commit(
      items.map((it, idx) => (idx >= i && idx < end ? { ...it, depth: it.depth + 1 } : it)),
      { id: items[i].id, pos: "end" }
    );
  }

  function outdent(i: number) {
    if (items[i].depth === 0) return;
    const end = subtreeEnd(items, i);
    commit(
      items.map((it, idx) => (idx >= i && idx < end ? { ...it, depth: it.depth - 1 } : it)),
      { id: items[i].id, pos: "end" }
    );
  }

  function removeLine(i: number) {
    if (items.length === 1) {
      commit([{ ...items[0], content: "" }], { id: items[0].id, pos: "start" });
      return;
    }
    const focusId = items[i - 1]?.id ?? items[i + 1]?.id;
    const next = normalize(items.filter((_, idx) => idx !== i));
    commit(next, focusId ? { id: focusId, pos: "end" } : null);
  }

  function deleteSubtree(i: number) {
    const end = subtreeEnd(items, i);
    let next = normalize([...items.slice(0, i), ...items.slice(end)]);
    if (next.length === 0) {
      next = [{ id: crypto.randomUUID(), content: "", isCheckbox: true, isChecked: false, depth: 0 }];
    }
    commit(next, { id: (items[i - 1] ?? next[0]).id, pos: "end" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      addAfter(i);
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) outdent(i);
      else indent(i);
    } else if (e.key === "Backspace" && items[i].content === "") {
      e.preventDefault();
      removeLine(i);
    }
  }

  function onTitleChange(value: string) {
    setTitle(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      startTransition(() => renameNote(noteId, value));
    }, 500);
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startTransition(async () => {
      await deleteNote(noteId);
      router.push("/notes");
    });
  }

  const progress = noteProgress(items);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/notes" className="text-sm text-black/50 transition-colors hover:text-black">
          ← Notes
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          onBlur={() => setConfirmingDelete(false)}
          className="rounded-full border border-black/15 px-2.5 py-1 text-xs font-medium text-black/60 transition-colors duration-150 hover:bg-black/5"
        >
          {confirmingDelete ? "Confirm delete?" : "Delete note"}
        </button>
      </div>

      <input
        type="text"
        value={title}
        placeholder="Untitled"
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={() => renameNote(noteId, title)}
        className="w-full bg-transparent text-2xl font-semibold text-black outline-none placeholder:text-black/25"
      />

      {progress.total > 0 ? (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-black/70 transition-[width] duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-black/40">
            {progress.done}/{progress.total} · {progress.percent}%
          </span>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 py-1"
              style={{ paddingLeft: item.depth * INDENT }}
            >
              {item.isCheckbox ? (
                <Checkbox checked={item.isChecked} onChange={() => toggleCheck(i)} size="sm" />
              ) : (
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-black/30">
                  •
                </span>
              )}

              <input
                ref={(el) => {
                  inputRefs.current.set(item.id, el);
                }}
                type="text"
                value={item.content}
                placeholder={item.isCheckbox ? "To-do…" : "Section…"}
                onChange={(e) => setContent(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={
                  "min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-black/25 " +
                  (item.isCheckbox
                    ? item.isChecked
                      ? "text-black/40 line-through"
                      : "text-black/80"
                    : "font-semibold text-black")
                }
              />

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={item.isCheckbox ? "Make heading" : "Make checkbox"}
                  title={item.isCheckbox ? "Make heading" : "Make checkbox"}
                  onClick={() => toggleType(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
                >
                  {item.isCheckbox ? "H" : "☐"}
                </button>
                <button
                  type="button"
                  aria-label="Delete line"
                  title="Delete line"
                  onClick={() => deleteSubtree(i)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/5 hover:text-black/70"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 border-t border-black/5 pt-3 text-xs text-black/30">
          Enter: new line · Tab / Shift-Tab: indent · Backspace on empty: delete · H: toggle heading
        </p>
      </Card>
    </div>
  );
}
