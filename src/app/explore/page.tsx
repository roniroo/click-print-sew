import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionHeading } from "@/components/paper/section-heading";

export const metadata = { title: "Explore patterns" };

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-graph flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <SectionHeading
            title="Explore the community"
            description="Public patterns shared by other sewists. Clone any one to make it your own."
          />
          {/* Public gallery is implemented in the Library milestone. */}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
