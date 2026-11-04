import { addUtcDays, isValidIsoDate } from "@/lib/booking-rules";

export const BED_GENDERS = ["female", "male", "unknown"] as const;
export type BedGender = (typeof BED_GENDERS)[number];
export type DepartureCountdown =
  | { status: "leaves_today"; daysRemaining: 0 }
  | { status: "scheduled"; daysRemaining: number }
  | { status: "overdue"; daysRemaining: null };

export function ulaanbaatarToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(value => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function departureCountdown(checkOut: string, today = ulaanbaatarToday()): DepartureCountdown {
  if (!isValidIsoDate(checkOut) || !isValidIsoDate(today)) {
    throw new Error("Valid Ulaanbaatar calendar dates are required.");
  }
  if (checkOut < today) return { status: "overdue", daysRemaining: null };
  if (checkOut === today) return { status: "leaves_today", daysRemaining: 0 };

  const daysRemaining = Math.round(
    (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${today}T00:00:00.000Z`)) / 86_400_000
  );
  return { status: "scheduled", daysRemaining };
}

export function createBedLabels(roomId: string, bedCount: number): string[] {
  if (!roomId.trim() || !Number.isInteger(bedCount) || bedCount < 0) {
    throw new Error("A room ID and a non-negative whole bed count are required.");
  }
  return Array.from({ length: bedCount }, (_, index) => `${roomId}-B${index + 1}`);
}

export function hasSameGenderSharingConflict(
  existing: Array<BedGender | null | undefined>,
  incoming: Array<BedGender | null | undefined>
): boolean {
  const allGenders = [...existing, ...incoming];
  return allGenders.length > 0 &&
    (allGenders.some(gender => !gender || gender === "unknown") ||
      new Set(allGenders).size > 1);
}

export function bookingSelectedDatesOverlap(
  aCheckIn: string,
  aCheckOut: string,
  bCheckIn: string,
  bCheckOut: string
): boolean {
  return aCheckIn < bCheckOut && aCheckOut > bCheckIn;
}

export function nextSevenNightStay(today = ulaanbaatarToday()) {
  return { checkIn: today, checkOut: addUtcDays(today, 7) };
}
