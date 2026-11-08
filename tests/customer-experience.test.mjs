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
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    specifier => nodeRequire(specifier),
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const {
  createBookingNotificationTemplates,
  createLocalCaptureTransport,
  renderCustomerBookingNotice,
} = loadTypeScript("src/lib/email.ts");

const booking = {
  reference: "TEST-REF",
  firstName: "<Guest>",
  lastName: "Example",
  email: "guest@example.test",
  phone: "+976-0000",
  room: "101",
  checkIn: "2026-12-01",
  checkOut: "2026-12-08",
  guests: 1,
  agreedPrice: 100_000,
};

test("booking notice templates state pending status, reception payment, and escape customer input", () => {
  const english = renderCustomerBookingNotice(booking);
  const mongolian = renderCustomerBookingNotice({ ...booking, lang: "mn" });
  assert.match(english, /request receipt only/i);
  assert.match(english, /not confirmed/i);
  assert.match(english, /online payment is unavailable/i);
  assert.match(english, /bank transfer verified by staff/i);
  assert.match(english, /cancellation and refund terms/i);
  assert.match(english, /&lt;Guest&gt;/);
  assert.doesNotMatch(english, /<Guest>/);
  assert.match(mongolian, /хүлээн авсан мэдэгдэл/);
  assert.match(mongolian, /баталгаажаагүй/);
});

test("booking notices use an explicit local capture transport and never send externally", async () => {
  const capture = createLocalCaptureTransport();
  const notifications = createBookingNotificationTemplates(capture.send);
  await notifications.sendCustomerNotice(booking);
  await notifications.sendStaffNotice(booking, "staff@example.test");
  await notifications.sendChatNotice("staff@example.test", "<Guest>", "<script>alert(1)</script>");

  const messages = capture.getMessages();
  assert.equal(messages.length, 3);
  assert.equal(messages[0].to, booking.email);
  assert.match(messages[0].subject, /pending/i);
  assert.equal(messages[1].to, "staff@example.test");
  assert.match(messages[2].html, /&lt;script&gt;/);
  assert.doesNotMatch(messages[2].html, /<script>/);
});

test("customer booking access uses authenticated ownership and never email matching", () => {
  const profile = fs.readFileSync(path.join(root, "src/app/profile/page.tsx"), "utf8");
  const bookingsRoute = fs.readFileSync(path.join(root, "src/app/api/customer/bookings/route.ts"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/customer_booking_ownership_migration.sql"), "utf8");
  const bookingRoute = fs.readFileSync(path.join(root, "src/app/api/booking/route.ts"), "utf8");
  const previewRoute = fs.readFileSync(path.join(root, "src/app/api/bed-availability/route.ts"), "utf8");

  assert.match(bookingsRoute, /\.eq\("customer_user_id", auth.user.id\)/);
  assert.match(profile, /\/api\/customer\/bookings/);
  assert.match(profile, /loadCustomerData\(\(\) => active\)/);
  assert.doesNotMatch(profile, /\.eq\("email"/);
  assert.match(migration, /customer_user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /public\.has_workspace_role\(array\['customer'\]\)/);
  assert.match(migration, /public\.is_workspace_manager\(\)/);
  assert.match(migration, /booking_customer_link_audit/);
  assert.match(migration, /on delete set null/);
  assert.match(bookingRoute, /410/);
  assert.match(previewRoute, /NODE_ENV === "production"/);
  assert.match(previewRoute, /BED_AVAILABILITY_PREVIEW !== "true"/);
});

test("private booking feedback requires owned checked-out stays and stays separate from public reviews", () => {
  const migration = fs.readFileSync(path.join(root, "supabase/customer_booking_feedback_migration.sql"), "utf8");
  const route = fs.readFileSync(path.join(root, "src/app/api/customer/feedback/route.ts"), "utf8");
  const profile = fs.readFileSync(path.join(root, "src/app/profile/page.tsx"), "utf8");
  const linkRoute = fs.readFileSync(path.join(root, "src/app/api/staff/bookings/link-customer/route.ts"), "utf8");

  assert.match(migration, /unique \(booking_id\)/);
  assert.match(migration, /room_rating integer not null check \(room_rating between 1 and 5\)/);
  assert.match(migration, /service_rating integer not null check \(service_rating between 1 and 5\)/);
  assert.match(migration, /b\.customer_user_id = v_customer_user_id/);
  assert.match(migration, /b\.status = 'checked_out'/);
  assert.match(migration, /security definer/);
  assert.match(migration, /revoke all on public\.booking_feedback from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.booking_feedback to authenticated/);
  assert.match(migration, /booking_feedback_one_per_booking/);
  assert.doesNotMatch(migration, /public\.reviews/);

  assert.match(route, /requireWorkspaceAccess\(request, \{ roles: \["customer"\] \}\)/);
  assert.match(route, /submit_customer_booking_feedback/);
  assert.match(route, /roomRating/);
  assert.match(route, /serviceRating/);
  assert.doesNotMatch(route, /customer_user_id/);
  assert.match(profile, /"checked_out"/);
  assert.match(profile, /My Feedback/);
  assert.match(profile, /Миний сэтгэгдэл/);
  assert.match(profile, /Rate your stay/);
  assert.match(profile, /Буудлаа үнэлэх/);
  assert.match(profile, /\/api\/customer\/feedback/);

  assert.match(linkRoute, /managerOnly: true/);
  assert.match(linkRoute, /identityVerified !== true/);
  assert.match(linkRoute, /link_booking_to_customer/);
  assert.match(linkRoute, /p_reason: reason/);
});

test("customer booking UI discloses closure, unavailable QPay, and unresolved terms in both languages", () => {
  const bookingPage = fs.readFileSync(path.join(root, "src/components/sections/BookingPageContent.tsx"), "utf8");
  const previewPage = fs.readFileSync(path.join(root, "src/app/rooms/availability/page.tsx"), "utf8");

  for (const phrase of ["currently closed", "баталгаажуулах боломжгүй", "QPay", "cancellation and refund terms", "Цуцлалт, буцаалтын нөхцөл"]) {
    assert.ok(bookingPage.toLowerCase().includes(phrase.toLowerCase()) || previewPage.toLowerCase().includes(phrase.toLowerCase()), `Missing customer notice: ${phrase}`);
  }
  assert.match(previewPage, /aria-checked=\{selected\}/);
  assert.match(previewPage, /allocation_required/);
  assert.match(previewPage, /occupant_gender/);
  assert.match(previewPage, /bedStateLabel/);
});
