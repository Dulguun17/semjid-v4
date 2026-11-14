import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";

export const metadata = { ...PRIVATE_PAGE_METADATA, title: "Email verification | Сэмжид Хужирт" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
