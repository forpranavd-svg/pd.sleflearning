"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Mode = "choose" | "email-sent" | "otp-entry" | "password";
type Tab = "email" | "phone" | "password";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialChannel = searchParams.get("channel");
  const initialContact = searchParams.get("contact");

  const [mode, setMode] = useState<Mode>(
    initialChannel === "email" && initialContact
      ? "email-sent"
      : initialChannel === "phone" && initialContact
        ? "otp-entry"
        : "choose"
  );
  const [tab, setTab] = useState<Tab>("email");
  const [contact, setContact] = useState(initialContact ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "invalid_token"
      ? "That link is invalid or has expired. Request a new one below."
      : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  async function requestMagicLink(email: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setContact(email);
    setMode("email-sent");
  }

  async function requestOtp(phone: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setContact(phone);
    setMode("otp-entry");
  }

  async function verifyOtp() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: contact, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function loginWithPassword() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="mt-4 text-sm text-green-700 dark:text-green-400">{notice}</p>}

      {mode === "email-sent" && (
        <div className="mt-6 rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
          <p>
            If an account exists for <span className="font-medium">{contact}</span>, we sent a
            login link. Click it to log in — it expires in 15 minutes.
          </p>
          <button
            onClick={() => {
              setNotice("Sent again.");
              requestMagicLink(contact);
            }}
            disabled={submitting}
            className="mt-3 text-xs font-medium text-foreground/60 hover:text-foreground hover:underline disabled:opacity-40"
          >
            Resend link
          </button>
        </div>
      )}

      {mode === "otp-entry" && (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-foreground/70">
            If an account exists for <span className="font-medium">{contact}</span>, we sent a
            code. Enter it below.
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
          />
          <button
            onClick={verifyOtp}
            disabled={submitting || !code.trim()}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Verifying…" : "Verify & log in"}
          </button>
          <button
            onClick={() => requestOtp(contact)}
            disabled={submitting}
            className="text-xs font-medium text-foreground/60 hover:text-foreground hover:underline disabled:opacity-40"
          >
            Resend code
          </button>
        </div>
      )}

      {mode === "choose" && (
        <>
          <div className="mt-6 flex gap-2 text-sm">
            {(["email", "phone", "password"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full border px-3 py-1.5 transition-colors ${
                  tab === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/10 text-foreground/60 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
                }`}
              >
                {t === "email" ? "Email link" : t === "phone" ? "Text code" : "Password"}
              </button>
            ))}
          </div>

          {tab === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestMagicLink(contact);
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                type="email"
                placeholder="Email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
              />
              <button
                type="submit"
                disabled={submitting || !contact}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Send login link"}
              </button>
            </form>
          )}

          {tab === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestOtp(contact);
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                type="tel"
                placeholder="Phone (e.g. +14155551234)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
              />
              <button
                type="submit"
                disabled={submitting || !contact}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Send code"}
              </button>
            </form>
          )}

          {tab === "password" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginWithPassword();
              }}
              className="mt-4 flex flex-col gap-3"
            >
              <input
                type="text"
                placeholder="Email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
              />
              <button
                type="submit"
                disabled={submitting || !identifier || !password}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "Logging in…" : "Log in"}
              </button>
            </form>
          )}
        </>
      )}

      <p className="mt-6 text-center text-sm text-foreground/60">
        Don&rsquo;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
