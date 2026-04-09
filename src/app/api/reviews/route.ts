import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const supabase = getSupabaseAdmin();

// GET reviews
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const room_id = searchParams.get("room_id");

  if (!room_id) {
    return NextResponse.json({ error: "room_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("room_id", room_id)
    .eq("approved", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST review
export async function POST(req: Request) {
  const body = await req.json();
  const { room_id, fname, rating, comment } = body;

  const { data, error } = await supabase
    .from("reviews")
    .insert([
      {
        room_id,
        fname,
        rating,
        comment,
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}