"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecoveryCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable; the code is still visible to copy manually
    }
  }

  return (
    <div className="rounded-lg border border-thread/30 bg-thread/5 p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <KeyRound className="size-4 text-thread" /> Recovery code
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 select-all rounded-md border border-border bg-card px-3 py-2 font-mono text-base tracking-wider">
          {code}
        </code>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={copy}
          aria-label="Copy recovery code"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Save this somewhere safe — it&apos;s the only way to reset your password,
        and we can&apos;t show it again.
      </p>
    </div>
  );
}
