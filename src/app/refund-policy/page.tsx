import { Metadata } from "next";
import RefundPolicyPageClient from "./RefundPolicyPageClient";

export const metadata: Metadata = {
  title: "Cancellation Policy | Сэмжид Хужирт",
  description: "Refund and cancellation policy for Semjid Khujirt bookings.",
};

export default function RefundPolicyPage() {
  return <RefundPolicyPageClient />;
}
