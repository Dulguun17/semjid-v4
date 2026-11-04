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

const {
  buildDashboardCsv,
  percentComparison,
  resolveReportRanges,
  ulaanbaatarDate,
} = loadTypeScript("src/lib/ceo-report.ts");

test("daily, monthly, and annual ranges use calendar dates and matching previous lengths", () => {
  const daily = resolveReportRanges("day", "2024-03-01", null, null, "2024-12-31");
  assert.deepEqual(daily, {
    startDate: "2024-03-01",
    endDate: "2024-03-01",
    previousStartDate: "2024-02-29",
    previousEndDate: "2024-02-29",
  });

  const month = resolveReportRanges("month", "2024-03-15", null, null, "2024-12-31");
  assert.equal(month.startDate, "2024-03-01");
  assert.equal(month.endDate, "2024-03-31");
  assert.equal(month.previousStartDate, "2024-01-30");
  assert.equal(month.previousEndDate, "2024-02-29");

  const year = resolveReportRanges("year", "2024-06-01", null, null, "2024-12-31");
  assert.equal(year.startDate, "2024-01-01");
  assert.equal(year.endDate, "2024-12-31");
  assert.equal(year.previousStartDate, "2022-12-31");
  assert.equal(year.previousEndDate, "2023-12-31");
});

test("current month/year ranges stop today and custom ranges validate duration and future dates", () => {
  const month = resolveReportRanges("month", "2026-11-01", null, null, "2026-11-03");
  assert.equal(month.endDate, "2026-11-03");
  assert.equal(month.previousStartDate, "2026-10-29");
  assert.equal(month.previousEndDate, "2026-10-31");

  const year = resolveReportRanges("year", "2026-01-01", null, null, "2026-11-03");
  assert.equal(year.endDate, "2026-11-03");
  assert.equal(year.previousStartDate, "2025-02-28");

  assert.throws(
    () => resolveReportRanges("custom", null, "2025-01-01", "2026-01-02", "2026-12-31"),
    /366 calendar days/
  );
  assert.throws(
    () => resolveReportRanges("custom", null, "2026-11-04", "2026-11-05", "2026-11-03"),
    /Future report dates/
  );
  assert.throws(
    () => resolveReportRanges("custom", null, "2026-02-30", "2026-03-01", "2026-12-31"),
    /valid YYYY-MM-DD/
  );
});

test("period boundaries use Ulaanbaatar local dates rather than UTC dates", () => {
  assert.equal(ulaanbaatarDate(new Date("2026-11-02T15:59:59.000Z")), "2026-11-02");
  assert.equal(ulaanbaatarDate(new Date("2026-11-02T16:00:00.000Z")), "2026-11-03");
  const ranges = resolveReportRanges("day", "2026-11-03", null, null, "2026-11-03");
  assert.equal(ranges.startDate, "2026-11-03");
});

test("comparisons explain zero baselines without dividing by zero", () => {
  assert.equal(percentComparison("0", "0"), "0% (both periods are zero)");
  assert.equal(percentComparison("5", "0"), "New activity (previous period was zero)");
  assert.equal(percentComparison("125", "100"), "+25.0%");
  assert.equal(percentComparison("75", "100"), "-25.0%");
  assert.equal(percentComparison("100", "100"), "0.0%");
});

test("CSV report repeats dashboard totals, period filters, trends, and omits client details", () => {
  const report = {
    period: {
      startDate: "2026-11-01",
      endDate: "2026-11-03",
      previousStartDate: "2026-10-29",
      previousEndDate: "2026-10-31",
    },
    current: {
      completed_payments: "100000",
      completed_refunds: "15000",
      net_received: "85000",
      cash_received: "60000",
      bank_received: "40000",
      booking_count: "2",
      booking_value: "250000",
      cancellations: "1",
      no_shows: "0",
      occupied_bed_nights: "3",
      eligible_bed_nights: "6",
    },
    previous: {
      completed_payments: "40000",
      completed_refunds: "0",
      net_received: "40000",
      cash_received: "40000",
      bank_received: "0",
      booking_count: "1",
      booking_value: "100000",
      cancellations: "0",
      no_shows: "1",
      occupied_bed_nights: "2",
      eligible_bed_nights: "6",
    },
    balances_as_of_now: {
      outstanding: "80000",
      overpayments: "10000",
      covered_bookings: "1",
      unknown_bookings: "5",
    },
    income_trend: [{
      date: "2026-11-02",
      payments: "100000",
      refunds: "15000",
      net_received: "85000",
      cash_received: "60000",
      bank_received: "40000",
    }],
    data_quality: {
      incomplete_legacy_allocations: "0",
      previous_incomplete_legacy_allocations: "0",
      status_history_since: "2026-10-01T00:00:00Z",
      status_history_incomplete: false,
      payment_history_since: "2026-10-01T00:00:00Z",
      payment_history_incomplete: false,
      balance_coverage_complete: false,
    },
    online_payment_status: "not_connected",
  };
  const csv = buildDashboardCsv(report);
  assert.match(csv, /"2026-11-01","2026-11-03"/);
  assert.match(csv, /"Completed payments received \(MNT\)","100000","40000"/);
  assert.match(csv, /"Completed refunds returned \(MNT\)","15000","0"/);
  assert.match(csv, /"Net cash received \(MNT\)","85000","40000"/);
  assert.match(csv, /"2026-11-02","100000","15000","85000","60000","40000"/);
  assert.match(csv, /Not connected/);
  assert.doesNotMatch(csv, /fname|phone|booking reference|John Doe/i);
});

