"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";
import type { Action } from "@/lib/types";

export function Sidebar({ activeActionId }: { activeActionId?: string }) {
  const [actions, setActions] = useState<Action[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/actions")
      .then((r) => r.json())
      .then((d) => setActions(d.actions ?? []));
  }, []);

  async function newAction() {
    const r = await fetch("/api/actions", { method: "POST" });
    const d = await r.json();
    if (d.action) window.location.href = `/chat/${d.action.id}`;
  }

  return (
    <aside className="w-[230px] shrink-0 border-r border-hairline h-screen flex flex-col bg-page">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Logo size={20} />
        <span className="font-bold text-[17px]">Selahe</span>
      </div>

      {/* Primary nav */}
      <nav className="px-2">
        <Link
          href="/logbook"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] hover:bg-page-alt transition"
        >
          <CheckIcon /> Action Logbook
        </Link>
        <button
          onClick={newAction}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] hover:bg-page-alt transition text-left"
        >
          <PlusIcon /> New action
        </button>
        <Link
          href="/logbook?search=1"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] hover:bg-page-alt transition"
        >
          <SearchIcon /> Search
        </Link>
      </nav>

      {/* Action list */}
      <div className="flex-1 overflow-y-auto px-2 mt-2">
        {actions.map((a) => (
          <Link
            key={a.id}
            href={`/chat/${a.id}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[14px] transition ${
              a.id === activeActionId ? "bg-page-alt" : "hover:bg-page-alt"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: a.color ?? "#3B82F6" }}
            />
            <span className="truncate">{a.title ?? "New action"}</span>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        className="m-2 px-3 py-2 rounded-lg text-[13px] text-ink-faint hover:bg-page-alt text-left transition"
      >
        Sign out
      </button>
    </aside>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.3" stroke="#1a1a1a" strokeWidth="1.2" />
      <path d="M5.5 8.2 7.2 10l3.3-3.6" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.3" stroke="#1a1a1a" strokeWidth="1.3" />
      <path d="m10.5 10.5 3 3" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
