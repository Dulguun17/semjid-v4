export type PaymentLedgerEntry = {
  kind: "payment" | "refund";
  status: "pending" | "requested" | "completed" | "voided";
  amount: string | number;
};

function toMinorUnits(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined || !/^-?\d+$/.test(String(value))) {
    return BigInt(0);
  }
  return BigInt(value);
}

export function calculateBookingFinancials(
  agreedPrice: string | number | null | undefined,
  entries: PaymentLedgerEntry[]
) {
  const price = toMinorUnits(agreedPrice);
  const completedPayments = entries
    .filter(entry => entry.kind === "payment" && entry.status === "completed")
    .reduce((sum, entry) => sum + toMinorUnits(entry.amount), BigInt(0));
  const completedRefunds = entries
    .filter(entry => entry.kind === "refund" && entry.status === "completed")
    .reduce((sum, entry) => sum + toMinorUnits(entry.amount), BigInt(0));
  const pendingPayments = entries
    .filter(entry => entry.kind === "payment" && entry.status === "pending")
    .reduce((sum, entry) => sum + toMinorUnits(entry.amount), BigInt(0));
  const requestedRefunds = entries
    .filter(entry => entry.kind === "refund" && entry.status === "requested")
    .reduce((sum, entry) => sum + toMinorUnits(entry.amount), BigInt(0));
  const netReceived = completedPayments - completedRefunds;
  const remainingBalance = price > netReceived ? price - netReceived : BigInt(0);
  const overpayment = netReceived > price ? netReceived - price : BigInt(0);

  const paymentState = completedPayments === BigInt(0) && completedRefunds === BigInt(0)
    ? "unrecorded"
    : netReceived <= BigInt(0) && completedRefunds > BigInt(0)
      ? "refunded"
      : overpayment > BigInt(0)
        ? "overpaid"
        : remainingBalance > BigInt(0)
          ? "partial"
          : "paid";

  return {
    agreedPrice: price.toString(),
    completedPayments: completedPayments.toString(),
    completedRefunds: completedRefunds.toString(),
    netReceived: netReceived.toString(),
    remainingBalance: remainingBalance.toString(),
    overpayment: overpayment.toString(),
    pendingPayments: pendingPayments.toString(),
    requestedRefunds: requestedRefunds.toString(),
    paymentState,
  };
}

export function formatMntAmount(value: string | number): string {
  const amount = String(value);
  if (!/^-?\d+$/.test(amount)) throw new Error("Money amounts must be whole MNT units.");
  const negative = amount.startsWith("-");
  const digits = negative ? amount.slice(1) : amount;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped} ₮`;
}
