import Link from "next/link";
import { Compass } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Brand } from "@/components/paper/brand";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Brand />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost">
            <Link href="/explore">
              <Compass className="size-4" />
              <span className="hidden sm:inline">Explore</span>
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/dashboard">My patterns</Link>
              </Button>
              <Button asChild>
                <Link href="/patterns/new">New pattern</Link>
              </Button>
              <UserMenu username={user.username} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
