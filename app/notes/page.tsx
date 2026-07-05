import { getNotes } from "@/lib/queries";
import { noteProgress } from "@/lib/notes";
import { NotesList, type NoteSummary } from "@/components/notes/NotesList";

// Reads live notes — render per request.
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotes();

  const summaries: NoteSummary[] = notes.map((note) => {
    const progress = noteProgress(note.items);
    return {
      id: note.id,
      title: note.title,
      updatedAt: note.updatedAt.toISOString(),
      progress,
      // lowercased haystack for client-side search (title + all item text)
      search: `${note.title} ${note.items.map((i) => i.content).join(" ")}`.toLowerCase(),
    };
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <NotesList notes={summaries} />
    </main>
  );
}
