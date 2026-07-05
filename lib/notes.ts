// Pure helpers for the notes outline. The editor works with a flat list + depth
// (the classic outliner representation); the database stores a parentId/order
// tree. These convert between the two, plus per-note progress. No I/O here.

export type StoredItem = {
  id: string;
  parentId: string | null;
  content: string;
  isCheckbox: boolean;
  isChecked: boolean;
  order: number;
};

export type OutlineItem = {
  id: string;
  content: string;
  isCheckbox: boolean;
  isChecked: boolean;
  depth: number;
};

/** Stored tree (parentId + order) -> flat pre-order outline with depth. */
export function toOutline(items: StoredItem[]): OutlineItem[] {
  const childrenOf = new Map<string | null, StoredItem[]>();
  for (const item of items) {
    const list = childrenOf.get(item.parentId) ?? [];
    list.push(item);
    childrenOf.set(item.parentId, list);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.order - b.order);

  const out: OutlineItem[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const item of childrenOf.get(parentId) ?? []) {
      out.push({
        id: item.id,
        content: item.content,
        isCheckbox: item.isCheckbox,
        isChecked: item.isChecked,
        depth,
      });
      walk(item.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/**
 * Flat outline (with depth) -> stored items with parentId + sibling order.
 * An item's parent is the nearest preceding line one level shallower; its order
 * is its index among items sharing that parent. Output is in pre-order, so a
 * parent always precedes its children (safe to upsert in array order).
 */
export function toStored(outline: OutlineItem[]): StoredItem[] {
  const parentIds: (string | null)[] = outline.map((item, i) => {
    if (item.depth === 0) return null;
    for (let j = i - 1; j >= 0; j--) {
      if (outline[j].depth === item.depth - 1) return outline[j].id;
    }
    return null; // malformed indent (e.g. child before any parent) -> treat as root
  });

  const siblingCount = new Map<string | null, number>();
  return outline.map((item, i) => {
    const parentId = parentIds[i];
    const order = siblingCount.get(parentId) ?? 0;
    siblingCount.set(parentId, order + 1);
    return {
      id: item.id,
      parentId,
      content: item.content,
      isCheckbox: item.isCheckbox,
      isChecked: item.isChecked,
      order,
    };
  });
}

/** Per-note completion over its checkbox items (headings don't count). */
export function noteProgress(
  items: { isCheckbox: boolean; isChecked: boolean }[]
): { done: number; total: number; percent: number } {
  let total = 0;
  let done = 0;
  for (const item of items) {
    if (!item.isCheckbox) continue;
    total += 1;
    if (item.isChecked) done += 1;
  }
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
