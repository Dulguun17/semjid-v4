import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/workspace-auth";

export async function POST(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"], managerOnly: true });
  if (!access.allowed) return access.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext  = file.name.split(".").pop();
    const path = `rooms/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from("resort-images")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("resort-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
