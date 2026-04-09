import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rooms, roomInstances } from "@/lib/data";
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from "@/lib/email";
import { checkRoomAvailability } from "@/lib/availability";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fname, lname, phone, email,
      checkin, checkout, roomId,
      guests, guestDetails, notes, payment, total,
    } = body;

    console.log("📝 Booking request received:", { fname, lname, phone, email, roomId });

    // Validate required fields
    if (!fname || !lname || !phone || !checkin || !checkout || !roomId || !email) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields: fname, lname, phone, email, checkin, checkout, roomId" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate date format and logical order
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkin) || !dateRegex.test(checkout)) {
      console.error("❌ Invalid date format");
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkoutDate <= checkinDate) {
      console.error("❌ Invalid date logic");
      return NextResponse.json({ error: "Checkout must be after checkin" }, { status: 400 });
    }

    // Enforce 3-month advance booking limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxBookingDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    if (checkinDate > maxBookingDate) {
      console.error("❌ Booking too far in advance");
      return NextResponse.json({ error: "Booking cannot be more than 3 months in advance" }, { status: 400 });
    }

    // Enforce checkin must be today or later
    if (checkinDate < today) {
      console.error("❌ Check-in in past");
      return NextResponse.json({ error: "Check-in date must be today or later" }, { status: 400 });
    }

    // Enforce 7-day booking duration
    const nights = Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000);
    if (nights !== 7) {
      console.error("❌ Invalid booking duration:", nights);
      return NextResponse.json({ error: "Booking must be exactly 7 days" }, { status: 400 });
    }

    // Check room availability - CRITICAL STEP
    console.log("🔍 Checking room availability:", { roomId, checkin, checkout });
    const roomAvailable = await checkRoomAvailability(roomId, checkin, checkout);
    if (!roomAvailable) {
      console.error("❌ Room not available");
      return NextResponse.json({ 
        error: "This room is not available for the selected dates. Please choose different dates or room." 
      }, { status: 409 });
    }

    // Calculate expected total for validation
    const roomInstance = roomInstances.find(r => r.id === roomId);
    const roomCategory = roomInstance ? rooms.find(r => r.id === roomInstance.categoryId) : null;
    const roomRate = roomCategory?.adult1 ?? roomCategory?.adult2 ?? 0;
    const expectedTotal = roomRate * nights * (guestDetails?.length || 1);

    console.log("💰 Price calculation:", { roomRate, nights, guests: guestDetails?.length, expectedTotal, provided: total });

    // Validate total (allow small rounding differences)
    if (Math.abs(total - expectedTotal) > 1000) {
      console.error("❌ Invalid total amount");
      return NextResponse.json({ error: "Invalid total amount. Expected: " + expectedTotal + ", Got: " + total }, { status: 400 });
    }

    // Check for mixed gender rule - male and female cannot be in same room
    if (guestDetails && guestDetails.length > 0) {
      const genders = guestDetails.map((g: { gender: string }) => g.gender).filter((g: string) => g);
      const hasMale = genders.includes("male");
      const hasFemale = genders.includes("female");

      if (hasMale && hasFemale) {
        console.error("❌ Mixed genders not allowed");
        return NextResponse.json({ error: "Male and female guests cannot share the same room" }, { status: 400 });
      }

      // Check if room already has opposite gender
      const [{ data: existingBookings }] = await Promise.all([
        supabaseAdmin
          .from("bookings")
          .select("guest_details")
          .eq("room_id", roomId)
          .neq("status", "cancelled")
          .lt("check_in", checkout)
          .gt("check_out", checkin),
      ]);

      const existingGenders = (existingBookings || []).flatMap(b => b.guest_details || []).map(g => g.gender).filter(g => g);
      const existingHasMale = existingGenders.includes("male");
      const existingHasFemale = existingGenders.includes("female");

      if ((hasMale && existingHasFemale) || (hasFemale && existingHasMale)) {
        console.error("❌ Room has opposite gender");
        return NextResponse.json({ error: "This room already has guests of the opposite gender. Mixed genders are not allowed." }, { status: 400 });
      }
    }

    // Generate booking reference
    const ref = `SKH-${Date.now().toString().slice(-6)}`;

    // Generate special code for client verification
    const specialCode = generateSpecialCode();

    console.log("🔐 Generated codes:", { ref, specialCode });

    // Save to Supabase
    let insertData: Record<string, unknown> = {
      ref,
      fname, lname, phone, email,
      check_in: checkin,
      check_out: checkout,
      room_id: roomId,
      guests: parseInt(guests) || 1,
      notes,
      payment: payment || "cash",
      total: total || 0,
      status: "pending",
      special_code: specialCode,
    };

    // Add new columns if they exist in the schema
    if (guestDetails && guestDetails.length > 0) {
      insertData.guest_details = guestDetails;
    }

    console.log("💾 Inserting booking to database:", insertData);

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }

    console.log("✅ Booking saved to database:", data);

    // Send confirmation emails
    try {
      await sendBookingConfirmationEmail({
        ref,
        fname,
        lname,
        email: email || "",
        phone,
        room_id: roomId,
        check_in: checkin,
        check_out: checkout,
        guests: parseInt(guests) || 1,
        total: total || 0,
        payment: payment || "cash",
        special_code: specialCode,
      });

      await sendAdminNotificationEmail({
        ref,
        fname,
        lname,
        email: email || "",
        phone,
        room_id: roomId,
        check_in: checkin,
        check_out: checkout,
        guests: parseInt(guests) || 1,
        total: total || 0,
        payment: payment || "cash",
      });
    } catch (emailErr) {
      console.error("⚠️ Email failed (booking still successful):", emailErr);
      // Don't fail the booking if email fails
    }

    console.log("🎉 Booking completed successfully!");
    return NextResponse.json({ success: true, ref, id: data.id, specialCode });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Booking error:", errorMsg);
    return NextResponse.json({ error: errorMsg || "Failed to save booking" }, { status: 500 });
  }
}


function generateSpecialCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
