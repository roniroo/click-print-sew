"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Printer, GitFork, Pencil } from "lucide-react";
import { clonePattern } from "@/lib/actions/patterns";
import type { PatternDocument } from "@/lib/types";
import { PrintDialog } from "@/components/print/print-dialog";
import { Button } from "@/components/ui/button";

export function PatternViewActions({
  id,
  title,
  doc,
  isOwner,
}: {
  id: string;
  title: string;
  doc: PatternDocument;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isOwner ? (
        <Button asChild variant="outline">
          <Link href={`/patterns/${id}/edit`}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Printer className="size-4" /> Print / PDF
      </Button>
      <Button disabled={pending} onClick={() => startTransition(() => clonePattern(id))}>
        <GitFork className="size-4" /> Clone &amp; edit
      </Button>
      <PrintDialog open={open} onOpenChange={setOpen} doc={doc} title={title} />
    </div>
  );
}
