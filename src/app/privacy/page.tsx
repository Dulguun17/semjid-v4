import { Metadata } from "next";
import PrivacyPageClient from "./PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Сэмжид Хужирт",
  description: "Privacy policy for Semjid Khujirt resort website.",
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
