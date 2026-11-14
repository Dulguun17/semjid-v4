import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";
export const metadata = { ...PRIVATE_PAGE_METADATA, title: 'Booking', description: 'Review stay dates, room and bed choices and the current status of your request.' };
export default function PrivatePageLayout({ children }: { children: React.ReactNode }) { return children; }
