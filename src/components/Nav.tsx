import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/questions", label: "Browse Questions" },
  { href: "/practice", label: "Practice" },
];

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Self Learning
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/account" className="text-foreground/70 transition-colors hover:text-foreground">
                {user.name ?? user.email ?? user.phone}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-foreground/70 transition-colors hover:text-foreground">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
