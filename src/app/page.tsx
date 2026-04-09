import { HeroSection }       from "@/components/sections/HeroSection";
import { StatsSection }      from "@/components/sections/StatsSection";
import { AboutSection }      from "@/components/sections/AboutSection";
import { ConditionsSection } from "@/components/sections/ConditionsSection";
import { RoomsSection }      from "@/components/sections/RoomsSection";
import { LocationSection }   from "@/components/sections/LocationSection";
import { BookingCTA }        from "@/components/sections/BookingCTA";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <ConditionsSection />
      <RoomsSection />
      <LocationSection />
      <BookingCTA />
    </>
  );
}
