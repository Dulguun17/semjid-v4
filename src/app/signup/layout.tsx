import { PRIVATE_PAGE_METADATA } from "@/lib/site-metadata";
export const metadata = { ...PRIVATE_PAGE_METADATA, title: 'Create an account', description: 'Create a customer account to access private booking information.' };
export default function PrivatePageLayout({ children }: { children: React.ReactNode }) { return children; }
