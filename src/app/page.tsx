import Link from "next/link";
import {
  PenTool,
  Printer,
  Layers,
  Ruler,
  Library,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotebookCard } from "@/components/paper/notebook-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

const features = [
  {
    icon: PenTool,
    title: "Pattern Builder",
    body: "Draw with snap-to-grid precision. Hold Shift to lock 45° angles. Lines, paths, rectangles, and ellipses on a real graph-paper canvas.",
  },
  {
    icon: Layers,
    title: "Layers & Pieces",
    body: "Organize your work in layers and group shapes into named pattern pieces — each with its own fabric and seam allowance.",
  },
  {
    icon: Ruler,
    title: "Real-world scale",
    body: "Work in inches, cm, mm, meters, or feet. Set a scale and watch dimensions update live as you draw.",
  },
  {
    icon: Printer,
    title: "Tiled PDF printing",
    body: "Split any pattern across Letter, A4, or Tabloid pages with registration marks and a scale test square. Tape and go.",
  },
  {
    icon: Scissors,
    title: "Materials list",
    body: "Assign fabrics, estimate total yardage, and pin notions like buttons and zippers right onto the pattern.",
  },
  {
    icon: Library,
    title: "Pattern library",
    body: "Save your patterns, publish them for the community, and clone anyone's public pattern to make it your own.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/dashboard" : "/signup";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-graph">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Scissors className="size-3.5" /> Free &amp; open source
              </span>
              <h1 className="mt-5 font-hand text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
                Draw it. Scale it.
                <br />
                <span className="text-primary">Sew it.</span>
              </h1>
              <p className="mt-5 max-w-prose text-lg text-muted-foreground">
                Cut Sew Print is a browser-based pattern studio for sewists. Sketch
                patterns on graph paper, set real dimensions, print them tiled to
                any paper size, and share with the community — no email required.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={primaryHref}>
                    {user ? "Go to my patterns" : "Start sewing"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/explore">Browse patterns</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="font-hand text-3xl font-bold tracking-tight">
            Everything you need on the cutting table
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <NotebookCard key={f.title} className="p-6 pl-8">
                <f.icon className="size-6 text-thread" />
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </NotebookCard>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="rounded-2xl border border-border bg-primary px-6 py-12 text-center text-primary-foreground sm:py-16">
            <h2 className="font-hand text-4xl font-bold tracking-tight">
              Your next make starts here
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
              Pick a username, set a password, and start drawing. That&apos;s it.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link href={primaryHref}>
                {user ? "Open my studio" : "Create a free account"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
