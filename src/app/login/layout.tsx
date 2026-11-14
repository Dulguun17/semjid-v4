import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";
export const metadata = { ...PRIVATE_PAGE_METADATA, title: 'Sign in', description: 'Sign in to your Semjid customer account.' };
export default function PrivatePageLayout({ children }: { children: React.ReactNode }) { return children; }
