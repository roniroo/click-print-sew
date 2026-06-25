import type { Metadata } from "next";
import { PaperSheet } from "@/components/paper/paper-sheet";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign up" };

function safeTarget(target?: string): string {
  return target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : "/dashboard";
}

export default async function SignupPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await props.searchParams;

  return (
    <PaperSheet lifted className="w-full max-w-sm p-6 sm:p-8">
      <h1 className="font-hand text-3xl font-bold tracking-tight">
        Start sewing
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Pick a username and password. No email, no problem.
      </p>
      <AuthForm mode="signup" redirectTo={safeTarget(redirect)} />
    </PaperSheet>
  );
}
