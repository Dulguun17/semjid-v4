export type ReportPeriod = "day" | "month" | "year" | "custom";

export type ReportRanges = {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
};

function assertIsoDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) {
    throw new Error("Dates must be valid YYYY-MM-DD calendar dates.");
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dateDistance(start: string, end: string): number {
  return Math.round(
    (Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 86_400_000
  ) + 1;
}

export function ulaanbaatarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find(value => value.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function resolveReportRanges(
  period: ReportPeriod,
  date: string | null,
  customStart: string | null,
  customEnd: string | null,
  today = ulaanbaatarDate()
): ReportRanges {
  assertIsoDate(today);
  let startDate: string;
  let endDate: string;

  if (period === "custom") {
    if (!customStart || !customEnd) throw new Error("Both custom report dates are required.");
    assertIsoDate(customStart);
    assertIsoDate(customEnd);
    startDate = customStart;
    endDate = customEnd;
  } else {
    if (!date) throw new Error("A report date is required.");
    assertIsoDate(date);
    if (date > today) throw new Error("Future report dates are not available.");
    if (period === "day") {
      startDate = date;
      endDate = date;
    } else if (period === "month") {
      startDate = `${date.slice(0, 7)}-01`;
      const monthEnd = new Date(Date.UTC(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)),
        0
      )).toISOString().slice(0, 10);
      endDate = monthEnd > today ? today : monthEnd;
    } else if (period === "year") {
      startDate = `${date.slice(0, 4)}-01-01`;
      const yearEnd = `${date.slice(0, 4)}-12-31`;
      endDate = yearEnd > today ? today : yearEnd;
    } else {
      throw new Error("Unsupported report period.");
    }
  }

  if (startDate > endDate) throw new Error("Report start date must be on or before its end date.");
  if (endDate > today) throw new Error("Future report dates are not available.");
  const length = dateDistance(startDate, endDate);
  if (length > 366) throw new Error("Reports can cover up to 366 calendar days.");

  const previousEndDate = addDays(startDate, -1);
  const previousStartDate = addDays(previousEndDate, -(length - 1));
  return { startDate, endDate, previousStartDate, previousEndDate };
}

export function percentComparison(current: string | number, previous: string | number): string {
  const currentValue = BigInt(current);
  const previousValue = BigInt(previous);
  if (previousValue === BigInt(0)) {
    return currentValue === BigInt(0) ? "0% (both periods are zero)" : "New activity (previous period was zero)";
  }
  const delta = currentValue - previousValue;
  const magnitude = (delta < BigInt(0) ? -delta : delta) * BigInt(1000);
  const denominator = previousValue < BigInt(0) ? -previousValue : previousValue;
  const tenths = (magnitude + denominator / BigInt(2)) / denominator;
  return `${delta > BigInt(0) ? "+" : delta < BigInt(0) ? "-" : ""}${tenths / BigInt(10)}.${tenths % BigInt(10)}%`;
}

type DashboardTotals = {
  completed_payments: string;
  completed_refunds: string;
  net_received: string;
  cash_received: string;
  bank_received: string;
  booking_count: string;
  booking_value: string;
  cancellations: string;
  no_shows: string;
  occupied_bed_nights: string;
  eligible_bed_nights: string;
};

export type DashboardReport = {
  period: ReportRanges;
  current: DashboardTotals;
  previous: DashboardTotals;
  balances_as_of_now: {
    outstanding: string;
    overpayments: string;
    covered_bookings: string;
    unknown_bookings: string;
  };
  income_trend: Array<{
    date: string;
    payments: string;
    refunds: string;
    net_received: string;
    cash_received: string;
    bank_received: string;
  }>;
  data_quality: {
    incomplete_legacy_allocations: string;
    previous_incomplete_legacy_allocations: string;
    status_history_since: string;
    status_history_incomplete: boolean;
    payment_history_since: string;
    payment_history_incomplete: boolean;
    balance_coverage_complete: boolean;
  };
  online_payment_status: "not_connected";
};

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildDashboardCsv(report: DashboardReport): string {
  const rows: Array<Array<string | number>> = [
    ["CEO read-only business report"],
    ["Timezone", "Asia/Ulaanbaatar"],
    ["Selected period", report.period.startDate, report.period.endDate],
    ["Previous matching-length period", report.period.previousStartDate, report.period.previousEndDate],
    [],
    ["Period activity", "Selected period", "Previous period"],
    ["Completed payments received (MNT)", report.current.completed_payments, report.previous.completed_payments],
    ["Completed refunds returned (MNT)", report.current.completed_refunds, report.previous.completed_refunds],
    ["Net cash received (MNT)", report.current.net_received, report.previous.net_received],
    ["Cash received (MNT)", report.current.cash_received, report.previous.cash_received],
    ["Bank transfers received (MNT)", report.current.bank_received, report.previous.bank_received],
    ["Bookings created", report.current.booking_count, report.previous.booking_count],
    ["Booking value (not money received, MNT)", report.current.booking_value, report.previous.booking_value],
    ["Cancellation events", report.current.cancellations, report.previous.cancellations],
    ["No-show events", report.current.no_shows, report.previous.no_shows],
    ["Occupied bed-nights", report.current.occupied_bed_nights, report.previous.occupied_bed_nights],
    ["Eligible bed-nights", report.current.eligible_bed_nights, report.previous.eligible_bed_nights],
    [],
    ["Balances as of report download", "MNT", "Coverage"],
    ["Outstanding balance", report.balances_as_of_now.outstanding, "Covered bookings only"],
    ["Overpayments", report.balances_as_of_now.overpayments, "Covered bookings only"],
    ["Bookings with ledger coverage", report.balances_as_of_now.covered_bookings, ""],
    ["Bookings with unknown payment history", report.balances_as_of_now.unknown_bookings, ""],
    [],
    ["Income trend", "Completed payments (MNT)", "Completed refunds (MNT)", "Net received (MNT)", "Cash received (MNT)", "Bank received (MNT)"],
    ...report.income_trend.map(row => [
      row.date, row.payments, row.refunds, row.net_received, row.cash_received, row.bank_received,
    ]),
    [],
    ["Online payments", "Not connected"],
    ["Incomplete legacy bed allocations", report.data_quality.incomplete_legacy_allocations],
    ["Previous period incomplete legacy bed allocations", report.data_quality.previous_incomplete_legacy_allocations],
    ["Status history recorded since", report.data_quality.status_history_since],
    ["Status history incomplete for selected period", report.data_quality.status_history_incomplete ? "Yes" : "No"],
    ["Payment report coverage starts", report.data_quality.payment_history_since],
    ["Payment history incomplete for selected period", report.data_quality.payment_history_incomplete ? "Yes" : "No"],
    ["Balance coverage complete", report.data_quality.balance_coverage_complete ? "Yes" : "No"],
    ["Accounting note", "These are recorded money-received figures, not profit or accounting revenue."],
  ];
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}

export function groupTrendForChart(
  trend: DashboardReport["income_trend"],
  startDate: string,
  endDate: string
) {
  const dayCount = dateDistance(startDate, endDate);
  if (dayCount <= 31) {
    return trend.map(item => ({
      label: item.date.slice(5),
      key: item.date,
      payments: BigInt(item.payments),
      refunds: BigInt(item.refunds),
      net: BigInt(item.net_received),
    }));
  }
  const grouped = new Map<string, { payments: bigint; refunds: bigint; net: bigint }>();
  for (const item of trend) {
    const key = item.date.slice(0, 7);
    const value = grouped.get(key) || { payments: BigInt(0), refunds: BigInt(0), net: BigInt(0) };
    value.payments += BigInt(item.payments);
    value.refunds += BigInt(item.refunds);
    value.net += BigInt(item.net_received);
    grouped.set(key, value);
  }
  return [...grouped].map(([key, values]) => ({
    key,
    label: key,
    ...values,
  }));
}
