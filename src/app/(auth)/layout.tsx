import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/paper/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-graph flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Home
      </Link>
      <div className="mb-6">
        <Brand size="lg" />
      </div>
      {children}
    </main>
  );
}
