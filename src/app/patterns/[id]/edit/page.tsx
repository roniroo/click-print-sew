import { notFound, redirect } from "next/navigation";
import { getEditablePattern, ensureDocument } from "@/lib/queries/patterns";
import { getCurrentUser } from "@/lib/auth";
import { PatternEditor } from "@/components/editor/pattern-editor";

export const metadata = { title: "Edit pattern" };

export default async function EditPatternPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/patterns/${id}/edit`);

  const pattern = await getEditablePattern(id);
  if (!pattern) notFound();

  return (
    <PatternEditor
      initial={{
        id: pattern.id,
        title: pattern.title,
        isPublic: pattern.is_public,
        document: ensureDocument(pattern.document, pattern.units),
      }}
    />
  );
}
