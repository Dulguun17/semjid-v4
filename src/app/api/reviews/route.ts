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
  try {
    const body = await req.json();
    const { room_id, fname, rating, comment } = body;

    // Validate required fields
    if (!room_id || !fname || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate rating is 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        room_id,
        fname,
        rating: parseInt(rating),
        comment,
        approved: false, // Reviews default to not approved
      })
      .select()
      .single();

    if (error) {
      console.error("Review insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Review submitted successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("❌ Review submission error:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}