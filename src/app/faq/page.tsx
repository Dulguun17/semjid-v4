import { Metadata } from "next";
import { BookingFAQ } from "@/components/ui/BookingFAQ";

export const metadata: Metadata = {
  title: "FAQ | Сэмжид Хужирт",
  description: "Booking questions, shared rooms, payment verification and arrival preparation at Semjid Khujirt.",
};

export default function FAQPage() {
  return <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6"><BookingFAQ /></main>;
}
