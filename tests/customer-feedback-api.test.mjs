import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server");
const bookingId = "00000000-0000-4000-8000-000000000001";

function loadRoute({ allowed = true, data = {}, error = null } = {}) {
  const calls = [];
  const source = fs.readFileSync(new URL("../src/app/api/customer/feedback/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = { exports: {} };
  const client = {
    rpc: async (name, input) => {
      calls.push({ name, input });
      return { data, error };
    },
  };
  new Function("require", "module", "exports", compiled)(specifier => {
    if (specifier === "@/lib/workspace-auth") return {
      requireWorkspaceAccess: async (_request, options) => {
        assert.deepEqual(options, { roles: ["customer"] });
        return allowed
          ? { allowed: true, role: "customer", isManager: false }
          : { allowed: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
      },
      createWorkspaceUserClient: () => client,
    };
    return require(specifier);
  }, loadedModule, loadedModule.exports);
  return { route: loadedModule.exports, calls };
}

function request(body) {
  return new Request("http://localhost/api/customer/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("feedback reads and writes stop at the customer access guard", async () => {
  const { route, calls } = loadRoute({ allowed: false });
  assert.equal((await route.GET(new Request("http://localhost/api/customer/feedback"))).status, 403);
  assert.equal((await route.POST(request({}))).status, 403);
  assert.deepEqual(calls, []);
});

test("feedback rejects invalid ratings and oversized comments before the RPC", async () => {
  const { route, calls } = loadRoute();
  for (const patch of [
    { roomRating: 0 }, { roomRating: 1.5 }, { serviceRating: 6 },
    { serviceRating: "5" }, { comment: {} }, { comment: "x".repeat(2001) },
    { bookingId: "unknown" },
  ]) {
    const response = await route.POST(request({ bookingId, roomRating: 5, serviceRating: 4, ...patch }));
    assert.equal(response.status, 400);
  }
  assert.deepEqual(calls, []);
});

test("feedback uses database ownership and returns only the customer-facing fields", async () => {
  const saved = {
    id: "synthetic-feedback", booking_id: bookingId, room_id: "test-room",
    check_in: "2026-10-01", check_out: "2026-10-08", room_rating: 5,
    service_rating: 4, comment: "Synthetic feedback", submitted_at: "2026-10-08T08:00:00Z",
    customer_user_id: "must-not-be-returned", internal_field: "must-not-be-returned",
  };
  const { route, calls } = loadRoute({ data: saved });
  const response = await route.POST(request({
    bookingId, roomRating: 5, serviceRating: 4, comment: "  Synthetic feedback  ",
    customer_user_id: "forged-owner",
  }));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(calls, [{ name: "submit_customer_booking_feedback", input: {
    p_booking_id: bookingId, p_room_rating: 5, p_service_rating: 4, p_comment: "Synthetic feedback",
  } }]);
  const { feedback } = await response.json();
  assert.equal(feedback.room_rating, 5);
  assert.equal(feedback.service_rating, 4);
  assert.equal("customer_user_id" in feedback, false);
  assert.equal("internal_field" in feedback, false);
});

test("duplicate and ineligible stay errors are mapped without leaking database details", async () => {
  for (const [code, status] of [["23505", 409], ["42501", 403], ["22023", 400]]) {
    const { route } = loadRoute({ error: { code, message: "private database detail" } });
    const response = await route.POST(request({ bookingId, roomRating: 5, serviceRating: 4 }));
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /private database detail/);
  }
});
