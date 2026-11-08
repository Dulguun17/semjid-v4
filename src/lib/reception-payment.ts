export type ReceptionPaymentRequest = {
  booking_id: string;
  kind: "payment" | "refund";
  amount: string;
  method: "cash" | "bank_transfer";
  status: "requested" | "completed" | "pending";
  received_on: string | null;
  verified: boolean;
  reference: string | null;
  note: string | null;
  reason: string | null;
  idempotency_key: string;
};

export function receptionPaymentStorageKey(bookingId: string) {
  return `semjid:reception-payment:${bookingId}`;
}

export function readReceptionPaymentAttempt(storage: Pick<Storage, "getItem">, bookingId: string): ReceptionPaymentRequest | null {
  const raw = storage.getItem(receptionPaymentStorageKey(bookingId));
  if (!raw) return null;
  const attempt = JSON.parse(raw) as ReceptionPaymentRequest;
  if (!attempt || attempt.booking_id !== bookingId || typeof attempt.idempotency_key !== "string"
    || attempt.idempotency_key.length < 8 || !/^[1-9]\d*$/.test(attempt.amount)
    || !["payment", "refund"].includes(attempt.kind)
    || !["cash", "bank_transfer"].includes(attempt.method)) {
    throw new Error("Pending payment request could not be restored.");
  }
  return attempt;
}
