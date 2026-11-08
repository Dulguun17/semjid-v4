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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    specifier => nodeRequire(specifier),
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const { calculateBookingFinancials, formatMntAmount } = loadTypeScript("src/lib/payment-ledger.ts");
const { readReceptionPaymentAttempt, receptionPaymentStorageKey } = loadTypeScript("src/lib/reception-payment.ts");

test("an interrupted reception payment restores the exact request and idempotency key after reload", () => {
  const request = {
    booking_id: "synthetic-walk-in", kind: "payment", amount: "25000", method: "cash",
    status: "completed", received_on: "2026-11-04", verified: false,
    reference: null, note: null, reason: null, idempotency_key: "synthetic-request-key",
  };
  const values = new Map([[receptionPaymentStorageKey(request.booking_id), JSON.stringify(request)]]);
  const storage = { getItem: key => values.get(key) ?? null };
  assert.deepEqual(readReceptionPaymentAttempt(storage, request.booking_id), request);
  assert.equal(readReceptionPaymentAttempt(storage, "another-booking"), null);
  values.set(receptionPaymentStorageKey("another-booking"), JSON.stringify(request));
  assert.throws(() => readReceptionPaymentAttempt(storage, "another-booking"));
});

test("deposits and multiple completed payments calculate precise balance", () => {
  const values = calculateBookingFinancials(100_000, [
    { kind: "payment", status: "completed", amount: "25000" },
    { kind: "payment", status: "completed", amount: "12500" },
  ]);
  assert.deepEqual(values, {
    agreedPrice: "100000",
    completedPayments: "37500",
    completedRefunds: "0",
    netReceived: "37500",
    remainingBalance: "62500",
    overpayment: "0",
    pendingPayments: "0",
    requestedRefunds: "0",
    paymentState: "partial",
  });
});

test("pending payments and requested refunds do not count as completed money movement", () => {
  const values = calculateBookingFinancials("100000", [
    { kind: "payment", status: "pending", amount: "20000" },
    { kind: "refund", status: "requested", amount: "5000" },
  ]);
  assert.equal(values.completedPayments, "0");
  assert.equal(values.netReceived, "0");
  assert.equal(values.pendingPayments, "20000");
  assert.equal(values.requestedRefunds, "5000");
  assert.equal(values.paymentState, "unrecorded");
});

test("partial and complete refunds change net received only when completed", () => {
  const values = calculateBookingFinancials(100_000, [
    { kind: "payment", status: "completed", amount: "70000" },
    { kind: "refund", status: "requested", amount: "20000" },
    { kind: "refund", status: "completed", amount: "10000" },
  ]);
  assert.equal(values.completedPayments, "70000");
  assert.equal(values.completedRefunds, "10000");
  assert.equal(values.netReceived, "60000");
  assert.equal(values.remainingBalance, "40000");
  assert.equal(values.requestedRefunds, "20000");
});

test("overpayments are distinct from remaining balance and use exact integer units", () => {
  const values = calculateBookingFinancials(100_000, [
    { kind: "payment", status: "completed", amount: "9007199254740993" },
    { kind: "payment", status: "completed", amount: "7" },
  ]);
  assert.equal(values.netReceived, "9007199254741000");
  assert.equal(values.remainingBalance, "0");
  assert.equal(values.overpayment, "9007199254641000");
  assert.equal(formatMntAmount("9007199254740993"), "9,007,199,254,740,993 ₮");
});

test("payment migration preserves unknown history and enforces actor, idempotency, and manager boundaries", () => {
  const migration = fs.readFileSync(path.join(root, "supabase/payment_records_migration.sql"), "utf8");
  assert.match(migration, /create table if not exists public\.booking_payment_records/);
  assert.match(migration, /idempotency_key text not null unique/);
  assert.match(migration, /v_existing\.status = p_status/);
  assert.match(migration, /v_existing\.reference is not distinct from nullif\(trim\(p_reference\), ''\)/);
  assert.match(migration, /created_by uuid references auth\.users/);
  assert.match(migration, /verified_by uuid references auth\.users/);
  assert.match(migration, /payment_record_id uuid not null references public\.booking_payment_records\(id\) on delete restrict/);
  assert.match(migration, /revoke all on public\.booking_payment_records from public, anon, authenticated/);
  assert.match(migration, /p_action in \('complete_refund','void'\) and not public\.is_workspace_manager\(\)/);
  assert.match(migration, /Refunds must be requested with a reason/);
  assert.match(migration, /refund request exceeds the amount received/i);
  assert.match(migration, /from public\.bookings where id = p_booking_id for update/);
  assert.doesNotMatch(migration, /update public\.bookings\s+set payment_status/);
  assert.doesNotMatch(migration, /insert into public\.booking_payment_records[\s\S]{0,300}select[\s\S]{0,100}bookings/);
});

test("payment endpoint requires staff and manager-gates refunds and corrections", () => {
  const route = fs.readFileSync(path.join(root, "src/app/api/staff/payments/route.ts"), "utf8");
  const workflow = fs.readFileSync(path.join(root, "supabase/staff_booking_workflow_migration.sql"), "utf8");
  assert.equal((route.match(/roles: \["staff"\]/g) || []).length, 3);
  assert.match(route, /managerOnly: managerAction/);
  assert.match(route, /idempotency_key/);
  assert.match(route, /record_staff_payment/);
  assert.match(route, /update_staff_payment_record/);
  assert.match(workflow, /Manager access required for booking price adjustments/);
});

test("unfinished QPay endpoint is closed and public booking still returns gone", () => {
  const qpayRoute = fs.readFileSync(path.join(root, "src/app/api/payment/qpay-qr/route.ts"), "utf8");
  const bookingRoute = fs.readFileSync(path.join(root, "src/app/api/booking/route.ts"), "utf8");
  const bookingPage = fs.readFileSync(path.join(root, "src/components/sections/BookingPageContent.tsx"), "utf8");
  assert.match(qpayRoute, /status: 410/);
  assert.match(qpayRoute, /not connected/i);
  assert.doesNotMatch(qpayRoute, /generateQPay|qr_data|success:\s*true/);
  assert.match(bookingRoute, /status: 410/);
  assert.match(bookingPage, /Do not send an online payment/);
  assert.match(bookingPage, /currently closed/i);
  assert.doesNotMatch(bookingPage, /08 0005 00 557333756/);
  assert.doesNotMatch(bookingPage, /Booking successful|setDone\(true\)|fetch\("\/api\/booking"/);
});