test("CEO aggregate RPC is role-gated, private-row-free, and uses receipt/status dates and bed-nights", () => {
  const migration = fs.readFileSync(
    path.join(root, "supabase/ceo_business_dashboard_migration.sql"),
    "utf8"
  );
  const start = migration.indexOf("create or replace function public.get_ceo_business_dashboard(");
  const end = migration.indexOf("revoke all on function public.get_ceo_business_dashboard", start);
  const rpc = migration.slice(start, end);

  assert.match(rpc, /has_workspace_role\(array\['ceo'\]\)/);
  assert.match(rpc, /r\.received_on between p\.start_date and p\.end_date/);
  assert.match(rpc, /booking_status_events/);
  assert.match(rpc, /Asia\/Ulaanbaatar/);
  assert.match(rpc, /occupied_bed_nights/);
  assert.match(rpc, /eligible_bed_nights/);
  assert.match(rpc, /bed_allocation_required/);
  assert.match(rpc, /room_blocks/);
  assert.match(rpc, /payment_history_incomplete/);
  assert.match(rpc, /booking_payment_coverage/);
  assert.doesNotMatch(rpc, /'fname'|'lname'|'phone'|'email'|'reference'|'note'|'booking_id'\s*,/);
  assert.match(migration, /revoke all on public\.booking_status_events, public\.ceo_report_config/);
  assert.match(migration, /revoke all on public\.booking_payment_coverage/);
});

test("CEO endpoint rejects non-CEO access and has no write handlers or raw-table reads", () => {
  const route = fs.readFileSync(
    path.join(root, "src/app/api/ceo/business-dashboard/route.ts"),
    "utf8"
  );
  assert.match(route, /roles: \["ceo"\]/);
  assert.match(route, /get_ceo_business_dashboard/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.doesNotMatch(route, /export async function (POST|PATCH|DELETE)/);
  assert.doesNotMatch(route, /\.from\(["'](bookings|booking_payment_records)["']\)/);
});

test("synthetic receipts are attributed to completion dates, not original payment dates", () => {
  const entries = [
    { kind: "payment", status: "completed", method: "bank_transfer", received_on: "2026-10-31", amount: 80_000 },
    { kind: "refund", status: "completed", method: "bank_transfer", received_on: "2026-11-02", amount: 20_000 },
    { kind: "payment", status: "pending", method: "bank_transfer", received_on: null, amount: 50_000 },
    { kind: "refund", status: "requested", method: "cash", received_on: null, amount: 10_000 },
  ];
  const summarize = (start, end) => {
    const received = entries.filter(row =>
      row.status === "completed" && row.kind === "payment" &&
      row.received_on >= start && row.received_on <= end
    ).reduce((sum, row) => sum + row.amount, 0);
    const refunded = entries.filter(row =>
      row.status === "completed" && row.kind === "refund" &&
      row.received_on >= start && row.received_on <= end
    ).reduce((sum, row) => sum + row.amount, 0);
    return { received, refunded, net: received - refunded };
  };
  assert.deepEqual(summarize("2026-11-01", "2026-11-03"), {
    received: 0,
    refunded: 20_000,
    net: -20_000,
  });
  assert.deepEqual(summarize("2026-10-29", "2026-10-31"), {
    received: 80_000,
    refunded: 0,
    net: 80_000,
  });
});

test("synthetic occupancy excludes room closures and incomplete legacy room capacity", () => {
  const beds = [
    { id: "A1", room: "A" },
    { id: "A2", room: "A" },
    { id: "B1", room: "B" },
  ];
  const dates = ["2026-11-02", "2026-11-03"];
  const closed = new Set(["B:2026-11-02"]);
  const legacyRoomByDate = new Map([["A:2026-11-03", true]]);
  const occupied = new Set(["A1:2026-11-02", "B1:2026-11-03"]);
  let eligibleBedNights = 0;
  let occupiedBedNights = 0;
  for (const date of dates) {
    for (const bed of beds) {
      if (closed.has(`${bed.room}:${date}`) || legacyRoomByDate.has(`${bed.room}:${date}`)) continue;
      eligibleBedNights += 1;
      if (occupied.has(`${bed.id}:${date}`)) occupiedBedNights += 1;
    }
  }
  assert.equal(eligibleBedNights, 3);
  assert.equal(occupiedBedNights, 2);
  assert.equal(occupiedBedNights / eligibleBedNights, 2 / 3);
});
