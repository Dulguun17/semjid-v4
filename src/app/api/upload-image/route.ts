import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireWorkspaceAccess } from "@/lib/workspace-auth";
import { readUpload, RequestInputError } from "@/lib/request-validation";

export async function POST(request: NextRequest) {
  const access = await requireWorkspaceAccess(request, { roles: ["staff"], managerOnly: true });
  if (!access.allowed) return access.response;
  try {
    const file = await readUpload(request, true);
    const fileName = `rooms/${crypto.randomUUID()}.${file.extension}`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from("resort-images").upload(fileName, file.bytes, { contentType: file.mime, upsert: false });
    if (error) return NextResponse.json({ error: "Upload failed." }, { status: 503 });
    const { data } = admin.storage.from("resort-images").getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl, fileName });
  } catch (error) {
    if (error instanceof RequestInputError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Upload failed." }, { status: 503 });
  }
}
