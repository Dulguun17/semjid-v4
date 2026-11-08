import { NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calculateBookingFinancials } from "@/lib/payment-ledger";

export async function GET(request: Request) {
  const access = await requireWorkspaceAccess(request, { roles: ["customer"] });
  if (!access.allowed) return access.response;
  try {
    const client = createWorkspaceUserClient(request);
    const token = request.headers.get("authorization")!.replace(/^Bearer\s+/i, "");
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    const { data: bookings, error } = await client.from("bookings")
      .select("id, ref, room_id, check_in, check_out, guests, total, status, created_at, expires_at")
      .eq("customer_user_id", auth.user.id).order("created_at", { ascending: false });
    if (error) throw error;
    const ids = (bookings || []).map(booking => booking.id);
    if (!ids.length) return NextResponse.json({ bookings: [] }, { headers: { "Cache-Control": "private, no-store" } });

    // Privileged reads are restricted to the booking IDs already proven to belong to this customer.
    const admin = getSupabaseAdmin();
    const [payments, assignments, coverage] = await Promise.all([
      admin.from("booking_payment_records").select("booking_id, kind, status, amount::text, method, received_on").in("booking_id", ids),
      admin.from("booking_bed_assignments").select("booking_id, bed_id, released_at").in("booking_id", ids),
      admin.from("booking_payment_coverage").select("booking_id").in("booking_id", ids),
    ]);
    if (payments.error || assignments.error || coverage.error) throw payments.error || assignments.error || coverage.error;
    return NextResponse.json({
      bookings: (bookings || []).map(booking => {
        const entries = (payments.data || []).filter(entry => entry.booking_id === booking.id);
        const completeHistory = (coverage.data || []).some(row => row.booking_id === booking.id);
        const financials = calculateBookingFinancials(booking.total, entries);
        return {
          ...booking,
          beds: (assignments.data || []).filter(row => row.booking_id === booking.id && !row.released_at).map(row => row.bed_id),
          financials: { ...financials, remainingBalance: completeHistory ? financials.remainingBalance : null, completeHistory },
          payments: entries.map(({ kind, status, amount, method, received_on }) => ({ kind, status, amount, method, received_on })),
        };
      }),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Your booking details are temporarily unavailable." }, { status: 503 });
  }
}
