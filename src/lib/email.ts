export type BookingNotice = {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  room: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  agreedPrice: number;
  lang?: "mn" | "en";
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type EmailTransport = (message: EmailMessage) => Promise<void>;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
}[character] ?? character));

const layout = (title: string, body: string) => `
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6">
    <main style="max-width:600px;margin:0 auto;padding:24px">
      <h1 style="color:#115e59">${title}</h1>
      ${body}
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#64748b;font-size:13px">Semjid Khujirt · Online booking is currently closed.</p>
    </main>
  </body>
</html>`;

function bookingSummary(booking: BookingNotice) {
  return `
    <dl>
      <dt>Reference</dt><dd>${escapeHtml(booking.reference)}</dd>
      <dt>Room</dt><dd>${escapeHtml(booking.room)}</dd>
      <dt>Stay</dt><dd>${escapeHtml(booking.checkIn)} – ${escapeHtml(booking.checkOut)}</dd>
      <dt>Guests</dt><dd>${booking.guests}</dd>
      <dt>Agreed price</dt><dd>${booking.agreedPrice.toLocaleString("en-US")} MNT</dd>
    </dl>`;
}

export function renderCustomerBookingNotice(booking: BookingNotice) {
  const mn = booking.lang === "mn";
  const firstName = escapeHtml(booking.firstName);
  return layout(
    mn ? "Захиалгын хүсэлт — хүлээгдэж байна" : "Reservation request — pending",
    `<p>${mn ? `Сайн байна уу, ${firstName}!` : `Hello ${firstName},`}</p>
     <p>${mn
       ? "Энэ нь зөвхөн хүсэлт хүлээн авсан мэдэгдэл. Ажилтан баталгаажуулах хүртэл байрлах захиалга баталгаажаагүй."
       : "This message is a request receipt only. Your stay is not confirmed until staff confirms it."}</p>
     ${bookingSummary(booking)}
     <p>${mn
       ? "Онлайн төлбөр боломжгүй. Цахимаар мөнгө бүү шилжүүлнэ үү. Хүлээн авалтаас бэлэн мөнгө эсвэл ажилтнаар баталгаажуулах банкны шилжүүлгийн талаар асууна уу."
       : "Online payment is unavailable. Do not send money online. Ask reception about cash or a bank transfer verified by staff."}</p>
     <p>${mn
       ? "Цуцлалт, буцаалтын нөхцөлийг хүсэлтийг эцэслэхээс өмнө сувиллаас баталгаажуулна."
       : "Cancellation and refund terms must be confirmed with the center before the request can be finalized."}</p>`
  );
}

export function renderStaffBookingNotice(booking: BookingNotice) {
  return layout(
    "Reservation request needs review",
    `<p>Reference: ${escapeHtml(booking.reference)}</p>
     <p>Guest: ${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}</p>
     <p>Phone: ${escapeHtml(booking.phone)} · Email: ${escapeHtml(booking.email)}</p>
     ${bookingSummary(booking)}
     <p>Review and confirm this request in the staff workspace. No payment is implied.</p>`
  );
}

export function renderStaffChatNotice(guestName: string, message: string) {
  return layout(
    "New customer message",
    `<p>Guest: ${escapeHtml(guestName)}</p><blockquote>${escapeHtml(message)}</blockquote>`
  );
}

export function createLocalCaptureTransport() {
  const messages: EmailMessage[] = [];
  return {
    send: async (message: EmailMessage) => { messages.push({ ...message }); },
    getMessages: () => messages.map(message => ({ ...message })),
  };
}

export function createBookingNotificationTemplates(transport: EmailTransport) {
  return {
    sendCustomerNotice: (booking: BookingNotice) => transport({
      to: booking.email,
      subject: `Reservation request pending — ${booking.reference}`,
      html: renderCustomerBookingNotice(booking),
    }),
    sendStaffNotice: (booking: BookingNotice, recipient: string) => transport({
      to: recipient,
      subject: `Reservation request needs review — ${booking.reference}`,
      html: renderStaffBookingNotice(booking),
    }),
    sendChatNotice: (recipient: string, guestName: string, message: string) => transport({
      to: recipient,
      subject: "New customer message",
      html: renderStaffChatNotice(guestName, message),
    }),
  };
}
