import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server");

function load(relativePath, overrides = {}) {
  const source = fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(name => {
    if (name in overrides) return overrides[name];
    if (name === "./booking-rules") return load("src/lib/booking-rules.ts");
    return require(name);
  }, loaded, loaded.exports);
  return loaded.exports;
}

test("summary selections reject duplicate beds and malformed dates", () => {
  const { parseCustomerBedSelection } = load("src/lib/customer-booking.ts");
  const selection = { roomId: "test-room", checkIn: "2026-12-01", checkOut: "2026-12-08", bedIds: ["B2", "B1"], gender: "female" };
  assert.deepEqual(parseCustomerBedSelection(selection).bedIds, ["B1", "B2"]);
  assert.throws(() => parseCustomerBedSelection({ ...selection, bedIds: ["B1", "B1"] }));
  assert.throws(() => parseCustomerBedSelection({ ...selection, checkIn: "2026-02-30" }));
  assert.throws(() => parseCustomerBedSelection({ ...selection, gender: "unknown" }));
});

test("sign-in redirects stay within this site", () => {
  const { safeInternalRedirect } = load("src/lib/auth-navigation.ts");
  for (const value of ["javascript:alert(1)", "https://example.test", "//example.test", "/\\example.test", "/\nexample.test"]) assert.equal(safeInternalRedirect(value), "/profile");
  assert.equal(safeInternalRedirect("/booking/summary?roomId=test-room"), "/booking/summary?roomId=test-room");
});

function bookingsRoute({ allowed = true, completeHistory = true, failPayments = false } = {}) {
  const readScopes = [];
  const records = [
    { booking_id: "owned", kind: "payment", status: "completed", amount: 25000, method: "cash", received_on: "2026-11-04", reference: "private-reference" },
    { booking_id: "owned", kind: "payment", status: "completed", amount: 15000, method: "bank_transfer", received_on: "2026-11-04" },
    { booking_id: "owned", kind: "payment", status: "pending", amount: 20000, method: "bank_transfer", received_on: null },
  ];
  const admin = { from: name => ({ select: () => ({ in: async (field, ids) => {
    readScopes.push({ name, field, ids });
    return { data: name === "booking_payment_records" ? records : name === "booking_payment_coverage" ? (completeHistory ? [{ booking_id: "owned" }] : []) : [{ booking_id: "owned", bed_id: "test-bed", released_at: null }], error: failPayments && name === "booking_payment_records" ? { code: "unavailable" } : null };
  } }) }) };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "signed-in-customer" } }, error: null }) },
    from: name => ({ select: () => ({ eq: (field, id) => {
      assert.equal(name, "bookings"); assert.equal(field, "customer_user_id"); assert.equal(id, "signed-in-customer");
      return { order: async () => ({ data: [{ id: "owned", ref: "TEST", room_id: "test-room", total: 100000, status: "confirmed" }], error: null }) };
    } }) }),
  };
  const route = load("src/app/api/customer/bookings/route.ts", {
    "@/lib/workspace-auth": {
      requireWorkspaceAccess: async (_request, options) => { assert.deepEqual(options, { roles: ["customer"] }); return allowed ? { allowed: true } : { allowed: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) }; },
      createWorkspaceUserClient: () => client,
    },
    "@/lib/supabase-admin": { getSupabaseAdmin: () => admin },
    "@/lib/payment-ledger": load("src/lib/payment-ledger.ts"),
  });
  return { route, readScopes };
}

const request = () => new Request("http://localhost/api/customer/bookings?customer_user_id=forged", { headers: { Authorization: "Bearer synthetic-token" } });

test("My Bookings scopes privileged reads to owned IDs and reports verified split receipts", async () => {
  const { route, readScopes } = bookingsRoute();
  const response = await route.GET(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  const data = await response.json();
  assert.equal(data.bookings[0].financials.netReceived, "40000");
  assert.equal(data.bookings[0].financials.remainingBalance, "60000");
  assert.equal(data.bookings[0].financials.pendingPayments, "20000");
  assert.equal(JSON.stringify(data).includes("private-reference"), false);
  for (const scope of readScopes) assert.deepEqual(scope.ids, ["owned"]);
});

test("missing historical coverage gives an unknown balance and failed ledger reads give an error", async () => {
  const incomplete = await bookingsRoute({ completeHistory: false }).route.GET(request());
  assert.equal((await incomplete.json()).bookings[0].financials.remainingBalance, null);
  const failed = await bookingsRoute({ failPayments: true }).route.GET(request());
  assert.equal(failed.status, 503);
});

test("non-customers cannot read My Bookings or reach the privileged reads", async () => {
  const { route, readScopes } = bookingsRoute({ allowed: false });
  assert.equal((await route.GET(request())).status, 403);
  assert.deepEqual(readScopes, []);
});

test("production booking stays gated even when the local test flag is set", async () => {
  const previousMode = process.env.NODE_ENV;
  const previousFlag = process.env.CUSTOMER_BOOKING_TEST_ENABLED;
  process.env.NODE_ENV = "production";
  process.env.CUSTOMER_BOOKING_TEST_ENABLED = "true";
  const unavailable = () => { throw new Error("Gated request must not reach authentication or database calls"); };
  try {
    const overrides = {
      "@/lib/workspace-auth": { requireWorkspaceAccess: unavailable, createWorkspaceUserClient: unavailable },
      "@/lib/customer-booking": load("src/lib/customer-booking.ts"),
      "@/lib/supabase-admin": { getSupabaseAdmin: unavailable },
      "@/lib/booking-rules": load("src/lib/booking-rules.ts"),
      "@/lib/bed-availability": { ulaanbaatarToday: unavailable },
    };
    for (const path of ["src/app/api/booking/route.ts", "src/app/api/customer/booking-summary/route.ts"]) {
      assert.equal((await load(path, overrides).POST(new Request("http://localhost/api/booking", { method: "POST" }))).status, 410);
    }
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
    if (previousFlag === undefined) delete process.env.CUSTOMER_BOOKING_TEST_ENABLED; else process.env.CUSTOMER_BOOKING_TEST_ENABLED = previousFlag;
  }
});
