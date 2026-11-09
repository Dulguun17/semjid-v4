export const BOOKING_STAY_NIGHTS = 7;
export const BOOKING_ADVANCE_MONTHS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addUtcDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addUtcMonthsClamped(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString().slice(0, 10);
}

export function validateBookingDates(
  checkIn: string,
  checkOut: string,
  today = new Date().toISOString().slice(0, 10),
  stayNights = BOOKING_STAY_NIGHTS,
  advanceMonths = BOOKING_ADVANCE_MONTHS
): string | null {
  if (!Number.isInteger(stayNights) || stayNights < 1 ||
    !Number.isInteger(advanceMonths) || advanceMonths < 1) {
    return "invalid_booking_policy";
  }
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut) || !isValidIsoDate(today)) {
    return "invalid_date";
  }
  if (checkOut !== addUtcDays(checkIn, stayNights)) {
    return "stay_duration_mismatch";
  }
  if (checkIn < today) return "check_in_in_past";
  if (checkIn > addUtcMonthsClamped(today, advanceMonths)) {
    return "too_far_in_advance";
  }
  return null;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) return 0;
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / DAY_MS
  );
}
