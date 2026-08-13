"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; role: string | null };

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setProfile(data.user));
  }, []);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setDeleting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (profile === undefined) {
    return <div className="mx-auto max-w-sm px-4 py-10 sm:px-6 text-sm text-foreground/50">Loading…</div>;
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10 sm:px-6 text-sm text-foreground/70">
        You need to be logged in to view your account.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      <div className="mt-6 flex flex-col gap-1 text-sm text-foreground/70">
        {profile.name && <p>{profile.name}</p>}
        {profile.email && <p>{profile.email}</p>}
        {profile.phone && <p>{profile.phone}</p>}
      </div>

      <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
        <h2 className="text-sm font-semibold">Your data</h2>
        <a
          href="/api/account/export"
          className="mt-2 inline-block text-sm text-foreground/70 hover:text-foreground hover:underline"
        >
          Download my data (JSON)
        </a>
      </div>

      <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Delete account</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Permanently deletes your account and practice history. Questions you&rsquo;ve made public stay
          available to other users, no longer tied to your name.
        </p>

        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-md border border-red-600/30 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-600/10 dark:text-red-400"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm text-foreground/60 hover:bg-black/[.04] disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/[.06]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
