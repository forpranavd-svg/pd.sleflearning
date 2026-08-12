import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/questions", label: "Browse Questions" },
  { href: "/practice", label: "Practice" },
];

export default function Nav() {
  return (
    <nav className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Self Learning
        </Link>
        <div className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
