const MINUTE = 60000;
const DAY = 86400000;

// yyyy-mm-dd as a local date (new Date("2026-11-05") would be UTC midnight)
function localDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "4:35 pm"
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// "Thu, 5 Nov"
export const formatDay = (isoDate: string) =>
  localDate(isoDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// "5 Nov 2026"
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// "1 h 20 min", "45 min"
export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(Math.abs(ms) / MINUTE));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Whole calendar days from today to a yyyy-mm-dd date (negative when it has passed)
export function daysUntil(isoDate: string, now: number) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return Math.round((localDate(isoDate).getTime() - startOfToday.getTime()) / DAY);
}

export function relativeDays(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  return days === -1 ? "yesterday" : `${-days} days ago`;
}

// Is the 2-hour call-back promise still running, and how long is left
export function replyWindow(respondBy: string, now: number) {
  const left = new Date(respondBy).getTime() - now;
  return { overdue: left <= 0, label: formatDuration(left) };
}
