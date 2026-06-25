import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/paper/section-heading";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My patterns" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <SectionHeading
            title={`@${user.username}'s patterns`}
            description="Your saved patterns live here."
            actions={
              <Button asChild>
                <Link href="/patterns/new">
                  <Plus className="size-4" /> New pattern
                </Link>
              </Button>
            }
          />
          {/* Pattern grid is implemented in the Library milestone. */}
        </div>
      </main>
    </>
  );
}
