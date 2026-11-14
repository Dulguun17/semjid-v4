import { metadataForPage } from "@/lib/site-metadata";
export const metadata = metadataForPage("/about");
import { AboutPageContent } from "@/components/sections/AboutPageContent";
export default function AboutPage() { return <AboutPageContent />; }
