import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readJsonObject, RequestInputError } from "@/lib/request-validation";

const validRoom = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);

export async function GET(request: Request) {
  const roomId = new URL(request.url).searchParams.get("room_id");
  if (roomId !== null && !validRoom(roomId)) return NextResponse.json({ error: "Invalid room." }, { status: 400 });
  let query = getSupabaseAdmin().from("reviews").select("id,room_id,fname,rating,comment,created_at")
    .eq("approved", true).order("created_at", { ascending: false }).limit(100);
  if (roomId) query = query.eq("room_id", roomId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Reviews unavailable." }, { status: 503 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  try {
    const { room_id, fname, rating, comment } = await readJsonObject(request);
    const value = typeof rating === "string" && /^[1-5]$/.test(rating) ? Number(rating) : rating;
    if (!validRoom(room_id) || typeof fname !== "string" || !fname.trim() || fname.length > 100
      || typeof comment !== "string" || !comment.trim() || comment.length > 2000
      || typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      throw new RequestInputError("Provide a name, room, rating from 1 to 5 and a comment up to 2000 characters.");
    }
    const { error } = await getSupabaseAdmin().from("reviews").insert({ room_id, fname: fname.trim(), rating: value, comment: comment.trim(), approved: false });
    if (error) return NextResponse.json({ error: "Review could not be submitted." }, { status: 503 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestInputError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Review could not be submitted." }, { status: 503 });
  }
}
