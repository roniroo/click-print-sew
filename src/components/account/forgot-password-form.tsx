"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { resetWithRecoveryCode, type ResetState } from "@/lib/actions/recovery";
import { RecoveryCodeCard } from "@/components/account/recovery-code-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ResetState = { error: null };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(resetWithRecoveryCode, initial);

  if (state.newCode) {
    return (
      <div className="space-y-4">
        <h1 className="font-hand text-3xl font-bold tracking-tight">
          Password reset
        </h1>
        <p className="text-sm text-muted-foreground">
          Your password is updated. Here&apos;s a fresh recovery code — the old
          one no longer works, so save this one.
        </p>
        <RecoveryCodeCard code={state.newCode} />
        <Button asChild className="w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-hand text-3xl font-bold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your username, your recovery code, and a new password.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoCapitalize="none" spellCheck={false} required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="code">Recovery code</Label>
        <Input id="code" name="code" placeholder="XXXX-XXXX-XXXX-XXXX" className="font-mono tracking-wider" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Reset password
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
