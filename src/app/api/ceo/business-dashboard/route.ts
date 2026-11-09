import { NextRequest, NextResponse } from "next/server";
import { resolveReportRanges, type ReportPeriod } from "@/lib/ceo-report";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

const periods = new Set<ReportPeriod>(["day", "month", "year", "custom"]);

export async function GET(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["ceo"] });
  if (!access.allowed) return access.response;

  const params = request.nextUrl.searchParams;
  const period = params.get("period") as ReportPeriod | null;
  if (!period || !periods.has(period)) {
    return NextResponse.json({ error: "Select a valid report period." }, { status: 400 });
  }

  let ranges;
  try {
    ranges = resolveReportRanges(
      period,
      params.get("date"),
      params.get("start"),
      params.get("end")
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report dates are invalid." },
      { status: 400 }
    );
  }

  try {
    const supabase = createWorkspaceUserClient(request);
    const { data, error } = await supabase.rpc("get_ceo_business_dashboard", {
      p_start_date: ranges.startDate,
      p_end_date: ranges.endDate,
      p_previous_start_date: ranges.previousStartDate,
      p_previous_end_date: ranges.previousEndDate,
    });
    if (error) {
      if (error.code === "42501") {
        return NextResponse.json({ error: "CEO access is required." }, { status: 403 });
      }
      if (error.code === "22023" || error.code?.startsWith("22")) {
        return NextResponse.json({ error: "The selected report dates are invalid." }, { status: 400 });
      }
      console.error("CEO dashboard aggregate query failed", error);
      return NextResponse.json({ error: "Business report is temporarily unavailable." }, { status: 503 });
    }
    if (!data || typeof data !== "object" || !("current" in data) || !("income_trend" in data)) {
      console.error("CEO dashboard RPC returned an invalid aggregate response.");
      return NextResponse.json({ error: "Business report returned incomplete data." }, { status: 503 });
    }
    const report = data as Record<string, unknown>;
    const period = report.period;
    if (!period || typeof period !== "object") {
      console.error("CEO dashboard RPC returned an invalid report period.");
      return NextResponse.json({ error: "Business report returned incomplete dates." }, { status: 503 });
    }
    const databasePeriod = period as Record<string, unknown>;
    if (
      typeof databasePeriod.start_date !== "string" ||
      typeof databasePeriod.end_date !== "string" ||
      typeof databasePeriod.previous_start_date !== "string" ||
      typeof databasePeriod.previous_end_date !== "string"
    ) {
      console.error("CEO dashboard RPC returned incomplete report dates.");
      return NextResponse.json({ error: "Business report returned incomplete dates." }, { status: 503 });
    }
    return NextResponse.json({
      report: {
        ...report,
        period: {
          startDate: databasePeriod.start_date,
          endDate: databasePeriod.end_date,
          previousStartDate: databasePeriod.previous_start_date,
          previousEndDate: databasePeriod.previous_end_date,
        },
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("CEO dashboard request failed", error);
    return NextResponse.json({ error: "Business report is temporarily unavailable." }, { status: 503 });
  }
}
