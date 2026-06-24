"use client";

import { DAY_LETTERS, formatDuration } from "@/lib/dates";
import type { CardState } from "@/lib/types";

type Props = {
  state: CardState;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  durationMinutes?: number | null;
  daysOfWeek: number[]; // scheduled days (0=Sun..6=Sat)
  punchedDays?: number[]; // days actually punched (for filled pills)
  whyText?: string | null;
  accentColor?: string; // action identity color for the corner dot
  onCommit?: () => void; // draft: the + button
  onEdit?: () => void; // draft/scheduled: the edit pencil
  onUncommit?: () => void; // scheduled: the - button
  onPunch?: () => void; // completed view: the circle toggle
};

const BG: Record<CardState, string> = {
  draft: "bg-salmon",
  scheduled: "bg-yellow",
  completed: "bg-blue",
};

export function ActionCard({
  state,
  title,
  startTime,
  endTime,
  location,
  durationMinutes,
  daysOfWeek,
  punchedDays = [],
  whyText,
  accentColor = "#3B82F6",
  onCommit,
  onEdit,
  onUncommit,
  onPunch,
}: Props) {
  return (
    <div
      className={`${BG[state]} rounded-card shadow-card p-5 w-full max-w-[440px] font-mono text-ink`}
    >
      {/* Header row: title + corner control */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-[18px] leading-tight text-ink">{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {state === "draft" && (
            <>
              <button
                onClick={onEdit}
                aria-label="Edit"
                className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition"
              >
                <EditIcon />
              </button>
              <button
                onClick={onCommit}
                aria-label="Commit"
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:scale-105 transition"
              >
                <PlusIcon />
              </button>
            </>
          )}
          {state === "scheduled" && (
            <>
              <button
                onClick={onEdit}
                aria-label="Edit"
                className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition"
              >
                <EditIcon />
              </button>
              <button
                onClick={onUncommit}
                aria-label="Uncommit"
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:scale-105 transition"
              >
                <MinusIcon />
              </button>
            </>
          )}
          {state === "completed" && (
            <span
              className="w-5 h-5 rounded-full block"
              style={{ background: accentColor }}
              aria-label="Completed"
            />
          )}
        </div>
      </div>

      {/* Time range */}
      {(startTime || endTime) && (
        <div className="mt-4 flex items-center gap-2 text-[20px] font-bold tracking-tight">
          <TimeChunk value={startTime} />
          {startTime && endTime && <span className="opacity-50">-</span>}
          <TimeChunk value={endTime} />
        </div>
      )}

      {/* Metadata: location • duration */}
      {(location || durationMinutes) && (
        <div className="mt-1 text-[14px] text-ink-soft">
          {location}
          {location && durationMinutes ? " • " : ""}
          {formatDuration(durationMinutes ?? null)}
        </div>
      )}

      {/* Day pills */}
      <div className="mt-4 flex gap-2">
        {DAY_LETTERS.map((letter, idx) => {
          const scheduled = daysOfWeek.includes(idx);
          const punched = punchedDays.includes(idx);
          // Filled = scheduled (or punched). Empty white = not scheduled.
          const filled = scheduled || punched;
          return (
            <span
              key={idx}
              className={`day-pill ${
                filled ? "day-pill--filled" : "day-pill--empty"
              }`}
            >
              {filled ? letter : ""}
            </span>
          );
        })}
      </div>

      {/* Why */}
      {whyText && (
        <div className="mt-4">
          <div className="font-bold text-[14px]">Why?</div>
          <p className="text-[14px] text-ink-soft leading-snug mt-0.5">
            {whyText}
          </p>
        </div>
      )}
    </div>
  );
}

function TimeChunk({ value }: { value?: string | null }) {
  if (!value) return null;
  // "07:00 pm" -> number part boxed, am/pm boxed, matching the Figma chips
  const [num, ampm] = value.split(" ");
  return (
    <span className="inline-flex items-center gap-1">
      <span className="bg-white/70 rounded px-1.5">{num}</span>
      {ampm && <span className="bg-white/70 rounded px-1.5">{ampm}</span>}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.5v11M1.5 7h11"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 7h11" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 1.8 12.2 4.5 4.7 12H2v-2.7L9.5 1.8Z"
        stroke="#1a1a1a"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
