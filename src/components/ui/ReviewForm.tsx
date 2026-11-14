"use client";
import { useId, useState } from "react";
import { Star, Send } from "lucide-react";
import { useLang } from "@/lib/lang-context";

export function ReviewForm({ roomId }: { roomId?: string }) {
  const { lang } = useLang(); const id = useId();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); if (submitting) return;
    setSubmitting(true); setNotice("");
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room_id: roomId || "general", fname: name.trim(), rating, comment: comment.trim() }) });
      if (!response.ok) throw new Error("Review submission unconfirmed");
      setName(""); setRating(5); setComment("");
      setNotice(lang === "mn" ? "Сэтгэгдэл хүлээн авлаа. Нийтлэхийн өмнө ажилтан хянана." : "Review received. Staff review it before publication.");
    } catch { setNotice(lang === "mn" ? "Сэтгэгдэл илгээгдсэн эсэхийг баталгаажуулж чадсангүй. Дахин оролдоно уу." : "Submission could not be confirmed. Please try again."); }
    finally { setSubmitting(false); }
  };
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="mb-3 text-lg font-semibold text-slate-900">{lang === "mn" ? "Нийтийн сэтгэгдэл бичих" : "Leave a public review"}</h3>
    <p className="mb-5 text-sm leading-6 text-slate-600">{lang === "mn" ? "Хянуулсан сэтгэгдэл нэр, үнэлгээ, тайлбартай нийтлэгдэж болно. Эмнэлгийн болон нууц мэдээлэл бүү оруулаарай." : "An approved review may display your submitted name, rating and comment. Keep medical and confidential details out of it."}</p>
    {notice && <p role="status" className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{notice}</p>}
    <form onSubmit={handleSubmit}><fieldset disabled={submitting} className="space-y-4">
      <label htmlFor={`${id}-name`} className="block text-sm font-medium text-slate-700">{lang === "mn" ? "Нийтлэх нэр" : "Display name"}<input id={`${id}-name`} required maxLength={100} value={name} onChange={event => setName(event.target.value)} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
      <fieldset><legend className="mb-2 text-sm font-medium text-slate-700">{lang === "mn" ? "Үнэлгээ" : "Rating"}</legend><div className="flex gap-1">{[1,2,3,4,5].map(value => <label key={value} className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded focus-within:outline focus-within:outline-2 focus-within:outline-teal"><input className="sr-only" type="radio" name={`${id}-rating`} value={value} checked={rating === value} onChange={() => setRating(value)} /><Star aria-hidden="true" size={24} className={value <= rating ? "fill-current text-yellow-400" : "text-gray-300"} /><span className="sr-only">{lang === "mn" ? `5-аас ${value}` : `${value} out of 5`}</span></label>)}</div></fieldset>
      <label htmlFor={`${id}-comment`} className="block text-sm font-medium text-slate-700">{lang === "mn" ? "Сэтгэгдэл" : "Comment"}<textarea id={`${id}-comment`} required maxLength={2000} value={comment} onChange={event => setComment(event.target.value)} className="mt-2 block min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3" /></label>
      <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal px-5 py-3 font-semibold text-white disabled:opacity-50"><Send aria-hidden="true" size={16} />{submitting ? (lang === "mn" ? "Илгээж байна…" : "Submitting…") : (lang === "mn" ? "Хянуулахаар илгээх" : "Submit for review")}</button>
    </fieldset></form>
  </section>;
}
