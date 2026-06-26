import type { Metadata } from "next";
import { PaperSheet } from "@/components/paper/paper-sheet";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <PaperSheet lifted className="w-full max-w-sm p-6 sm:p-8">
      <ForgotPasswordForm />
    </PaperSheet>
  );
}
