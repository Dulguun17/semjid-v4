import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";
export const metadata = { ...PRIVATE_PAGE_METADATA, title: 'My account', description: 'Private account, booking and feedback information.' };
export default function PrivatePageLayout({ children }: { children: React.ReactNode }) { return children; }
