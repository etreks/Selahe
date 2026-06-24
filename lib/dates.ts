// All date/weekday logic lives here and is computed deterministically.
// The AI never decides what day of the week a date is — that was the
// source of the "16 June = Monday" bug. Code does it; code is always right.

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"]; // index = getDay()
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Returns e.g. "Monday" for a given YYYY-MM-DD string (parsed as local date).
export function weekdayName(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return DAY_NAMES[date.getDay()];
}

// "16 June, Monday" — the auto-log label, computed correctly every time.
export function formatLogDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${d} ${month}, ${weekdayName(isoDate)}`;
}

// "19 June, Friday" — logbook section header.
export function formatSectionDate(isoDate: string): string {
  return formatLogDate(isoDate);
}

// Today's date as YYYY-MM-DD in the user's local time.
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// getDay() integer (0=Sun..6=Sat) for a date string.
export function dayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export { DAY_LETTERS, DAY_NAMES };

// "1h 30m" from minutes.
export function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
