"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Download, Loader2, RefreshCw } from "lucide-react";
import { workspaceAuthorizationHeaders } from "@/lib/workspace-api";
import { formatMntAmount } from "@/lib/payment-ledger";
import {
  buildDashboardCsv,
  groupTrendForChart,
  percentComparison,
  resolveReportRanges,
  ulaanbaatarDate,
  type DashboardReport,
  type ReportPeriod,
} from "@/lib/ceo-report";

const periodNames: Record<ReportPeriod, string> = {
  day: "Өдөр",
  month: "Сар",
  year: "Жил",
  custom: "Өөрийн огноо",
};

function occupancyPercent(occupied: string, eligible: string): string {
  const capacity = Number(eligible);
  if (!capacity) return "Тооцоолох боломжгүй";
  return `${(Number(occupied) / capacity * 100).toFixed(1)}%`;
}

function occupancyDelta(current: DashboardReport["current"], previous: DashboardReport["previous"]): string {
  const currentEligible = Number(current.eligible_bed_nights);
  const previousEligible = Number(previous.eligible_bed_nights);
  if (!currentEligible || !previousEligible) return "Харьцуулах суурь хүрэлцээгүй";
  const delta = Number(current.occupied_bed_nights) / currentEligible * 100 -
    Number(previous.occupied_bed_nights) / previousEligible * 100;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} нэгж`;
}

function comparison(current: string, previous: string): string {
  const difference = BigInt(current) - BigInt(previous);
  const direction = difference > BigInt(0) ? "+" : difference < BigInt(0) ? "−" : "";
  const magnitude = difference < BigInt(0) ? -difference : difference;
  return `${direction}${magnitude.toString()} · ${percentComparison(current, previous)}`;
}

function TrendChart({ report }: { report: DashboardReport }) {
  const trend = useMemo(
    () => groupTrendForChart(report.income_trend, report.period.startDate, report.period.endDate),
    [report]
  );
  const maximum = trend.reduce((max, row) =>
    row.payments > max ? row.payments : row.refunds > max ? row.refunds : max, BigInt(0));

  if (maximum === BigInt(0)) {
    return <p className="py-12 text-center text-sm text-slate-400">Сонгосон хугацаанд хүлээн авсан төлбөр, буцаалт бүртгэгдээгүй.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-end gap-2 border-b border-slate-200 px-2 pt-5">
        {trend.map(row => {
          const paymentHeight = Number(row.payments * BigInt(100) / maximum);
          const refundHeight = Number(row.refunds * BigInt(100) / maximum);
          return (
            <div key={row.key} className="flex w-12 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end justify-center gap-1">
                <div
                  title={`Хүлээн авсан: ${formatMntAmount(row.payments.toString())}`}
                  className="w-4 rounded-t bg-teal"
                  style={{ height: `${paymentHeight}%` }}
                />
                <div
                  title={`Буцаалт: ${formatMntAmount(row.refunds.toString())}`}
                  className="w-4 rounded-t bg-rose-400"
                  style={{ height: `${refundHeight}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{row.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-teal" />Дууссан төлбөр хүлээн авалт</span>
        <span><i className="mr-2 inline-block h-3 w-3 rounded-sm bg-rose-400" />Дууссан буцаалт</span>
        <span className="text-slate-500">Баганын дүн: {report.income_trend.length > 31 ? "сар" : "өдөр"}</span>
      </div>
    </div>
  );
}

