"use client";

import { useEffect, useRef, useState } from "react";
import { ActionCard } from "@/components/ActionCard";
import type {
  Action,
  CardVersion,
  Message,
  ProposedCard,
} from "@/lib/types";

type Bundle = {
  messages: Message[];
  versions: CardVersion[];
  action: Action;
};

export function ChatThread({ actionId }: { actionId: string }) {
  const [data, setData] = useState<Bundle | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState<ProposedCard | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch(`/api/messages?action_id=${actionId}`);
    const d = await r.json();
    setData(d);
  }
  useEffect(() => {
    load();
  }, [actionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, draft]);

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    // optimistic user bubble
    setData((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: "tmp-" + Date.now(),
                action_id: actionId,
                role: "user",
                content: text,
                message_type: "dialogue",
                card_version_id: null,
                punch_id: null,
                created_at: new Date().toISOString(),
              },
            ],
          }
        : prev
    );
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: actionId, message: text }),
    });
    const d = await r.json();
    if (d.proposed) setDraft(d.proposed);
    await load();
    setSending(false);
  }

  async function commit() {
    if (!draft) return;
    await fetch("/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: actionId, card: draft }),
    });
    setDraft(null);
    await load();
  }

  if (!data) {
    return <div className="flex-1 flex items-center justify-center text-ink-faint">Loading…</div>;
  }

  const versionCount = data.versions.length;
  const action = data.action;

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-hairline">
        <span className="font-bold text-[15px]">
          {action.title ?? "New action"}
        </span>
        {/* Clock icon appears only when versions.count > 1 */}
        {versionCount > 1 && (
          <button
            onClick={() => setShowVersions((s) => !s)}
            aria-label="Version history"
            className="text-ink-soft hover:text-ink transition"
          >
            <ClockIcon />
          </button>
        )}
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {data.messages.map((m) => (
          <MessageRow key={m.id} message={m} versions={data.versions} action={action} />
        ))}

        {/* Live draft card (salmon, not yet committed) */}
        {draft && (
          <div>
            <div className="text-[14px] mb-2">
              Got it. Here is your action card. If this course of action suits you,
              click the &apos;+&apos; icon to punch it into your Action Logbook.
            </div>
            <div className="font-bold text-[14px] mb-2">Course of Action, Created:</div>
            <ActionCard
              state="draft"
              title={draft.title}
              startTime={draft.start_time}
              endTime={draft.end_time}
              location={draft.location}
              durationMinutes={draft.duration_minutes}
              daysOfWeek={draft.days_of_week}
              whyText={draft.why_text}
              accentColor={action.color ?? "#3B82F6"}
              onCommit={commit}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Version history panel */}
      {showVersions && (
        <VersionPanel versions={data.versions} onClose={() => setShowVersions(false)} />
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-hairline">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write notes..."
          className="w-full rounded-full border border-hairline px-5 py-3 text-[14px] outline-none focus:border-ink-faint"
        />
      </div>
    </div>
  );
}

function MessageRow({
  message,
  versions,
  action,
}: {
  message: Message;
  versions: CardVersion[];
  action: Action;
}) {
  // User bubble (right aligned)
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-bubble-user rounded-2xl px-4 py-2 max-w-[70%] text-[14px]">
          {message.content}
        </div>
      </div>
    );
  }

  // System: saved notification / auto-log (italic right-aligned pill)
  if (message.message_type === "saved_notification" || message.message_type === "auto_log") {
    return (
      <div className="flex justify-end">
        <div className="bg-bubble-user rounded-2xl px-4 py-2 text-[13px] italic text-ink-soft">
          {message.content}
        </div>
      </div>
    );
  }

  // System: card committed -> render the committed (completed/blue) card inline
  if (message.message_type === "card_created" || message.message_type === "card_updated") {
    const v = versions.find((x) => x.id === message.card_version_id);
    if (v) {
      return (
        <ActionCard
          state="completed"
          title={action.title ?? ""}
          startTime={v.start_time}
          endTime={v.end_time}
          location={v.location}
          durationMinutes={v.duration_minutes}
          daysOfWeek={v.days_of_week}
          whyText={v.why_text}
          accentColor={action.color ?? "#3B82F6"}
        />
      );
    }
  }

  // Assistant dialogue (left aligned, plain)
  return <div className="text-[14px] max-w-[75%]">{message.content}</div>;
}

function VersionPanel({
  versions,
  onClose,
}: {
  versions: CardVersion[];
  onClose: () => void;
}) {
  const sorted = [...versions].sort(
    (a, b) => +new Date(a.created_at) - +new Date(b.created_at)
  );
  return (
    <div className="absolute right-0 top-0 h-screen w-[320px] bg-page border-l border-hairline shadow-xl p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-[15px]">Version history</span>
        <button onClick={onClose} className="text-ink-faint">✕</button>
      </div>
      {sorted.map((v, i) => (
        <div key={v.id} className="border-b border-hairline py-3 text-[13px]">
          <div className="font-bold">Version {i + 1}{v.is_active ? " (active)" : ""}</div>
          <div className="text-ink-soft mt-1">
            {v.start_time} – {v.end_time}
          </div>
          <div className="text-ink-soft">{v.location}</div>
        </div>
      ))}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 5.5V9l2.3 1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
