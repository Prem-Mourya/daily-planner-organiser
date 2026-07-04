"use client";

import { useEffect, useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Card } from "@/components/ui/Card";
import {
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategories,
} from "@/app/actions/categories";

export type CategoryViewModel = {
  id: number;
  name: string;
};

function CategoryRow({
  category,
  disabled,
}: {
  category: CategoryViewModel;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(category.name);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!isEditing) setNameDraft(category.name);
  }, [category.name, isEditing]);

  function commitName() {
    setIsEditing(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === category.name) {
      setNameDraft(category.name);
      return;
    }
    startTransition(() => {
      renameCategory(category.id, trimmed);
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteCategory(category.id);
    });
  }

  const isDisabled = disabled || isPending;

  return (
    <Reorder.Item
      as="li"
      value={category}
      dragListener={false}
      dragControls={dragControls}
      className="border-b border-black/5 last:border-b-0 bg-white"
    >
      <div
        className="flex items-center gap-3 py-2.5 transition-opacity duration-150"
        style={{ opacity: isDisabled ? 0.6 : 1 }}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => dragControls.start(e)}
          className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-black/30 active:cursor-grabbing"
        >
          ⠿
        </button>

        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-black outline-none transition-colors duration-150 hover:border-black/10 focus:border-black/30"
        />

        <button
          type="button"
          aria-label="Delete category"
          onClick={handleDelete}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors duration-150 hover:bg-black/5 hover:text-black/70"
        >
          ✕
        </button>
      </div>
    </Reorder.Item>
  );
}

function AddCategoryInline() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addCategory(trimmed);
    });
    setName("");
  }

  return (
    <div className="flex items-center gap-2 pt-3">
      <div className="h-6 w-4 shrink-0" />
      <input
        type="text"
        value={name}
        placeholder="Add a category…"
        disabled={isPending}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="flex-1 rounded-lg border border-black/10 bg-transparent px-2.5 py-1.5 text-sm text-black outline-none placeholder:text-black/30 focus:border-black/30 disabled:opacity-40"
      />
      <button
        type="button"
        disabled={isPending || !name.trim()}
        onClick={submit}
        className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-150 hover:bg-black/5 disabled:opacity-40"
      >
        + Add
      </button>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: CategoryViewModel[] }) {
  const [order, setOrder] = useState<CategoryViewModel[]>(categories);
  const [isPending, startTransition] = useTransition();

  // Resync local order state whenever the server-provided category list
  // changes (e.g. after add/delete/rename revalidation), mirroring the
  // dashboard TaskList pattern to avoid Reorder staleness.
  useEffect(() => {
    setOrder(categories);
  }, [categories]);

  function handleReorder(next: CategoryViewModel[]) {
    setOrder(next);
    startTransition(async () => {
      await reorderCategories(next.map((c) => c.id));
    });
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-black">Categories</h2>

      {order.length === 0 ? (
        <p className="mt-4 text-sm text-black/40">No categories yet. Add one below.</p>
      ) : (
        <Reorder.Group
          as="ul"
          axis="y"
          values={order}
          onReorder={handleReorder}
          className="mt-2 flex flex-col"
        >
          {order.map((category) => (
            <CategoryRow key={category.id} category={category} disabled={isPending} />
          ))}
        </Reorder.Group>
      )}

      <AddCategoryInline />
    </Card>
  );
}
