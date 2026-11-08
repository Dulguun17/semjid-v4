import { NextRequest, NextResponse } from "next/server";
import { calculateBookingFinancials } from "@/lib/payment-ledger";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

function databaseErrorResponse(error: { code?: string; message: string }) {
  const status = error.code === "42501" ? 403
    : error.code === "P0002" ? 404
    : error.code === "23505" ? 409
    : error.code === "22023" || error.code?.startsWith("22") ? 400
    : 500;
  if (status === 500) console.error("Staff payment operation failed", error);
  return NextResponse.json(
    { error: status === 500 ? "Payment operation failed." : error.message },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  const supabase = createWorkspaceUserClient(request);
  const [
    { data: bookings, error: bookingsError },
    { data: records, error: recordsError },
  ] = await Promise.all([
    supabase.from("bookings")
      .select("id, ref, fname, lname, phone, room_id, check_in, check_out, total, status, created_at, booking_bed_assignments(bed_id, released_at)")
      .order("created_at", { ascending: false }),
    supabase.from("booking_payment_records")
      .select("id, booking_id, kind, status, amount::text, method, received_on, reference, note, reason, created_by, verified_by, completed_by, created_at, completed_at")
      .order("created_at", { ascending: false }),
  ]);
  if (bookingsError || recordsError) {
    const error = bookingsError || recordsError;
    if (error) return databaseErrorResponse(error);
  }

  const recordsByBooking = new Map<string, NonNullable<typeof records>>();
  for (const record of records || []) {
    recordsByBooking.set(record.booking_id, [
      ...(recordsByBooking.get(record.booking_id) || []),
      record,
    ]);
  }
  return NextResponse.json({
    can_manage: access.isManager,
    bookings: (bookings || []).map(booking => {
      const paymentRecords = recordsByBooking.get(booking.id) || [];
      return {
        ...booking,
        payment_records: paymentRecords,
        financials: calculateBookingFinancials(booking.total, paymentRecords),
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON payment record is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A payment record is required." }, { status: 400 });
  }
  const amount = typeof body.amount === "string" ? body.amount : String(body.amount ?? "");
  const method = body.method;
  const kind = body.kind;
  const status = body.status;
  if (typeof body.booking_id !== "string" ||
    !/^[1-9]\d*$/.test(amount) ||
    (method !== "cash" && method !== "bank_transfer") ||
    (kind !== "payment" && kind !== "refund") ||
    typeof body.idempotency_key !== "string" ||
    body.idempotency_key.length < 8 || body.idempotency_key.length > 128 ||
    (status !== "pending" && status !== "completed" && status !== "requested")) {
    return NextResponse.json({ error: "Payment details are invalid." }, { status: 400 });
  }
  const receivedOn = body.received_on === null || body.received_on === undefined
    ? null
    : typeof body.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.received_on)
      ? body.received_on
      : undefined;
  if (receivedOn === undefined) {
    return NextResponse.json({ error: "Receipt date must use YYYY-MM-DD." }, { status: 400 });
  }
  const textField = (key: string) => typeof body[key] === "string" ? body[key] as string : null;

  const supabase = createWorkspaceUserClient(request);
  const { data, error } = await supabase.rpc("record_staff_payment", {
    p_booking_id: body.booking_id,
    p_kind: kind,
    p_amount: amount,
    p_method: method,
    p_status: status,
    p_received_on: receivedOn,
    p_reference: textField("reference"),
    p_note: textField("note"),
    p_reason: textField("reason"),
    p_idempotency_key: body.idempotency_key,
    p_verified: body.verified === true,
  });
  if (error) return databaseErrorResponse(error);
  return NextResponse.json({ record: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid payment record update is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    typeof body.id !== "string" ||
    (body.action !== "complete_payment" && body.action !== "complete_refund" && body.action !== "void")) {
    return NextResponse.json({ error: "Payment record action is invalid." }, { status: 400 });
  }

  const managerAction = body.action === "complete_refund" || body.action === "void";
  const access = await requireWorkspaceAccess(request, {
    roles: ["staff"],
    managerOnly: managerAction,
  });
  if (!access.allowed) return access.response;

  const receivedOn = body.received_on === undefined || body.received_on === null
    ? null
    : typeof body.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.received_on)
      ? body.received_on
      : undefined;
  if (receivedOn === undefined) {
    return NextResponse.json({ error: "Receipt date must use YYYY-MM-DD." }, { status: 400 });
  }

  const supabase = createWorkspaceUserClient(request);
  const { data, error } = await supabase.rpc("update_staff_payment_record", {
    p_record_id: body.id,
    p_action: body.action,
    p_reason: typeof body.reason === "string" ? body.reason : "",
    p_verified: body.verified === true,
    p_received_on: receivedOn,
  });
  if (error) return databaseErrorResponse(error);
  return NextResponse.json({ record: data });
}
