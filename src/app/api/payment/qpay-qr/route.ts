import { NextResponse } from "next/server";

function notConnected() {
  return NextResponse.json(
    { error: "Online payment is not connected." },
    { status: 410 }
  );
}

export async function GET() {
  return notConnected();
}

export async function POST() {
  return notConnected();
}
