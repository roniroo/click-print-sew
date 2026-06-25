import { Search } from "lucide-react";
import { getPublicPatterns } from "@/lib/queries/patterns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionHeading } from "@/components/paper/section-heading";
import { PatternCard } from "@/components/library/pattern-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Explore patterns" };

export default async function ExplorePage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await props.searchParams;
  const patterns = await getPublicPatterns(q);

  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <SectionHeading
            title="Explore the community"
            description="Public patterns shared by other sewists. Clone any one to make it your own."
          />

          <form action="/explore" method="get" className="mt-6 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search patterns…"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {patterns.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              {q
                ? `No public patterns match “${q}”.`
                : "No public patterns yet — be the first to publish one!"}
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {patterns.map((p) => (
                <PatternCard key={p.id} pattern={p} variant="public" />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
