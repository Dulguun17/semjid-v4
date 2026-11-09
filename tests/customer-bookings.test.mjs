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

function enableCustomerBookingTest(context) {
  const previousMode = process.env.NODE_ENV;
  const previousFlag = process.env.CUSTOMER_BOOKING_TEST_ENABLED;
  process.env.NODE_ENV = "test";
  process.env.CUSTOMER_BOOKING_TEST_ENABLED = "true";
  context.after(() => {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    if (previousFlag === undefined) delete process.env.CUSTOMER_BOOKING_TEST_ENABLED;
    else process.env.CUSTOMER_BOOKING_TEST_ENABLED = previousFlag;
  });
}

const bookingInput = {
  roomId: "test-room",
  checkIn: "2026-12-01",
  checkOut: "2026-12-08",
  bedIds: ["B2", "B1"],
  gender: "female",
  firstName: " Synthetic ",
  lastName: " Customer ",
  phone: " 00000000 ",
  payment: "bank",
  requestId: "00000000-0000-4000-8000-000000000001",
  expectedTotal: "14000",
};

function customerBookingRoute({ allowed = true, rpcError = null, bookingId = "synthetic-booking" } = {}) {
  const calls = [];
  const route = load("src/app/api/booking/route.ts", {
    "@/lib/customer-booking": load("src/lib/customer-booking.ts"),
    "@/lib/workspace-auth": {
      requireWorkspaceAccess: async (_request, options) => {
        assert.deepEqual(options, { roles: ["customer"] });
        return allowed
          ? { allowed: true }
          : { allowed: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
      },
      createWorkspaceUserClient: request => {
        assert.equal(request.headers.get("Authorization"), "Bearer synthetic-token");
        return {
          rpc: async (name, args) => {
            calls.push({ name, args });
            return {
              error: rpcError,
              data: {
                id: bookingId,
                ref: "SYNTHETIC-REQUEST",
                room_id: "test-room",
                check_in: bookingInput.checkIn,
                check_out: bookingInput.checkOut,
                total: "14000",
                status: "pending",
                expires_at: "2026-12-02T00:00:00Z",
                phone: "private-synthetic-contact",
                customer_user_id: "private-synthetic-owner",
              },
            };
          },
        };
      },
    },
  });
  return { route, calls };
}

function bookingRequest(input = bookingInput) {
  return new Request("http://localhost/api/booking", {
    method: "POST",
    headers: { Authorization: "Bearer synthetic-token", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

test("booking retries preserve the request ID and leave ownership and pricing to the authenticated RPC", async context => {
  enableCustomerBookingTest(context);
  const { route, calls } = customerBookingRoute();
  const forgedInput = {
    ...bookingInput,
    ownerId: "forged-owner",
    customer_user_id: "forged-owner",
    total: "1",
    guests: 99,
    status: "confirmed",
    source: "walk_in",
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await route.POST(bookingRequest(forgedInput));
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    const result = await response.json();
    assert.equal(result.booking.total, "14000");
    assert.equal(result.booking.status, "pending");
    assert.equal(JSON.stringify(result).includes("private-synthetic"), false);
  }
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls[0], {
    name: "create_customer_bed_booking",
    args: {
      p_request_id: bookingInput.requestId,
      p_expected_total: "14000",
      p_booking: {
        fname: "Synthetic",
        lname: "Customer",
        phone: "00000000",
        room_id: "test-room",
        check_in: bookingInput.checkIn,
        check_out: bookingInput.checkOut,
        guests: 2,
        payment: "bank",
        bed_assignments: [
          { bed_id: "B1", guest_gender: "female" },
          { bed_id: "B2", guest_gender: "female" },
        ],
      },
    },
  });
});

test("unauthorized and malformed booking submissions never reach the booking RPC", async context => {
  enableCustomerBookingTest(context);
  const denied = customerBookingRoute({ allowed: false });
  assert.equal((await denied.route.POST(bookingRequest())).status, 403);
  assert.deepEqual(denied.calls, []);
  const invalid = customerBookingRoute();
  for (const input of [
    { ...bookingInput, expectedTotal: 14000 },
    { ...bookingInput, requestId: "invalid" },
    { ...bookingInput, payment: "qpay" },
    { ...bookingInput, bedIds: ["B1", "B1"] },
  ]) {
    assert.equal((await invalid.route.POST(bookingRequest(input))).status, 400);
  }
  assert.deepEqual(invalid.calls, []);
});

test("booking conflicts and uncertain database responses return safe errors without a fabricated receipt", async context => {
  enableCustomerBookingTest(context);
  for (const [code, status] of [["42501", 403], ["23505", 409], ["23P01", 409], ["22023", 400], ["XX000", 503]]) {
    const { route } = customerBookingRoute({ rpcError: { code, message: "private-synthetic-database-detail" } });
    const response = await route.POST(bookingRequest());
    const result = await response.json();
    assert.equal(response.status, status);
    assert.equal(result.booking, undefined);
    assert.equal(JSON.stringify(result).includes("private-synthetic"), false);
  }
  const missing = await customerBookingRoute({ bookingId: null }).route.POST(bookingRequest());
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).booking, undefined);
});
