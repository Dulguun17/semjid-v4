import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";
import { ulaanbaatarToday } from "@/lib/bed-availability";

function databaseErrorResponse(error: { code?: string; message: string }) {
  const status = error.code === "42501" ? 403
    : error.code === "P0002" ? 404
    : error.code === "23P01" ? 409
    : error.code === "22023" || error.code?.startsWith("22") ? 400
    : 500;
  if (status === 500) console.error("Staff booking database operation failed", error);
  return NextResponse.json(
    { error: status === 500 ? "Booking operation failed." : error.message },
    { status }
  );
}

export async function GET(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  const supabase = createWorkspaceUserClient(req);
  const { error: expiryError } = await supabase.rpc("expire_pending_bookings_for_staff");
  if (expiryError) return databaseErrorResponse(expiryError);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("check_in", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return databaseErrorResponse(error);

  const { data: assignments, error: assignmentError } = await supabase
    .from("booking_bed_assignments")
    .select("id, booking_id, bed_id, guest_gender, assigned_at, released_at, actual_check_in_at, actual_check_out_at")
    .order("assigned_at", { ascending: true });
  if (assignmentError) return databaseErrorResponse(assignmentError);
  const assignmentsByBooking = new Map<string, typeof assignments>();
  for (const assignment of assignments || []) {
    assignmentsByBooking.set(assignment.booking_id, [
      ...(assignmentsByBooking.get(assignment.booking_id) || []),
      assignment,
    ]);
  }
  const bookings = (data || []).map(booking => ({
    ...booking,
    bed_assignments: assignmentsByBooking.get(booking.id) || [],
  }));
  const search = new URL(req.url).searchParams.get("q")?.trim().toLocaleLowerCase() || "";
  const filtered = search
    ? bookings.filter(booking =>
        [booking.fname, booking.lname, booking.phone, booking.ref, booking.email || ""]
          .some(value => String(value).toLocaleLowerCase().includes(search))
      )
    : bookings;
  const today = ulaanbaatarToday();
  const activeStatuses = new Set(["pending", "confirmed", "checked_in"]);

  return NextResponse.json({
    can_manage: access.isManager,
    bookings: filtered,
    arrivals: bookings.filter(b => b.check_in === today && activeStatuses.has(b.status)),
    departures: bookings.filter(b => b.check_out === today && b.status === "checked_in"),
    currentGuests: bookings.filter(b => b.status === "checked_in" && b.actual_check_out_at === null),
  });
}

export async function POST(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  let booking: unknown;
  try {
    booking = await req.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON booking is required." }, { status: 400 });
  }
  if (!booking || typeof booking !== "object" || Array.isArray(booking)) {
    return NextResponse.json({ error: "A booking object is required." }, { status: 400 });
  }

  const supabase = createWorkspaceUserClient(req);
  const { data, error } = await supabase.rpc("create_staff_bed_booking", { p_booking: booking });
  if (error) return databaseErrorResponse(error);
  return NextResponse.json({ booking: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  let body: { id?: unknown; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON booking update is required." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
  }
  const { id, ...booking } = body;

  const supabase = createWorkspaceUserClient(req);
  const { data, error } = await supabase.rpc("update_staff_bed_booking", {
    p_booking_id: id,
    p_booking: booking,
  });
  if (error) return databaseErrorResponse(error);
  return NextResponse.json({ booking: data });
}
