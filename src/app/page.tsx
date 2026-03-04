import { HeroSection }       from "@/components/sections/HeroSection";
import { StatsSection }      from "@/components/sections/StatsSection";
import { AboutSection }      from "@/components/sections/AboutSection";
import { ServicesSection }   from "@/components/sections/ServicesSection";
import { ConditionsSection } from "@/components/sections/ConditionsSection";
import { RoomsSection }      from "@/components/sections/RoomsSection";
import { LocationSection }   from "@/components/sections/LocationSection";
import { GallerySection }    from "@/components/sections/GallerySection";
import { BookingCTA }        from "@/components/sections/BookingCTA";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <ServicesSection />
      <ConditionsSection />
      <RoomsSection />
      <LocationSection />
      <GallerySection />
      <BookingCTA />
    </>
  );
}
