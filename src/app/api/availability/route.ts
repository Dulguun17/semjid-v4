import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

export async function GET(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const checkIn = searchParams.get("checkin") || "";
  const checkOut = searchParams.get("checkout") || "";
  const bookingId = searchParams.get("bookingId");
  let guestGenders: unknown;
  try {
    guestGenders = JSON.parse(searchParams.get("genders") || "[]");
  } catch {
    return NextResponse.json({ error: "genders must be a JSON array." }, { status: 400 });
  }
  if (!roomId) return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  if (!Array.isArray(guestGenders) || guestGenders.some(gender =>
    gender !== "female" && gender !== "male" && gender !== "unknown"
  )) {
    return NextResponse.json({ error: "genders must contain only female, male, or unknown." }, { status: 400 });
  }

  const supabase = createWorkspaceUserClient(req);
  const { data, error } = await supabase.rpc("get_staff_bed_availability", {
    p_room_id: roomId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_exclude_booking: bookingId,
    p_guest_genders: guestGenders,
  });
  if (error) {
    const status = error.code === "42501" ? 403
      : error.code?.startsWith("22") ? 400
      : error.code === "P0002" ? 404
      : 503;
    if (status === 503) console.error("Room availability check failed");
    return NextResponse.json(
      { error: status === 503 ? "Availability is unknown because the check failed." : error.message, available: null },
      { status }
    );
  }
  const availability = Array.isArray(data) ? data[0] : data;
  if (!availability || typeof availability !== "object") {
    return NextResponse.json({ error: "Availability is unknown.", available: null }, { status: 503 });
  }
  return NextResponse.json(availability);
}
