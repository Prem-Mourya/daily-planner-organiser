import { notFound } from "next/navigation";
import { getNote } from "@/lib/queries";
import { toOutline } from "@/lib/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";

// Reads live note content — render per request.
export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const note = await getNote(id);
  if (!note) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 py-8">
      <NoteEditor
        noteId={note.id}
        initialTitle={note.title}
        initialOutline={toOutline(note.items)}
      />
    </main>
  );
}
