import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Сэмжид Хужирт",
  description: "Frequently asked questions about Semjid Khujirt resort bookings.",
};

const faqs = [
  {
    question: "How do I make a booking?",
    answer: "You can book online through our website or contact us directly. We require a 7-day minimum stay."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept QPay, bank transfers, and cash payments upon arrival."
  },
  {
    question: "Can I cancel or modify my booking?",
    answer: "Cancellations and modifications are subject to our policy. Please contact us as soon as possible."
  },
  {
    question: "What amenities are included?",
    answer: "All rooms include access to our mineral springs, meals, and basic amenities. Additional services may be available."
  },
  {
    question: "Do you have parking?",
    answer: "Yes, we provide free parking for all guests."
  },
];

export default function FAQPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20 min-h-[70vh]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-teal font-semibold uppercase tracking-[0.24em]">FAQ</p>
          <h1 className="text-3xl font-serif text-slate-900">Frequently Asked Questions</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Find answers to common questions about our resort and booking process.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-slate-200 pb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-3">{faq.question}</h2>
              <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-200">
          <p className="text-slate-600 mb-4">
            Can't find what you're looking for? Contact us directly.
          </p>
          <Link href="/contact" className="text-teal hover:text-teal-dark text-sm font-medium">
            Contact Us →
          </Link>
        </div>
      </div>
    </main>
  );
}
