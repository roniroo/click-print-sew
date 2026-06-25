import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, PencilRuler } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyPatterns } from "@/lib/queries/patterns";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/paper/section-heading";
import { PatternCard } from "@/components/library/pattern-card";
import { NotebookCard } from "@/components/paper/notebook-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My patterns" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const patterns = await getMyPatterns();

  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <SectionHeading
            title={`@${user.username}'s patterns`}
            description="Your saved patterns live here. Open one to keep drawing."
            actions={
              <Button asChild>
                <Link href="/patterns/new">
                  <Plus className="size-4" /> New pattern
                </Link>
              </Button>
            }
          />

          {patterns.length === 0 ? (
            <NotebookCard className="mt-8 p-10 pl-12 text-center">
              <PencilRuler className="mx-auto size-8 text-thread" />
              <h3 className="mt-3 font-hand text-2xl font-bold">No patterns yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Start with a blank sheet of graph paper and sketch your first
                pattern piece.
              </p>
              <Button asChild className="mt-5">
                <Link href="/patterns/new">
                  <Plus className="size-4" /> Create your first pattern
                </Link>
              </Button>
            </NotebookCard>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {patterns.map((p) => (
                <PatternCard key={p.id} pattern={p} variant="mine" />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
