import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const supabaseAdmin = getSupabaseAdmin();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, senderName } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        sender: "client",
        sender_name: senderName || "Зочин",
        message,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId || sessionId.length > 128) return NextResponse.json({ messages: [] });

  const { data } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ messages: data || [] });
}
