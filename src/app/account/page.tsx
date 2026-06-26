import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/paper/section-heading";
import { PaperSheet } from "@/components/paper/paper-sheet";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { RecoveryCodeSection } from "@/components/account/recovery-code-section";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <SectionHeading
            title="Account"
            description={`Signed in as @${user.username}`}
          />

          <PaperSheet lifted className="mt-6 max-w-md p-6">
            <h2 className="font-hand text-2xl font-bold tracking-tight">
              Change password
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Cut Sew Print doesn&apos;t collect an email, so we can&apos;t send a
              reset link — keep your password somewhere safe. Enter your current
              password to set a new one.
            </p>
            <ChangePasswordForm />
          </PaperSheet>

          <PaperSheet lifted className="mt-5 max-w-md p-6">
            <h2 className="font-hand text-2xl font-bold tracking-tight">
              Recovery code
            </h2>
            <div className="mt-3">
              <RecoveryCodeSection />
            </div>
          </PaperSheet>
        </div>
      </main>
    </>
  );
}
