"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { regenerateRecoveryCode, type RecoveryState } from "@/lib/actions/recovery";
import { RecoveryCodeCard } from "./recovery-code-card";
import { Button } from "@/components/ui/button";

const initial: RecoveryState = { code: null, error: null };

export function RecoveryCodeSection() {
  const [state, action, pending] = useActionState(regenerateRecoveryCode, initial);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A recovery code lets you reset your password if you forget it — no email
        needed. Generating a new one replaces any previous code.
      </p>

      {state.code ? <RecoveryCodeCard code={state.code} /> : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" variant={state.code ? "secondary" : "default"} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {state.code ? "Generate a different code" : "Generate recovery code"}
      </Button>
    </form>
  );
}
