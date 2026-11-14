import { metadataForPage } from "@/lib/site-metadata";
export const metadata = metadataForPage("/rooms");
import { RoomsPageContent } from "@/components/sections/RoomsPageContent";
export default function RoomsPage() { return <RoomsPageContent />; }
