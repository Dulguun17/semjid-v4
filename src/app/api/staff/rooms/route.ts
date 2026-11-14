import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceUserClient, requireWorkspaceAccess } from "@/lib/workspace-auth";

export async function GET(req: NextRequest) {
  const access = await requireWorkspaceAccess(req, { roles: ["staff"] });
  if (!access.allowed) return access.response;

  const supabase = createWorkspaceUserClient(req);
  const { error: expiryError } = await supabase.rpc("expire_pending_bookings_for_staff");
  if (expiryError) {
    console.error("Failed to expire held bookings before availability load");
    return NextResponse.json({ error: "Room availability is unavailable." }, { status: 503 });
  }
  const [
    { data: units, error: unitError },
    { data: categories, error: categoryError },
    { data: blocks, error: blockError },
    { data: policies, error: policyError },
    { data: beds, error: bedError },
  ] = await Promise.all([
    supabase.from("room_units").select("id, category_id, active").eq("active", true).order("id"),
    supabase.from("rooms")
      .select("id, capacity, adult1, adult2, child02, child37a, child37b, child812a, child812b, img")
      .order("id"),
    supabase.from("room_blocks").select("*").is("cancelled_at", null),
    supabase.rpc("get_staff_booking_policy"),
    supabase.from("room_beds").select("id, room_id, bed_number, active").eq("active", true).order("room_id").order("bed_number"),
  ]);
  if (unitError || categoryError || blockError || policyError || bedError) {
    console.error("Failed to load staff room inventory or booking policy");
    return NextResponse.json({ error: "Room inventory is unavailable." }, { status: 503 });
  }

  const ratesById = new Map((categories || []).map(category => [category.id, category]));
  const bedsByRoom = new Map<string, NonNullable<typeof beds>>();
  for (const bed of beds || []) {
    bedsByRoom.set(bed.room_id, [...(bedsByRoom.get(bed.room_id) || []), bed]);
  }
  const rooms = (units || []).map(unit => ({
    ...unit,
    category: ratesById.get(unit.category_id) || null,
    beds: bedsByRoom.get(unit.id) || [],
  }));
  return NextResponse.json({ rooms, blocks: blocks || [], policy: policies?.[0] || null });
}
