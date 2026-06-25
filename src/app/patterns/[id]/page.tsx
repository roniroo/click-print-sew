import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, Lock, Scissors, CircleDot, Shapes } from "lucide-react";
import { getPatternView, ensureDocument } from "@/lib/queries/patterns";
import { documentToSvg } from "@/lib/editor/render";
import { estimateYardage } from "@/lib/materials/yardage";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaperSheet } from "@/components/paper/paper-sheet";
import { PatternViewActions } from "@/components/library/pattern-view-actions";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const view = await getPatternView(id);
  return { title: view ? view.pattern.title : "Pattern" };
}

export default async function PatternViewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const view = await getPatternView(id);
  if (!view) notFound();

  const { pattern, ownerUsername, isOwner } = view;
  const doc = ensureDocument(pattern.document, pattern.units);
  const svg = documentToSvg(doc, { strokeWidth: 1.5 });
  const yardage = estimateYardage(doc);
  const namedPieces = doc.pieces.filter((p) =>
    doc.elements.some((e) => e.pieceId === p.id),
  );

  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
          {/* Pattern preview */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-hand text-4xl font-bold tracking-tight">
                  {pattern.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  by @{ownerUsername} ·{" "}
                  {pattern.is_public ? (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="size-3.5" /> Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="size-3.5" /> Private
                    </span>
                  )}
                </p>
              </div>
            </div>

            {pattern.description ? (
              <p className="max-w-prose text-sm text-foreground/80">{pattern.description}</p>
            ) : null}

            <PaperSheet
              lifted
              className="grid min-h-80 place-items-center overflow-hidden p-4 [&>svg]:max-h-[70vh] [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <PatternViewActions id={pattern.id} title={pattern.title} doc={doc} isOwner={isOwner} />

            <PaperSheet className="space-y-4 p-4">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Shapes className="size-4 text-thread" /> Pieces
                </h2>
                {namedPieces.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {namedPieces.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">
                          {doc.elements.filter((e) => e.pieceId === p.id).length} shapes
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No named pieces.</p>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Scissors className="size-4 text-thread" /> Fabric
                </h2>
                {yardage.fabrics.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {yardage.fabrics.map((f) => (
                      <li key={f.fabricId} className="flex items-center gap-2">
                        <span className="size-3 shrink-0 rounded-full" style={{ background: f.color }} />
                        <span className="flex-1 truncate">{f.fabricName}</span>
                        <span className="font-medium tabular-nums">{f.lengthYards.toFixed(2)} yd</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No fabric assigned.</p>
                )}
              </div>

              {doc.materials.notions.length ? (
                <div className="border-t border-border pt-3">
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                    <CircleDot className="size-4 text-thread" /> Notions
                  </h2>
                  <ul className="mt-2 space-y-1 text-sm">
                    {doc.materials.notions.map((n) => (
                      <li key={n.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          {n.name}
                          {n.note ? <span className="text-muted-foreground"> — {n.note}</span> : null}
                        </span>
                        <span className="shrink-0 text-muted-foreground">×{n.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </PaperSheet>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
