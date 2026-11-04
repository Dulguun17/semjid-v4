import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);

function loadTypeScript(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = specifier => {
    if (specifier === "@/lib/booking-rules") {
      return loadTypeScript("src/lib/booking-rules.ts");
    }
    return nodeRequire(specifier);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const availability = loadTypeScript("src/lib/bed-availability.ts");

test("uses Ulaanbaatar calendar dates across UTC midnight", () => {
  assert.equal(availability.ulaanbaatarToday(new Date("2025-01-01T16:30:00.000Z")), "2025-01-02");
});

test("departure countdowns handle scheduled day, future, and overdue stays", () => {
  assert.deepEqual(availability.departureCountdown("2025-03-08", "2025-03-08"), {
    status: "leaves_today",
    daysRemaining: 0,
  });
  assert.deepEqual(availability.departureCountdown("2025-03-10", "2025-03-08"), {
    status: "scheduled",
    daysRemaining: 2,
  });
  assert.deepEqual(availability.departureCountdown("2025-03-07", "2025-03-08"), {
    status: "overdue",
    daysRemaining: null,
  });
  assert.throws(() => availability.departureCountdown("invalid", "2025-03-08"), /calendar dates/);
});

test("bed identities are stable and selected-date overlap permits adjacent stays", () => {
  assert.deepEqual(availability.createBedLabels("101", 3), ["101-B1", "101-B2", "101-B3"]);
  assert.equal(availability.bookingSelectedDatesOverlap("2025-03-01", "2025-03-08", "2025-03-08", "2025-03-15"), false);
  assert.equal(availability.bookingSelectedDatesOverlap("2025-03-01", "2025-03-08", "2025-03-07", "2025-03-14"), true);
  assert.equal(availability.nextSevenNightStay("2025-03-01").checkOut, "2025-03-08");
});

test("room sharing requires one known gender across every guest", () => {
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["female"]), false);
  assert.equal(availability.hasSameGenderSharingConflict([], ["female", "female"]), false);
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["male"]), true);
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["unknown"]), true);
  assert.equal(availability.hasSameGenderSharingConflict([], ["male", "female"]), true);
  assert.equal(availability.hasSameGenderSharingConflict([], ["female", null]), true);
  assert.equal(availability.hasSameGenderSharingConflict([], ["female", undefined]), true);
  assert.equal(availability.hasSameGenderSharingConflict([], []), false);
});

test("gender sharing allows adjacent stays but blocks opposite or unresolved overlaps", () => {
  const overlaps = availability.bookingSelectedDatesOverlap;
  assert.equal(overlaps("2025-03-01", "2025-03-08", "2025-03-08", "2025-03-15"), false);
  assert.equal(overlaps("2025-03-01", "2025-03-08", "2025-03-07", "2025-03-14"), true);
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["female"]), false);
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["male"]), true);
  assert.equal(availability.hasSameGenderSharingConflict(["female"], ["unknown"]), true);
});

test("public availability SQL projects only the approved limited response fields", () => {
  const migration = fs.readFileSync(
    path.join(root, "supabase/staff_booking_workflow_migration.sql"),
    "utf8"
  );
  const start = migration.indexOf("create or replace function public.get_public_bed_availability(");
  const end = migration.indexOf("revoke all on function public.get_public_bed_availability", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const publicFunction = migration.slice(start, end);
  for (const privateField of ["booking_id", "fname", "lname", "phone", "email", "notes", "ref", "guest_gender"]) {
    assert.doesNotMatch(publicFunction, new RegExp(`^\\s*'${privateField}'\\s*,`, "m"));
  }
  for (const allowedField of ["room_id", "category_id", "beds", "bed_id", "state", "occupant_gender", "departure_status", "days_remaining", "gender_for_dates", "gender_conflict", "gender_matches_selection"]) {
    assert.match(publicFunction, new RegExp(`^\\s*'${allowedField}'\\s*,`, "m"));
  }
});

test("bed RPCs require per-guest assignments and serialize reservation changes", () => {
  const migration = fs.readFileSync(
    path.join(root, "supabase/staff_booking_workflow_migration.sql"),
    "utf8"
  );
  const createStart = migration.indexOf("create or replace function public.create_staff_bed_booking(");
  const updateStart = migration.indexOf("create or replace function public.update_staff_bed_booking(");
  const updateEnd = migration.indexOf("revoke all on function public.update_staff_bed_booking", updateStart);
  const createBooking = migration.slice(createStart, updateStart);
  const updateBooking = migration.slice(updateStart, updateEnd);
  const closureGuard = migration.slice(
    migration.indexOf("create or replace function public.audit_room_block_change()"),
    migration.indexOf("revoke all on function public.audit_room_block_change()")
  );

  assert.match(createBooking, /jsonb_array_length\(p_booking->'bed_assignments'\) <> v_guests/);
  assert.match(createBooking, /select distinct bed_id from unnest\(v_bed_ids\)/);
  assert.match(createBooking, /Every guest in a room must have the same known gender/);
  assert.match(createBooking, /'unknown' = any\(v_genders\)/);
  assert.match(createBooking, /a\.guest_gender <> all\(v_genders\)/);
  assert.match(createBooking, /pg_advisory_xact_lock\(hashtextextended\(v_room_id, 0\)\)/);
  assert.match(updateBooking, /pg_advisory_xact_lock\(hashtextextended\(v_lock_room, 0\)\)/);
  assert.match(updateBooking, /Every guest in a room must have an assigned bed and the same known gender/);
  assert.match(updateBooking, /An overlapping reservation has unresolved gender details/);
  assert.match(updateBooking, /a\.guest_gender <> all\(v_genders\)/);
  assert.match(updateBooking, /b\.check_in < v_check_out and b\.check_out > v_check_in/);
  assert.match(closureGuard, /pg_advisory_xact_lock\(hashtextextended\(v_lock_room, 0\)\)/);
  assert.match(closureGuard, /Room closure overlaps an active reservation/);
  assert.match(migration, /revoke all on function public\.create_staff_booking\(jsonb\) from public, anon, authenticated/);
});

test("staff reassignment and concurrent operations enforce room-wide gender policy", () => {
  const migration = fs.readFileSync(
    path.join(root, "supabase/staff_booking_workflow_migration.sql"),
    "utf8"
  );
  const updateStart = migration.indexOf("create or replace function public.update_staff_bed_booking(");
  const updateEnd = migration.indexOf("revoke all on function public.update_staff_bed_booking", updateStart);
  const updateBooking = migration.slice(updateStart, updateEnd);

  assert.match(updateBooking, /for v_lock_room in select distinct x from unnest\(array\[v_old\.room_id, v_room_id\]\) x order by x/);
  assert.match(updateBooking, /v_room_id is distinct from v_old\.room_id/);
  assert.match(updateBooking, /v_has_new_assignments/);
  assert.match(updateBooking, /bed_gender_review_required = case/);
  assert.match(migration, /create or replace function public\.create_staff_bed_booking/);
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(v_room_id, 0\)\)/);
});

test("public booking submissions remain closed and the preview feed remains opt-in", () => {
  const bookingRoute = fs.readFileSync(
    path.join(root, "src/app/api/booking/route.ts"),
    "utf8"
  );
  const previewRoute = fs.readFileSync(
    path.join(root, "src/app/api/bed-availability/route.ts"),
    "utf8"
  );
  assert.match(bookingRoute, /status: 410/);
  assert.match(previewRoute, /process\.env\.BED_AVAILABILITY_PREVIEW !== "true"/);
});
