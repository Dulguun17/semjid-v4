import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";
export const metadata = { ...PRIVATE_PAGE_METADATA, title: 'Choose beds', description: 'Review room and bed availability for selected dates.' };
export default function PrivatePageLayout({ children }: { children: React.ReactNode }) { return children; }
