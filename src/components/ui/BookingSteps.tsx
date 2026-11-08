"use client";
import { useLang } from "@/lib/lang-context";

export function BookingSteps({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  const { lang } = useLang();
  const labels = lang === "mn"
    ? ["Огноо, зочид", "Өрөө", "Ор", "Шалгах, хадгалах"]
    : ["Dates & guests", "Room", "Beds", "Review & save"];
  return (
    <ol aria-label={lang === "mn" ? "Захиалгын явц" : "Booking progress"} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {labels.map((label, index) => (
        <li key={label} aria-current={index + 1 === activeStep ? "step" : undefined}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${index + 1 === activeStep ? "border-teal bg-teal text-white" : "border-slate-200 bg-white text-slate-700"}`}>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index + 1 === activeStep ? "bg-white/20" : "bg-slate-100"}`}>
            {index + 1 < activeStep ? "✓" : index + 1}
          </span>
          <span className="text-sm font-semibold">{label}</span>
        </li>
      ))}
    </ol>
  );
}
