import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireWorkspaceAccess } from "@/lib/workspace-auth";

export async function POST(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  try {
    const body = await req.json();
    const { message, sessionId } = body;
    if (typeof message !== "string" || !message.trim() || typeof sessionId !== "string" || !sessionId.trim()) {
      return NextResponse.json({ error: "Message and session ID are required." }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("chat_messages")
      .insert({
        session_id: sessionId.trim(),
        sender: "admin",
        sender_name: "Сувилалын ажилтан",
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Failed to send staff chat reply", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