export default function CeoWorkspacePage() {
  const today = useMemo(() => ulaanbaatarDate(), []);
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [date, setDate] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ranges = resolveReportRanges(
        period,
        date,
        customStart,
        customEnd,
        ulaanbaatarDate()
      );
      const params = new URLSearchParams({
        period,
        ...(period === "custom"
          ? { start: ranges.startDate, end: ranges.endDate }
          : { date }),
      });
      const response = await fetch(`/api/ceo/business-dashboard?${params}`, {
        headers: await workspaceAuthorizationHeaders(),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Тайланг ачаалж чадсангүй.");
      if (!result.report?.current || !Array.isArray(result.report.income_trend)) {
        throw new Error("Тайлангийн өгөгдөл дутуу байна.");
      }
      setReport(result.report as DashboardReport);
    } catch (loadError) {
      console.error("Failed to load CEO business dashboard", loadError);
      setReport(null);
      setError(loadError instanceof Error ? loadError.message : "Тайланг ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [customEnd, customStart, date, period]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const exportCsv = () => {
    if (!report) return;
    const blob = new Blob(["\ufeff", buildDashboardCsv(report)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ceo-business-report_${report.period.startDate}_${report.period.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const current = report?.current;
  const previous = report?.previous;
  const occupancy = current && previous
    ? occupancyPercent(current.occupied_bed_nights, current.eligible_bed_nights)
    : "—";
  const noActivity = current &&
    current.booking_count === "0" &&
    current.completed_payments === "0" &&
    current.completed_refunds === "0" &&
    current.eligible_bed_nights === "0";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CEO бизнесийн тойм</h1>
          <p className="mt-2 text-sm text-slate-500">Унших эрхтэй, зөвхөн нэгтгэсэн мэдээлэл. Бүх өдрийг Asia/Ulaanbaatar цагаар тооцно.</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!report || loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-50">
          <Download size={16} /> Тайлан татах CSV
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-600">
            Хугацаа
            <select value={period} onChange={event => setPeriod(event.target.value as ReportPeriod)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {Object.entries(periodNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          {period === "day" && (
            <label className="text-xs text-slate-600">
              Өдөр
              <input type="date" value={date} max={today} onChange={event => setDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          )}
          {period === "month" && (
            <label className="text-xs text-slate-600">
              Сар
              <input type="month" value={date.slice(0, 7)} max={today.slice(0, 7)} onChange={event => setDate(`${event.target.value}-01`)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          )}
          {period === "year" && (
            <label className="text-xs text-slate-600">
              Жил
              <input type="number" min="2000" max={today.slice(0, 4)} value={date.slice(0, 4)} onChange={event => setDate(`${event.target.value}-01-01`)} className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
          )}
          {period === "custom" && (
            <>
              <label className="text-xs text-slate-600">
                Эхлэх өдөр
                <input type="date" value={customStart} max={today} onChange={event => setCustomStart(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-slate-600">
                Дуусах өдөр
                <input type="date" value={customEnd} min={customStart} max={today} onChange={event => setCustomEnd(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </>
          )}
          <button type="button" onClick={() => void loadReport()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm text-white disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Шинэчлэх
          </button>
          {report && <p className="text-xs text-slate-500">Өмнөх ижил урттай хугацаа: {report.period.previousStartDate} — {report.period.previousEndDate}</p>}
        </div>
      </section>

      <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Мөнгө хүлээн авсан үзүүлэлт; ашиг эсвэл нягтлан бодох орлого биш.</strong>{" "}
        Бүртгэгдсэн дууссан төлбөр, буцаалтыг зөвхөн бодит хүлээн авсан/буцаасан огноогоор харуулна. Онлайн төлбөр: холбогдоогүй.
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Тайланг ачаалж чадсангүй; утгыг тэг гэж үзээгүй. {error}
        </div>
      ) : loading || !report ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal" /></div>
      ) : (
        <>
          {noActivity && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Сонгосон хугацаанд үйл ажиллагааны бичлэг алга. Энэ нь амжилттай нэгтгэсэн хоосон хугацаа бөгөөд системийн алдаа биш.
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 size={18} className="text-teal" />
              <h2 className="font-semibold text-slate-900">Сонгосон хугацааны үйл ажиллагаа</h2>
              <span className="text-xs text-slate-500">{report.period.startDate} — {report.period.endDate}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Дууссан төлбөр хүлээн авалт", value: formatMntAmount(current!.completed_payments), compare: comparison(current!.completed_payments, previous!.completed_payments) },
                { label: "Дууссан буцаан олголт", value: formatMntAmount(current!.completed_refunds), compare: comparison(current!.completed_refunds, previous!.completed_refunds) },
                { label: "Цэвэр мөнгө хүлээн авсан", value: formatMntAmount(current!.net_received), compare: comparison(current!.net_received, previous!.net_received) },
                { label: "Захиалгын үнэ", value: formatMntAmount(current!.booking_value), compare: `${comparison(current!.booking_value, previous!.booking_value)} · мөнгө хүлээн авсан гэсэн үг биш` },
                { label: "Шинээр үүссэн захиалга", value: current!.booking_count, compare: comparison(current!.booking_count, previous!.booking_count) },
                { label: "Цуцлалтын үйл явдал", value: current!.cancellations, compare: comparison(current!.cancellations, previous!.cancellations) },
                { label: "Ирээгүй үйл явдал", value: current!.no_shows, compare: comparison(current!.no_shows, previous!.no_shows) },
                { label: "Ор эзэлсэн хоног / боломжит ор-хоног", value: `${current!.occupied_bed_nights} / ${current!.eligible_bed_nights}`, compare: occupancyDelta(current!, previous!), detail: occupancy },
              ].map(item => (
                <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900">{item.value}</div>
                  {"detail" in item && <div className="mt-1 text-sm font-medium text-teal-800">Эзлэлт: {item.detail}</div>}
                  <div className="mt-2 text-[11px] text-slate-500">Өмнөх ижил урттай хугацаа: {item.compare}</div>
                </article>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Захиалгын тоо болон үнэ нь Asia/Ulaanbaatar-д үүссэн огноогоор тооцогдоно. Захиалгын үнэ нь тухайн хугацаанд үүссэн захиалгуудын одоогийн бүртгэлтэй нийт үнэ; хүлээн авсан төлбөр биш.
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Төлбөрийн сувгийн задаргаа</h2>
              <p className="mt-1 text-xs text-slate-500">Зөвхөн сонгосон хугацаанд дууссан, хүлээн авсан төлбөр.</p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Бэлэн мөнгө</dt><dd className="mt-1 font-semibold">{formatMntAmount(current!.cash_received)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Банкны шилжүүлэг</dt><dd className="mt-1 font-semibold">{formatMntAmount(current!.bank_received)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">Хүлээгдэж буй шилжүүлэг, буцаалтын хүсэлт ороогүй. Онлайн/QPay холбогдоогүй тул онлайн гүйлгээ байхгүй.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Өнөөдрийн байдлаарх үлдэгдэл</h2>
              <p className="mt-1 text-xs text-slate-500">Эдгээр нь сонгосон хугацааны урсгал биш. Зөвхөн бүрэн төлбөрийн түүх гэж тэмдэглэгдсэн захиалгуудыг тооцно.</p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Үлдэгдэл</dt><dd className="mt-1 font-semibold">{formatMntAmount(report.balances_as_of_now.outstanding)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">Илүү төлөлт</dt><dd className="mt-1 font-semibold">{formatMntAmount(report.balances_as_of_now.overpayments)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">Бүрэн бүртгэлтэй захиалга: {report.balances_as_of_now.covered_bookings} · Төлбөрийн түүх тодорхойгүй: {report.balances_as_of_now.unknown_bookings}</p>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Мөнгө хүлээн авалт ба буцаалтын хандлага</h2>
            <p className="mb-2 mt-1 text-xs text-slate-500">Төлбөр/буцаалтыг бодитоор дууссан огноогоор бүлэглэв. Буцаалт нь анхны төлбөртэй ижил хугацаанд байх албагүй.</p>
            <TrendChart report={report} />
          </section>

          {(report.data_quality.incomplete_legacy_allocations !== "0" ||
            report.data_quality.previous_incomplete_legacy_allocations !== "0" ||
            report.data_quality.status_history_incomplete ||
            report.data_quality.payment_history_incomplete ||
            !report.data_quality.balance_coverage_complete) && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-orange-900"><AlertTriangle size={18} />Өгөгдлийн бүрэн бүтэн байдлын анхааруулга</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-orange-900">
                {(report.data_quality.incomplete_legacy_allocations !== "0" ||
                  report.data_quality.previous_incomplete_legacy_allocations !== "0") && (
                  <li>Сонгосон хугацаанд {report.data_quality.incomplete_legacy_allocations} legacy захиалгад орны хуваарилалт дутуу; өмнөх хугацаанд {report.data_quality.previous_incomplete_legacy_allocations}. Эдгээр өрөөний ор-хоногийг боломжит багтаамжаас хассан, эзлэлтэд таамгаар оруулаагүй.</li>
                )}
                {report.data_quality.status_history_incomplete && (
                  <li>Цуцлалт, ирээгүй үйл явдлын бүртгэл {report.data_quality.status_history_since} өдрөөс эхэлнэ. Түүнээс өмнөх үйл явдлыг буцаан зохиогоогүй тул сонгосон/өмнөх хугацааны тоо дутуу байж болно.</li>
                )}
                {report.data_quality.payment_history_incomplete && (
                  <li>Тайлангийн хамгаалалттай payment-record хяналтын эхлэх огноо {report.data_quality.payment_history_since}. Үүнээс өмнөх төлбөр, буцаалтыг сэргээн таамаглаагүй; зөвхөн бодитоор бүртгэсэн дууссан гүйлгээг харуулна.</li>
                )}
                {!report.data_quality.balance_coverage_complete && (
                  <li>{report.balances_as_of_now.unknown_bookings} захиалгын төлбөрийн эхний бүрэн үлдэгдэл тодорхойгүй. Эдгээрийн үнийг өр төлбөр эсвэл төлөгдсөн гэж тооцоогүй.</li>
                )}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
