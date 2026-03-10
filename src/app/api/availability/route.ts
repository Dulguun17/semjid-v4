import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId   = searchParams.get("roomId");
  const checkin  = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");

  if (!roomId || !checkin || !checkout)
    return NextResponse.json({ available: true });

  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("room_id", roomId)
    .neq("status", "cancelled")
    .lt("checkin", checkout)   // existing booking starts before my checkout
    .gt("checkout", checkin);  // existing booking ends after my checkin

  if (error) return NextResponse.json({ available: true });
  return NextResponse.json({ available: data.length === 0 });
}
