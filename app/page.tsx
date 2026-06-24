import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-page flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-2 px-6 py-5">
        <Logo size={22} />
        <span className="font-bold text-[18px]">Selahe</span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-12">
        <Logo size={48} />
        <h1 className="mt-6 font-bold text-[40px] leading-tight max-w-[640px]">
          Turn feelings into action.
        </h1>
        <p className="mt-4 text-[17px] text-ink-soft max-w-[520px] leading-relaxed">
          Selahe breaks the freeze between knowing what to do and starting. A
          short coaching conversation shrinks the overwhelming into one small,
          specific step — then helps you actually do it.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-3 bg-ink text-white rounded-full px-7 py-3 text-[15px] font-bold hover:opacity-90 transition"
        >
          Sign in with Google
        </Link>

        <p className="mt-4 text-[13px] text-ink-faint">
          Free while in early testing.
        </p>
      </section>

      <footer className="px-6 py-6 text-center text-[13px] text-ink-faint">
        Selahe — an action coach.
      </footer>
    </main>
  );
}
