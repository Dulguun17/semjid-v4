import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type BookingData = {
  ref: string;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total: number;
  payment: string;
  special_code?: string;
};

// Email templates
const bookingConfirmationEmail = (booking: BookingData) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a4d3a 0%, #c9a96e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
      .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1a4d3a; }
      .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
      .label { font-weight: bold; color: #666; }
      .value { color: #333; }
      .code-box { background: #1a4d3a; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
      .code-label { font-size: 12px; opacity: 0.9; }
      .code-value { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
      .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
      .button { display: inline-block; background: #1a4d3a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Захиалга баталгаажлаа</h1>
        <p>Сэмжид Хүжирт Рашаан Сувилал</p>
      </div>
      
      <div class="content">
        <p>Сайн байна уу, ${booking.fname}!</p>
        <p>Таны захиалга амжилттай баталгаажлаа. Дараах дараалал доор үзүүлэв:</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="label">Захиалгын номер:</span>
            <span class="value">${booking.ref}</span>
          </div>
          <div class="detail-row">
            <span class="label">Ирэх огноо:</span>
            <span class="value">${new Date(booking.check_in).toLocaleDateString("mn-MN")}</span>
          </div>
          <div class="detail-row">
            <span class="label">Явах огноо:</span>
            <span class="value">${new Date(booking.check_out).toLocaleDateString("mn-MN")}</span>
          </div>
          <div class="detail-row">
            <span class="label">Өрөө:</span>
            <span class="value">${booking.room_id}</span>
          </div>
          <div class="detail-row">
            <span class="label">Зочдын тоо:</span>
            <span class="value">${booking.guests}</span>
          </div>
          <div class="detail-row">
            <span class="label">Нийт дүн:</span>
            <span class="value">₮${booking.total.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="label">Төлбөрийн хэлбэр:</span>
            <span class="value">${
              booking.payment === "cash"
                ? "Бэлэн төлбөр"
                : booking.payment === "bank"
                  ? "Банк шилжүүлэх"
                  : "QPay"
            }</span>
          </div>
        </div>

        ${
          booking.special_code
            ? `
        <div class="code-box">
          <div class="code-label">Таны нэвтрэх код (Check-in):</div>
          <div class="code-value">${booking.special_code}</div>
          <p style="margin-top: 10px; font-size: 12px; opacity: 0.9;">Ирэх үеэр энэ кодыг ашиглана уу</p>
        </div>
        `
            : ""
        }

        <p><strong>Дараагийн алхам:</strong></p>
        <ul>
          <li>📧 Энэ имэйлийг хадгалаарай - энэ таны баталгаа</li>
          <li>📞 Холбоо барих: +976 (0) 70012191</li>
          <li>🛏️ Сувилалын өмнө дахин батлуулна</li>
          <li>📄 Лимент письмо эсвэл шаардлагатай эмчилгээний лавлагаа авчрахыг мартаж орзуулалтай</li>
        </ul>

        <p>Хэрэв та захиалгаа солих эсвэл цуцлахыг хүсвэл манай байрны аашны хэсэгтэй холбоо барина уу.</p>
      </div>

      <div class="footer">
        <p>Сэмжид Хүжирт Рашаан Сувилал | www.semjid-khujirt.mn</p>
        <p>© 2026 | Бүх эрхэ хүчинтэй</p>
      </div>
    </div>
  </body>
</html>
`;

const adminNotificationEmail = (booking: BookingData) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1a4d3a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
      .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #c9a96e; }
      .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
      .label { font-weight: bold; color: #666; }
      .value { color: #333; }
      .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
      .status { display: inline-block; background: #fbbf24; color: #78350f; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📋 Шинэ захиалга хүлээлт байна</h1>
        <span class="status">ШИНЭ</span>
      </div>
      
      <div class="content">
        <p>Админ панель: ${booking.ref}</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="label">Нэр:</span>
            <span class="value">${booking.fname} ${booking.lname}</span>
          </div>
          <div class="detail-row">
            <span class="label">Утас:</span>
            <span class="value">${booking.phone}</span>
          </div>
          <div class="detail-row">
            <span class="label">И-мэйл:</span>
            <span class="value">${booking.email}</span>
          </div>
          <div class="detail-row">
            <span class="label">Өрөө:</span>
            <span class="value">${booking.room_id}</span>
          </div>
          <div class="detail-row">
            <span class="label">${new Date(booking.check_in).toLocaleDateString("mn-MN")} → ${new Date(booking.check_out).toLocaleDateString("mn-MN")}</span>
            <span class="value">${Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000)} шөнө</span>
          </div>
          <div class="detail-row">
            <span class="label">Нийт дүн:</span>
            <span class="value">₮${booking.total.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="label">Төлбөр:</span>
            <span class="value">${booking.payment}</span>
          </div>
        </div>

        <p><strong>ADMIN БАУЖ НЭЭХ:</strong></p>
        <a href="https://semjid-khujirt.mn/admin/guests" style="display: inline-block; background: #1a4d3a; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">Админ панель руу ор</a>
      </div>

      <div class="footer">
        <p>Энэ имэйл автоматаар илгээгдлээ. Админ системээс</p>
      </div>
    </div>
  </body>
</html>
`;

/** Send booking confirmation to guest */
export async function sendBookingConfirmationEmail(booking: BookingData) {
  try {
    if (!booking.email) {
      console.warn("⚠️ No guest email provided");
      return;
    }

    const response = await resend.emails.send({
      from: "Сэмжид Хүжирт Захиалга <booking@resend.dev>",
      to: booking.email,
      subject: `✅ Захиалга баталгаажлаа - ${booking.ref} | Сэмжид Хүжирт`,
      html: bookingConfirmationEmail(booking),
    });

    console.log(`✅ Booking confirmation email sent to ${booking.email}`, response);
  } catch (error) {
    console.error("❌ Failed to send booking confirmation email:", error);
    throw error;
  }
}

/** Send admin notification of new booking */
export async function sendAdminNotificationEmail(booking: BookingData) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠️ ADMIN_EMAIL not configured in .env.local");
      return;
    }

    const response = await resend.emails.send({
      from: "Сэмжид Хүжирт Админ <admin@resend.dev>",
      to: adminEmail,
      subject: `📋 Шинэ захиалга: ${booking.ref} - ${booking.fname} ${booking.lname}`,
      html: adminNotificationEmail(booking),
    });

    console.log(`✅ Admin notification email sent to ${adminEmail}`, response);
  } catch (error) {
    console.error("❌ Failed to send admin notification email:", error);
    throw error;
  }
}

/** Send chat message notification to admin */
export async function sendChatNotificationEmail(
  guestName: string,
  message: string,
  sessionId: string
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("⚠️ ADMIN_EMAIL not configured");
      return;
    }

    const response = await resend.emails.send({
      from: "Сэмжид Хүжирт Чат <chat@resend.dev>",
      to: adminEmail,
      subject: `💬 Шинэ чат мессеж: ${guestName}`,
      html: `
        <h2>Шинэ мессеж ирлээ</h2>
        <p><strong>Зочин:</strong> ${guestName}</p>
        <p><strong>Мессеж:</strong></p>
        <blockquote>${message}</blockquote>
        <a href="https://semjid-khujirt.mn/admin/chat" style="display: inline-block; background: #1a4d3a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 15px;">Чат панель руу ор</a>
      `,
    });

    console.log(`✅ Chat notification email sent to ${adminEmail}`, response);
    console.log("✅ Chat notification email sent to admin");
  } catch (error) {
    console.error("❌ Failed to send chat notification email:", error);
  }
}
