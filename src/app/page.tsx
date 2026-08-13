import Link from "next/link";
import { randomQuote } from "@/lib/quotes";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const quote = randomQuote();

  const user = await getCurrentUser();
  const hasList = user ? (await prisma.userQuestion.count({ where: { userId: user.id } })) > 0 : false;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-foreground/50">
        Self Learning
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Get interview-ready, one question at a time.
      </h1>

      <blockquote className="mt-10 max-w-xl">
        <p className="text-xl italic text-foreground/80">&ldquo;{quote.text}&rdquo;</p>
        <footer className="mt-2 text-sm text-foreground/50">&mdash; {quote.author}</footer>
      </blockquote>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/practice"
          className="rounded-full bg-foreground px-8 py-3 text-base font-medium text-background transition-opacity hover:opacity-90"
        >
          Get Started
        </Link>
        <Link
          href="/questions"
          className="rounded-full border border-black/10 px-8 py-3 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
        >
          Browse Questions
        </Link>
        <Link
          href="/build"
          className="rounded-full border border-black/10 px-8 py-3 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
        >
          {hasList ? "Edit My Interview Kit" : "Build My Interview Kit"}
        </Link>
      </div>
    </div>
  );
}
