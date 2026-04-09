import { Metadata } from "next";
import TermsPageClient from "./TermsPageClient";

export const metadata: Metadata = {
  title: "Terms & Conditions | Сэмжид Хужирт",
  description: "Terms and conditions for Semjid Khujirt resort bookings.",
};

export default function TermsPage() {
  return <TermsPageClient />;
}
