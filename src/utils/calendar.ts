import type { CalendarEvent } from "../types/calendar";

export const HOUR_HEIGHT = 64;
export const MINUTES_PER_HOUR = 60;
export const SNAP_MINUTES = 15;
export const TOTAL_HOURS = 24;

export const CALENDAR_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

/**
 * Generate 7 calendar days starting from today.
 */
export function getCalendarDays(startDate: Date, count = 7): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(startDate);

    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);

    return date;
  });
}

/**
 * Check whether a value is a valid Date object.
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Check whether two Date objects belong to the same day.
 *
 * An toàn với input không hợp lệ: trả về false thay vì
 * ném lỗi khi a hoặc b là undefined / không phải Date.
 */
export function isSameDay(a: Date, b: Date): boolean {
  if (!isValidDate(a) || !isValidDate(b)) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Convert Date -> number of minutes from midnight.
 *
 * 09:30 -> 570
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

/**
 * Convert minutes -> pixel position.
 *
 * Because:
 *
 * 1 hour = 64px
 * 1 minute = 64 / 60 px
 */
export function minutesToPixels(minutes: number): number {
  return minutes * (HOUR_HEIGHT / MINUTES_PER_HOUR);
}

/**
 * Convert Date -> pixel position.
 */
export function dateToPosition(date: Date): number {
  return minutesToPixels(dateToMinutes(date));
}

/**
 * Calculate Event height.
 */
export function getEventHeight(event: CalendarEvent): number {
  if (!isValidDate(event.startDateTime) || !isValidDate(event.endDateTime)) {
    return 0;
  }

  const start = dateToMinutes(event.startDateTime);

  const end = dateToMinutes(event.endDateTime);

  return minutesToPixels(end - start);
}

/**
 * Snap minutes to 15 minutes.
 *
 * 09:07 -> 09:00
 * 09:08 -> 09:15
 */
export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/**
 * Convert Y position inside calendar -> minutes.
 */
export function positionToMinutes(y: number): number {
  const rawMinutes = y / (HOUR_HEIGHT / MINUTES_PER_HOUR);

  return Math.max(0, Math.min(TOTAL_HOURS * 60, snapMinutes(rawMinutes)));
}

/**
 * Create a Date using a day and minutes.
 */
export function minutesToDate(day: Date, minutes: number): Date {
  const date = new Date(day);

  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);

  return date;
}

/**
 * Get duration in minutes.
 */
export function getDurationInMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

/**
 * Add minutes to a Date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Format time.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format date.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Format datetime-local input.
 *
 * Date -> "2026-09-09T09:30"
 */
export function toDateTimeInput(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/* ========================================
   PERSISTENCE (localStorage)
======================================== */

export const STORAGE_KEY = "weekly-calendar-events";

/**
 * Kiểu event khi đã serialize (Date -> ISO string).
 */
interface StoredEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}

/**
 * Chuyển event sang dạng lưu trữ (Date -> ISO string).
 */
function serializeEvent(event: CalendarEvent): StoredEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDateTime: event.startDateTime.toISOString(),
    endDateTime: event.endDateTime.toISOString(),
  };
}

/**
 * Khôi phục một event từ dạng lưu trữ.
 * Trả về null nếu dữ liệu không hợp lệ (revive Date thất bại),
 * để tránh đưa event hỏng vào lịch và gây crash.
 */
function reviveEvent(raw: unknown): CalendarEvent | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const value = raw as Partial<StoredEvent>;

  if (
    typeof value.id !== "string" ||
    typeof value.startDateTime !== "string" ||
    typeof value.endDateTime !== "string"
  ) {
    return null;
  }

  const startDateTime = new Date(value.startDateTime);

  const endDateTime = new Date(value.endDateTime);

  if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) {
    return null;
  }

  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title : "",
    description: typeof value.description === "string" ? value.description : "",
    startDateTime,
    endDateTime,
  };
}

/**
 * Đọc danh sách event từ localStorage.
 * Bỏ qua các bản ghi hỏng và trả về [] nếu không có/parse lỗi.
 */
export function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(reviveEvent)
      .filter((event): event is CalendarEvent => event !== null);
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách event vào localStorage.
 */
export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const serialized = events.map(serializeEvent);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    /* Bỏ qua lỗi quota/lưu trữ. */
  }
}
