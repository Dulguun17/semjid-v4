import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

type FeedbackError = {
  code?: string;
};

function feedbackErrorResponse(error: FeedbackError) {
  if (error.code === "42501") {
    return NextResponse.json({ error: "This stay is not eligible for feedback." }, { status: 403 });
  }
  if (error.code === "23505") {
    return NextResponse.json({ error: "Feedback has already been submitted for this stay." }, { status: 409 });
  }
  if (error.code === "22023" || error.code?.startsWith("22")) {
    return NextResponse.json({ error: "Check the ratings and comment, then try again." }, { status: 400 });
  }
  console.error("Customer feedback database operation failed", { code: error.code });
  return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
}

export async function GET(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["customer"] });
  if (!access.allowed) return access.response;

  const supabase = createWorkspaceUserClient(request);
  const { data, error } = await supabase
    .from("booking_feedback")
    .select("id, booking_id, room_id, check_in, check_out, room_rating, service_rating, comment, submitted_at")
    .order("submitted_at", { ascending: false });
  if (error) return feedbackErrorResponse(error);

  return NextResponse.json({ feedback: data || [] }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["customer"] });
  if (!access.allowed) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON feedback request is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A feedback object is required." }, { status: 400 });
  }

  const input = body as {
    bookingId?: unknown;
    roomRating?: unknown;
    serviceRating?: unknown;
    comment?: unknown;
  };
  if (typeof input.bookingId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.bookingId)) {
    return NextResponse.json({ error: "A valid booking is required." }, { status: 400 });
  }
  if (!Number.isInteger(input.roomRating) || Number(input.roomRating) < 1 || Number(input.roomRating) > 5
    || !Number.isInteger(input.serviceRating) || Number(input.serviceRating) < 1 || Number(input.serviceRating) > 5) {
    return NextResponse.json({ error: "Choose a room and service rating from 1 to 5." }, { status: 400 });
  }
  if (input.comment !== undefined && input.comment !== null && typeof input.comment !== "string") {
    return NextResponse.json({ error: "The comment must be text." }, { status: 400 });
  }
  const comment = typeof input.comment === "string" ? input.comment.trim() : null;
  if (comment && comment.length > 2000) {
    return NextResponse.json({ error: "Comments must be 2000 characters or fewer." }, { status: 400 });
  }

  const supabase = createWorkspaceUserClient(request);
  const { data, error } = await supabase.rpc("submit_customer_booking_feedback", {
    p_booking_id: input.bookingId,
    p_room_rating: input.roomRating,
    p_service_rating: input.serviceRating,
    p_comment: comment || null,
  });
  if (error) return feedbackErrorResponse(error);
  const row: unknown = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    console.error("Customer feedback RPC returned an invalid response");
    return NextResponse.json({ error: "Feedback was saved, but its response could not be loaded." }, { status: 503 });
  }
  const saved = row as Record<string, unknown>;

  return NextResponse.json({
    feedback: {
      id: saved.id,
      booking_id: saved.booking_id,
      room_id: saved.room_id,
      check_in: saved.check_in,
      check_out: saved.check_out,
      room_rating: saved.room_rating,
      service_rating: saved.service_rating,
      comment: saved.comment,
      submitted_at: saved.submitted_at,
    },
  }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
