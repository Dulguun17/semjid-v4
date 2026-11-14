import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readJsonObject, RequestInputError } from "@/lib/request-validation";
import { requireWorkspaceAccess } from "@/lib/workspace-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonObject(req);
    const { message, sessionId, senderName } = body;

    if (typeof message !== "string" || !message.trim() || message.length > 2000
      || typeof sessionId !== "string" || !/^chat_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
      || (req.headers.has("x-chat-session") && req.headers.get("x-chat-session") !== sessionId)
      || (senderName !== undefined && (typeof senderName !== "string" || senderName.length > 100))) {
      throw new RequestInputError("Invalid chat session, name or message (maximum 2000 characters).");
    }

    const { data, error } = await getSupabaseAdmin()
      .from("chat_messages")
      .insert({
        session_id: sessionId.trim(),
        sender: "client",
        sender_name: typeof senderName === "string" ? senderName.slice(0, 100) : "Зочин",
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    if (err instanceof RequestInputError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  let sessionId: string | null;
  if (req.headers.has("authorization")) {
    const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
    if (!access.allowed) return access.response;
    sessionId = new URL(req.url).searchParams.get("sessionId");
  } else {
    sessionId = req.headers.get("x-chat-session");
    if (!sessionId || !/^chat_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return NextResponse.json({ error: "A valid chat session is required." }, { status: 401 });
    }
  }
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: "A valid chat session is required." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Chat read failed", { code: error.code });
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
  return NextResponse.json({ messages: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
