"use client";

import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="min-h-screen bg-page flex flex-col items-center justify-center px-6 text-center">
      <Logo size={44} />
      <h1 className="mt-6 font-bold text-[28px]">Welcome to Selahe</h1>
      <p className="mt-3 text-[15px] text-ink-soft max-w-[360px]">
        Sign in to start turning feelings into action.
      </p>
      <button
        onClick={signInWithGoogle}
        className="mt-8 inline-flex items-center gap-3 bg-ink text-white rounded-full px-7 py-3 text-[15px] font-bold hover:opacity-90 transition"
      >
        <GoogleMark /> Sign in with Google
      </button>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#fff"
        d="M9 7.2v3.4h4.8C13.3 12.4 11.4 13.8 9 13.8A4.8 4.8 0 1 1 9 4.2c1.3 0 2.4.5 3.3 1.3l2.4-2.4A8.2 8.2 0 1 0 9 17.2c4.7 0 8-3.3 8-8 0-.6 0-1-.2-1.5H9Z"
      />
    </svg>
  );
}
