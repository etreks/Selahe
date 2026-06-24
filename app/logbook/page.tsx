"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ActionCard } from "@/components/ActionCard";
import { createClient } from "@/lib/supabase-browser";
import { formatSectionDate, todayISO, dayOfWeek } from "@/lib/dates";
import type { Action, CardVersion, Punch } from "@/lib/types";

type Row = {
  action: Action;
  version: CardVersion;
  punch: Punch | null;
};

export default function LogbookPage() {
  const [byDate, setByDate] = useState<Record<string, Row[]>>({});
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const supabase = createClient();

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: actions } = await supabase
      .from("actions")
      .select("*")
      .eq("user_id", user.id)
      .is("archived_at", null);

    const { data: versions } = await supabase
      .from("card_versions")
      .select("*")
      .eq("is_active", true);

    const { data: punches } = await supabase
      .from("punches")
      .select("*")
      .order("scheduled_date", { ascending: false });

    const actionMap = new Map((actions ?? []).map((a) => [a.id, a]));
    const activeVersionByAction = new Map(
      (versions ?? []).map((v) => [v.action_id, v])
    );

    // Build rows grouped by date. For each punch, one row.
    const grouped: Record<string, Row[]> = {};

    // Today's scheduled (pending) cards: every active version scheduled today
    const today = todayISO();
    const todayDow = dayOfWeek(today);
    const todayRows: Row[] = [];
    for (const v of versions ?? []) {
      const action = actionMap.get(v.action_id);
      if (!action) continue;
      if (v.days_of_week.includes(todayDow)) {
        const punchedToday =
          (punches ?? []).find(
            (p) => p.action_id === action.id && p.scheduled_date === today
          ) ?? null;
        todayRows.push({ action, version: v, punch: punchedToday });
      }
    }
    if (todayRows.length) grouped[today] = todayRows;

    // Past punches grouped by their scheduled_date
    for (const p of punches ?? []) {
      if (p.scheduled_date === today) continue;
      const action = actionMap.get(p.action_id);
      const version = activeVersionByAction.get(p.action_id);
      if (!action || !version) continue;
      grouped[p.scheduled_date] = grouped[p.scheduled_date] || [];
      grouped[p.scheduled_date].push({ action, version, punch: p });
    }

    setByDate(grouped);
    // Today open by default
    setOpenDates(new Set([today]));
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePunch(row: Row, date: string) {
    if (row.punch) {
      await fetch(`/api/punch?punch_id=${row.punch.id}`, { method: "DELETE" });
    } else {
      await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: row.action.id, scheduled_date: date }),
      });
    }
    await load();
  }

  const dates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="px-8 py-5 border-b border-hairline">
          <h1 className="font-bold text-[16px]">Action Logbook</h1>
        </header>

        <div className="px-8 py-6">
          {dates.length === 0 && (
            <div className="text-ink-faint text-[14px]">
              No actions yet. Start one from the sidebar.
            </div>
          )}

          {dates.map((date) => {
            const isOpen = openDates.has(date);
            return (
              <section key={date} className="mb-8">
                <button
                  onClick={() =>
                    setOpenDates((prev) => {
                      const n = new Set(prev);
                      n.has(date) ? n.delete(date) : n.add(date);
                      return n;
                    })
                  }
                  className="flex items-center gap-2 text-[14px] font-bold mb-4"
                >
                  <span className="text-ink-faint">{isOpen ? "▾" : "▸"}</span>
                  {formatSectionDate(date)}
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[920px]">
                    {byDate[date].map((row) => {
                      const completed = !!row.punch;
                      const punchedDays = completed
                        ? [dayOfWeek(date)]
                        : [];
                      return (
                        <div key={row.action.id + date} className="relative">
                          <ActionCard
                            state={completed ? "completed" : "scheduled"}
                            title={row.action.title ?? ""}
                            startTime={row.version.start_time}
                            endTime={row.version.end_time}
                            location={row.version.location}
                            durationMinutes={row.version.duration_minutes}
                            daysOfWeek={row.version.days_of_week}
                            punchedDays={punchedDays}
                            whyText={row.version.why_text}
                            accentColor={row.action.color ?? "#3B82F6"}
                            onUncommit={() => togglePunch(row, date)}
                          />
                          {/* Completion toggle (the circle) overlaid top-right for pending */}
                          {!completed && (
                            <button
                              onClick={() => togglePunch(row, date)}
                              aria-label="Mark done"
                              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/70 hover:bg-white transition"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
