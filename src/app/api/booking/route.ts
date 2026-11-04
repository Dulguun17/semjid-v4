import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Online bookings are currently closed." },
    { status: 410 }
  );
}
