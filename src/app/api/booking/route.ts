import { NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";
import { parseCustomerBedSelection } from "@/lib/customer-booking";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.CUSTOMER_BOOKING_TEST_ENABLED !== "true") return NextResponse.json(
    { error: "Online bookings are currently closed." },
    { status: 410 }
  );
  const access = await requireWorkspaceAccess(request, { roles: ["customer"] });
  if (!access.allowed) return access.response;
  let input;
  let selection;
  try {
    input = await request.json();
    selection = parseCustomerBedSelection(input);
    if (typeof input.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)
      || typeof input.expectedTotal !== "string" || !/^\d+$/.test(input.expectedTotal)
      || !["cash", "bank"].includes(input.payment)
      || [input.firstName, input.lastName, input.phone].some(value => typeof value !== "string" || !value.trim())) throw new Error("Invalid details");
  } catch { return NextResponse.json({ error: "Check your guest details and booking summary." }, { status: 400 }); }
  try {
    const client = createWorkspaceUserClient(request);
    const { data: booking, error } = await client.rpc("create_customer_bed_booking", {
      p_request_id: input.requestId, p_expected_total: input.expectedTotal,
      p_booking: {
        fname: input.firstName.trim(), lname: input.lastName.trim(), phone: input.phone.trim(),
        room_id: selection.roomId, check_in: selection.checkIn, check_out: selection.checkOut,
        guests: selection.bedIds.length, payment: input.payment,
        bed_assignments: selection.bedIds.map(bed_id => ({ bed_id, guest_gender: selection.gender })),
      },
    });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "23505" || error.code === "23P01" ? 409 : error.code?.startsWith("22") ? 400 : 503;
      return NextResponse.json({
        error: status === 503 ? "Booking is temporarily unavailable. Retry the same request." : "The booking could not be saved. Check availability, price and account verification.",
        code: error.code === "23P01" ? "availability_conflict" : error.code === "23505" ? "request_conflict" : "booking_unavailable",
      }, { status });
    }
    if (!booking?.id) return NextResponse.json({ error: "Booking response unavailable. Retry the same request." }, { status: 503 });
    return NextResponse.json({ booking: {
      id: booking.id, ref: booking.ref, room_id: booking.room_id,
      check_in: booking.check_in, check_out: booking.check_out, total: booking.total,
      status: booking.status, expires_at: booking.expires_at,
    } }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Booking response unavailable. Retry the same request." }, { status: 503 }); }
}
