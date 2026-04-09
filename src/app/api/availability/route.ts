import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { roomInstances } from "@/lib/data";

const supabase = getSupabaseAdmin();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId   = searchParams.get("roomId");
  const checkin  = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");

  if (!roomId || !checkin || !checkout)
    return NextResponse.json({ available: true, guests: 0, bookingCount: 0 });

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkin) || !dateRegex.test(checkout)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkoutDate <= checkinDate) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  // Get room instance details
  const roomInstance = roomInstances.find(r => r.id === roomId);
  const bedCapacity = roomInstance?.beds || 1;

  const [{ data: bookings, error }, { data: blocks, error: blockError }] = await Promise.all([
    supabase
      .from("bookings")
      .select("guests, guest_details")
      .eq("room_id", roomId)
      .neq("status", "cancelled")
      .lt("check_in", checkout)
      .gt("check_out", checkin),
    supabase
      .from("room_blocks")
      .select("id")
      .eq("room_id", roomId)
      .lte("from_date", checkout)
      .gte("to_date", checkin),
  ]);

  if (error || blockError) return NextResponse.json({ available: true, guests: 0, bookingCount: 0, bedCapacity });

  const totalGuests = (bookings || []).reduce((sum, b) => sum + (Number(b.guests) || 0), 0);
  const genderSummary = (bookings || []).flatMap(b => b.guest_details || []).reduce<Record<string, number>>((acc, guest) => {
    const gender = typeof guest.gender === "string" ? guest.gender : "unknown";
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  // Collect detailed guest info for display
  const guestDetails = (bookings || []).flatMap(b => b.guest_details || []).map(guest => ({
    gender: guest.gender,
    age: guest.age
  })).filter(g => g.gender);

  // Room is unavailable if fully booked (total guests >= bed capacity) or manually blocked
  const isFullyBooked = totalGuests >= bedCapacity;
  const isBlocked = (blocks || []).length > 0;
  const available = !isFullyBooked && !isBlocked;

  return NextResponse.json({
    available,
    guests: totalGuests,
    bookingCount: (bookings || []).length,
    blocked: isBlocked,
    fullyBooked: isFullyBooked,
    bedCapacity,
    genderSummary,
    guestDetails,
  });
}