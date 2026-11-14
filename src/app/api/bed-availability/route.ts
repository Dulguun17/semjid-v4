import { NextRequest, NextResponse } from "next/server";
import { isValidIsoDate } from "@/lib/booking-rules";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const GENDERS = new Set(["female", "male"]);

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || (process.env.BED_AVAILABILITY_PREVIEW !== "true" && process.env.CUSTOMER_BOOKING_TEST_ENABLED !== "true")) {
    return NextResponse.json({ error: "Bed availability preview is not enabled." }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  if (params.get("policy") === "true") {
    try {
      const { data, error } = await getSupabaseAdmin().rpc("get_public_booking_policy");
      if (error) {
        console.error("Public booking policy query failed");
        return NextResponse.json({ error: "Booking policy is temporarily unavailable." }, { status: 503 });
      }
      return NextResponse.json({ policy: data });
    } catch {
      console.error("Public booking policy query is not configured");
      return NextResponse.json({ error: "Booking policy is not configured." }, { status: 503 });
    }
  }

  const checkIn = params.get("checkin") || "";
  const checkOut = params.get("checkout") || "";
  const gender = params.get("gender") || "";
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut) || !GENDERS.has(gender)) {
    return NextResponse.json(
      { error: "Valid check-in, check-out, and guest gender are required." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await getSupabaseAdmin().rpc("get_public_bed_availability", {
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_gender: gender,
    });
    if (error) {
      const status = error.code?.startsWith("22") ? 400 : 503;
      if (status === 503) console.error("Public bed availability query failed");
      return NextResponse.json({
        error: status === 400
          ? "Dates do not meet the current booking requirements."
          : "Bed availability is temporarily unavailable.",
      }, { status });
    }

    return NextResponse.json({ rooms: data });
  } catch {
    console.error("Bed availability preview is not configured");
    return NextResponse.json({ error: "Bed availability preview is not configured." }, { status: 503 });
  }
}
