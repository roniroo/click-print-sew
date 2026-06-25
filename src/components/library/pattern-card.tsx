"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Globe,
  Lock,
  GitFork,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  deletePattern,
  duplicatePattern,
  setPatternPublic,
  clonePattern,
} from "@/lib/actions/patterns";
import type { PatternCardData } from "@/lib/queries/patterns";
import { NotebookCard } from "@/components/paper/notebook-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Thumbnail({ svg, title }: { svg: string | null; title: string }) {
  if (!svg) {
    return (
      <div className="grid aspect-[4/3] place-items-center bg-graph text-muted-foreground">
        <ImageOff className="size-6 opacity-40" />
      </div>
    );
  }
  return (
    <div
      className="aspect-[4/3] bg-graph p-3 [&>svg]:h-full [&>svg]:w-full"
      role="img"
      aria-label={`${title} preview`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function PatternCard({
  pattern,
  variant,
}: {
  pattern: PatternCardData;
  variant: "mine" | "public";
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const href = variant === "mine" ? `/patterns/${pattern.id}/edit` : `/patterns/${pattern.id}`;

  const subtitle =
    variant === "public"
      ? `by @${pattern.owner_username ?? "stitcher"}`
      : `Updated ${new Date(pattern.updated_at).toLocaleDateString()}`;

  return (
    <NotebookCard className="relative">
      <Link href={href} className="block">
        <Thumbnail svg={pattern.thumbnail} title={pattern.title} />
        <div className="border-t border-border p-3 pl-6">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate font-medium">{pattern.title}</h3>
            {variant === "mine" && pattern.is_public ? (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Globe className="size-3" /> Public
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        {variant === "mine" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="size-8 shadow-sm"
                aria-label="Pattern actions"
                disabled={pending}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/patterns/${pattern.id}/edit`}>
                  <Pencil className="size-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => startTransition(() => duplicatePattern(pattern.id))}
              >
                <Copy className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  startTransition(async () => {
                    await setPatternPublic(pattern.id, !pattern.is_public);
                    toast.success(pattern.is_public ? "Set to private" : "Published to Explore");
                  })
                }
              >
                {pattern.is_public ? (
                  <>
                    <Lock className="size-4" /> Make private
                  </>
                ) : (
                  <>
                    <Globe className="size-4" /> Make public
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="shadow-sm"
            disabled={pending}
            onClick={() => startTransition(() => clonePattern(pattern.id))}
          >
            <GitFork className="size-4" /> Clone
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pattern.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the pattern. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                startTransition(async () => {
                  await deletePattern(pattern.id);
                  toast.success("Pattern deleted");
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NotebookCard>
  );
}
