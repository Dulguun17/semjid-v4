import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "otgonbatzolboo@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fname, lname, phone, email,
      checkin, checkout, roomId, svcIds,
      guests, notes, payment, total,
    } = body;

    // Validate required fields
    if (!fname || !lname || !phone || !checkin || !checkout || !roomId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate booking reference
    const ref = `SKH-${Date.now().toString().slice(-6)}`;

    // Save to Supabase
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        ref,
        fname, lname, phone, email,
        check_in: checkin,
        check_out: checkout,
        room_id: roomId,
        treatments: svcIds || [],
        guests: parseInt(guests) || 1,
        notes,
        payment: payment || "cash",
        total: total || 0,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification to admin via Supabase Edge or fallback
    try {
      await sendAdminEmail({ ref, fname, lname, phone, email, checkin, checkout, roomId, total, payment, notes, svcIds });
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({ success: true, ref, id: data.id });
  } catch (err: unknown) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Failed to save booking" }, { status: 500 });
  }
}

async function sendAdminEmail(b: {
  ref: string; fname: string; lname: string; phone: string; email: string;
  checkin: string; checkout: string; roomId: string; total: number;
  payment: string; notes: string; svcIds: string[];
}) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fbfd;padding:24px;border-radius:12px;">
      <div style="background:#0d7377;padding:20px 24px;border-radius:8px;margin-bottom:20px;">
        <h1 style="color:white;margin:0;font-size:20px;">🏥 Шинэ захиалга ирлээ!</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Сэмжид Хүжирт Рашаан Сувилал</p>
      </div>
      <div style="background:white;padding:20px;border-radius:8px;margin-bottom:16px;">
        <h2 style="font-size:14px;color:#64748b;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Захиалгын дугаар: <span style="color:#0d7377;">${b.ref}</span></h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Нэр:</td><td style="padding:8px 0;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.fname} ${b.lname}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Утас:</td><td style="padding:8px 0;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">И-мэйл:</td><td style="padding:8px 0;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.email || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Ирэх өдөр:</td><td style="padding:8px 0;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.checkin}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Явах өдөр:</td><td style="padding:8px 0;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.checkout}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Өрөө:</td><td style="padding:8px 0;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.roomId}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Төлбөр:</td><td style="padding:8px 0;color:#1e293b;border-bottom:1px solid #f1f5f9;">${b.payment}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Нийт дүн:</td><td style="padding:8px 0;font-weight:700;color:#0d7377;font-size:16px;">${new Intl.NumberFormat("mn-MN").format(b.total)}₮</td></tr>
        </table>
        ${b.notes ? `<div style="margin-top:12px;padding:12px;background:#f8fbfd;border-radius:6px;font-size:13px;color:#64748b;"><strong>Тэмдэглэл:</strong> ${b.notes}</div>` : ""}
      </div>
      <div style="text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" style="display:inline-block;background:#0d7377;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Admin хэсэгт нэвтрэх →</a>
      </div>
      <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">Сэмжид Хүжирт Рашаан Сувилал · 8802-1191</p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Semjid Booking <booking@semjid.mn>",
      to: ADMIN_EMAIL,
      subject: `🏥 Шинэ захиалга: ${b.fname} ${b.lname} — ${b.ref}`,
      html,
    }),
  });
}
