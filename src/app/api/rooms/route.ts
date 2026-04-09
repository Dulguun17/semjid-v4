import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  return NextResponse.json({ rooms: rooms || [] });
}
