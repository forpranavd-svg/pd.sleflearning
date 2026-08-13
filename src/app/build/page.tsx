import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function BuildHubPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/build");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Build My Interview Kit</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Pick a way to build your personal question list. You can use more than one.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/build/import"
          className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.04]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">A</p>
          <h2 className="mt-1 text-base font-medium">Import your own</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Upload an Excel or CSV file of questions and answers you already have.
          </p>
        </Link>

        <Link
          href="/build/browse"
          className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.04]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">B</p>
          <h2 className="mt-1 text-base font-medium">Build from the public bank</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Browse questions shared by others, filtered by role and topic, and add the ones you
            want.
          </p>
        </Link>

        <div className="rounded-lg border border-dashed border-black/10 p-5 opacity-60 dark:border-white/15">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">C</p>
          <h2 className="mt-1 text-base font-medium">Ask AI to suggest questions</h2>
          <p className="mt-2 text-sm text-foreground/60">Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
