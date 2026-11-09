import Link from "next/link";
import { CustomerBookingSummary } from "@/components/sections/CustomerBookingSummary";
import { parseCustomerBedSelection } from "@/lib/customer-booking";

export default async function BookingSummaryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let selection;
  try {
    selection = parseCustomerBedSelection({ ...params, bedIds: typeof params.bedIds === "string" ? params.bedIds.split(",") : [] });
  } catch {
    return <main className="mx-auto max-w-2xl space-y-4 px-4 py-16"><h1 className="text-xl">Сонголтоо дахин шалгана уу / Check your selection</h1><Link href="/booking" className="text-teal underline">Өрөө, ор сонгох / Choose room and beds</Link></main>;
  }
  return <CustomerBookingSummary selection={selection} />;
}
