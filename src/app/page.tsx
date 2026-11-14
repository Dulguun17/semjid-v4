import { BUSINESS } from "@/lib/business";
import { FACEBOOK_URL, PHONE1, PHONE2 } from "@/lib/data";
import { canonicalSiteOrigin } from "@/lib/site-metadata";
import { metadataForPage } from "@/lib/site-metadata";
export const metadata = metadataForPage("/");
import { HeroSection }       from "@/components/sections/HeroSection";
import { StatsSection }      from "@/components/sections/StatsSection";
import { AboutSection }      from "@/components/sections/AboutSection";
import { ConditionsSection } from "@/components/sections/ConditionsSection";
import { RoomsSection }      from "@/components/sections/RoomsSection";
import { LocationSection }   from "@/components/sections/LocationSection";
import { BookingCTA }        from "@/components/sections/BookingCTA";

export default function Home() {
  const origin = canonicalSiteOrigin();
  const businessSchema = {
    "@context": "https://schema.org", "@type": "LocalBusiness",
    name: BUSINESS.name, alternateName: BUSINESS.englishName,
    ...(origin ? { url: origin } : {}),
    telephone: [PHONE1, PHONE2].map(phone => "+976" + phone.replaceAll("-", "")),
    address: { "@type": "PostalAddress", addressLocality: BUSINESS.locality, addressRegion: BUSINESS.region, addressCountry: BUSINESS.country },
    sameAs: [FACEBOOK_URL],
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema).replaceAll("<", "\\u003c") }} />
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <ConditionsSection />
      <RoomsSection />
      <LocationSection />
      <BookingCTA />
    </main>
  );
}
