import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: rooms, error } = await supabase.rpc("get_public_room_catalog");
  if (error) {
    console.error("Failed to load public room catalogue", error);
    return NextResponse.json({ error: "Room catalogue is temporarily unavailable." }, { status: 503 });
  }
  return NextResponse.json({ rooms: rooms || [] });
}
