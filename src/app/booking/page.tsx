import { BookingPageContent } from "@/components/sections/BookingPageContent";
import BedAvailabilityPage from "@/app/rooms/availability/page";

export default function BookingPage() {
  if (process.env.NODE_ENV !== "production" && process.env.CUSTOMER_BOOKING_TEST_ENABLED === "true") return <BedAvailabilityPage />;
  return <BookingPageContent />;
}
