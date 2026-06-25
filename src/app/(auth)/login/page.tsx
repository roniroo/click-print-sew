import type { Metadata } from "next";
import { PaperSheet } from "@/components/paper/paper-sheet";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

function safeTarget(target?: string): string {
  return target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : "/dashboard";
}

export default async function LoginPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await props.searchParams;

  return (
    <PaperSheet lifted className="w-full max-w-sm p-6 sm:p-8">
      <h1 className="font-hand text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Log in to your sewing studio.
      </p>
      <AuthForm mode="login" redirectTo={safeTarget(redirect)} />
    </PaperSheet>
  );
}
