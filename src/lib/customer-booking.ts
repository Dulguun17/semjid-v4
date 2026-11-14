import { isValidIsoDate } from "./booking-rules";

export type CustomerBedSelection = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  bedIds: string[];
  gender: "female" | "male";
};

export function parseCustomerBedSelection(input: unknown): CustomerBedSelection {
  if (!input || typeof input !== "object") throw new Error("Choose a room, dates and beds.");
  const value = input as Partial<CustomerBedSelection>;
  if (typeof value.roomId !== "string" || !value.roomId.trim() || value.roomId.length > 100
    || typeof value.checkIn !== "string" || !isValidIsoDate(value.checkIn)
    || typeof value.checkOut !== "string" || !isValidIsoDate(value.checkOut)
    || !Array.isArray(value.bedIds) || value.bedIds.length < 1 || value.bedIds.length > 20
    || value.bedIds.some(id => typeof id !== "string" || !id || id.length > 100)
    || new Set(value.bedIds).size !== value.bedIds.length
    || (value.gender !== "female" && value.gender !== "male")) {
    throw new Error("Choose valid dates and distinct beds in one room.");
  }
  return { roomId: value.roomId, checkIn: value.checkIn, checkOut: value.checkOut, bedIds: [...value.bedIds].sort(), gender: value.gender };
}

export type CustomerBookingQuote = CustomerBedSelection & { nightlyRate: string; total: string; nights: number; guests: number; canSave: boolean };

export function customerBookingStatusLabel(status: string, lang: "mn" | "en"): string {
  const labels: Record<string, { mn: string; en: string }> = {
    pending: { mn: "Хүлээгдэж байна", en: "Pending" },
    confirmed: { mn: "Баталгаажсан", en: "Confirmed" },
    checked_in: { mn: "Буудаллаж байна", en: "Checked in" },
    checked_out: { mn: "Буудал дууссан", en: "Checked out" },
    cancelled: { mn: "Цуцлагдсан", en: "Cancelled" },
    no_show: { mn: "Ирээгүй", en: "No show" },
  };
  return labels[status]?.[lang] ?? status;
}

export function customerBookingErrorMessage(status: number, lang: "mn" | "en"): string {
  const messages: Record<number, { mn: string; en: string }> = {
    400: { mn: "Огноо, зочны мэдээлэл болон үнийн саналыг шалгаад дахин оролдоно уу.", en: "Check the dates, guest details and current quote, then retry." },
    401: { mn: "Үргэлжлүүлэхийн тулд хэрэглэгчийн бүртгэлээр нэвтэрнэ үү.", en: "Sign in with a customer account to continue." },
    403: { mn: "Онлайн захиалгад баталгаажсан хэрэглэгчийн бүртгэл шаардлагатай. Ажилтан бол ажлын самбараас захиалга бүртгэнэ үү.", en: "Online booking requires a verified customer account. Staff can enter bookings in their workspace." },
    409: { mn: "Сонгосон ор эсвэл хүсэлтийг дахин шалгах шаардлагатай. Миний захиалгуудыг шалгах эсвэл сонголтоо өөрчилнө үү.", en: "The selected beds or request need review. Check My Bookings or update your selection." },
    410: { mn: "Онлайн хадгалалт энэ орчинд хаалттай байна. Хүлээн авалттай холбогдоно уу.", en: "Online saving is closed in this environment. Contact reception." },
    503: { mn: "Мэдээллийг баталгаажуулж чадсангүй. Түр хүлээгээд дахин оролдоно уу.", en: "The details could not be verified. Wait a moment and retry." },
  };
  return (messages[status] ?? messages[503])[lang];
}

export function bookingConfirmationStorageKey(userId: string) {
  return `semjid:booking-confirmation:${userId}`;
}
