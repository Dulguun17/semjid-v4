import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseCustomerBedSelection } from "@/lib/customer-booking";
import { validateBookingDates } from "@/lib/booking-rules";
import { ulaanbaatarToday } from "@/lib/bed-availability";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.CUSTOMER_BOOKING_TEST_ENABLED !== "true") {
    return NextResponse.json({ error: "Online booking is currently closed." }, { status: 410 });
  }
  const access = await requireWorkspaceAccess(request, { roles: ["customer"] });
  if (!access.allowed) return access.response;
  let selection;
  try { selection = parseCustomerBedSelection(await request.json()); }
  catch { return NextResponse.json({ error: "Choose valid dates, room and distinct beds." }, { status: 400 }); }
  try {
    const admin = getSupabaseAdmin();
    const { data: policy, error: policyError } = await admin.rpc("get_public_booking_policy");
    if (policyError || !policy) throw policyError || new Error("Policy unavailable");
    if (validateBookingDates(selection.checkIn, selection.checkOut, ulaanbaatarToday(), policy.stay_nights, policy.advance_months)) {
      return NextResponse.json({ error: "The selected dates do not match the current stay policy." }, { status: 400 });
    }
    const { data: rooms, error: availabilityError } = await admin.rpc("get_public_bed_availability", {
      p_check_in: selection.checkIn, p_check_out: selection.checkOut, p_gender: selection.gender,
    });
    if (availabilityError || !Array.isArray(rooms)) throw availabilityError || new Error("Availability unavailable");
    const room = rooms.find(row => row.room_id === selection.roomId);
    if (!room || !selection.bedIds.every(id => room.beds.some((bed: { bed_id: string; state: string }) => bed.bed_id === id && bed.state === "available"))) {
      return NextResponse.json({ error: "These beds are no longer available. Choose again." }, { status: 409 });
    }
    const { data: rate, error: rateError } = await admin.from("rooms").select("adult1, adult2").eq("id", room.category_id).single();
    if (rateError || !rate || !/^\d+$/.test(String(rate.adult1 ?? rate.adult2))) throw rateError || new Error("Rate unavailable");
    const nightlyRate = BigInt(rate.adult1 ?? rate.adult2);
    const { data: config, error: configError } = await admin.from("booking_config").select("customer_online_booking_enabled").eq("id", true).single();
    if (configError && configError.code !== "42703" && configError.code !== "PGRST204") throw configError;
    return NextResponse.json({ quote: {
      ...selection, nightlyRate: nightlyRate.toString(), nights: policy.stay_nights,
      guests: selection.bedIds.length, total: (nightlyRate * BigInt(policy.stay_nights) * BigInt(selection.bedIds.length)).toString(),
      canSave: config?.customer_online_booking_enabled === true,
    } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "The booking price and availability could not be verified. Try again." }, { status: 503 });
  }
}
