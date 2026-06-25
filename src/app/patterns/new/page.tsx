import { redirect } from "next/navigation";
import { createPattern } from "@/lib/queries/patterns";

export const metadata = { title: "New pattern" };

// Visiting this route creates a fresh pattern and opens it in the editor.
export default async function NewPatternPage() {
  const id = await createPattern();
  if (!id) redirect("/login?redirect=/patterns/new");
  redirect(`/patterns/${id}/edit`);
}
