import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["staff"], managerOnly: true });
  if (!access.allowed) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A booking link request is required." }, { status: 400 });
  }

  const input = body as {
    bookingId?: unknown;
    customerUserId?: unknown;
    identityVerified?: unknown;
    reason?: unknown;
  };
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (typeof input.bookingId !== "string" || !uuidPattern.test(input.bookingId)
    || typeof input.customerUserId !== "string" || !uuidPattern.test(input.customerUserId)
    || input.identityVerified !== true || reason.length < 8 || reason.length > 500) {
    return NextResponse.json({
      error: "Confirm identity verification and provide booking, customer account, and a reason of 8 to 500 characters.",
    }, { status: 400 });
  }

  const supabase = createWorkspaceUserClient(request);
  const { error } = await supabase.rpc("link_booking_to_customer", {
    p_booking_id: input.bookingId,
    p_customer_user_id: input.customerUserId,
    p_reason: reason,
  });
  if (error?.code === "42501") {
    return NextResponse.json({ error: "Manager access is required to link a customer booking." }, { status: 403 });
  }
  if (error?.code === "P0002") {
    return NextResponse.json({ error: "The booking was not found." }, { status: 404 });
  }
  if (error) {
    if (error.code === "22023") {
      return NextResponse.json({ error: "The booking, customer account, or verification reason is invalid." }, { status: 400 });
    }
    console.error("Manager customer booking link failed", { code: error.code });
    return NextResponse.json({ error: "The booking could not be linked." }, { status: 503 });
  }

  return NextResponse.json({ linked: true });
}
