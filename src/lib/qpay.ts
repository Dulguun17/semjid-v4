/**
 * QPay Integration Module
 * Handles QR code generation and payment verification for Mongolia's QPay system
 */

export type QPayPaymentType = "DIRECT_PAYMENT" | "MERCHANT_INVOICE" | "PAYMENT_REQUEST";

export interface QPayConfig {
  merchantId: string;
  apiKey: string;
  baseUrl: string; // Usually https://merchant.qpay.mn/api
}

export interface QPayInvoice {
  invoice_id: string;
  phone: string;
  amount: number;
  description: string;
  customer_name: string;
  customer_email?: string;
}

export interface QPayResponse {
  qr_image: string;
  qr_data: string;
  shortUrl?: string;
  invoiceId: string;
}

/**
 * Generate a QPay QR code for payment
 * Example usage in booking payment
 */
export async function generateQPayQR(
  config: QPayConfig,
  invoice: QPayInvoice
): Promise<QPayResponse> {
  try {
    // First, create an invoice with QPay
    const invoiceResponse = await fetch(
      `${config.baseUrl}/invoice/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          merchant_uid: config.merchantId,
          invoice_code: `INV-${invoice.invoice_id}`,
          sender_invoice_no: invoice.invoice_id,
          invoice_receiver_code: "DEFAULT",
          invoice_description: invoice.description,
          amount: invoice.amount,
          currency: "MNT",
          invoice_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sender_branch_code: "MAIN",
          receipt_phone_number: invoice.phone,
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email || "",
          notes: `Booking reference: ${invoice.invoice_id}`,
        }),
      }
    );

    if (!invoiceResponse.ok) {
      throw new Error(`QPay invoice creation failed: ${invoiceResponse.statusText}`);
    }

    const invoiceData = await invoiceResponse.json();

    // Then generate QR code
    const qrResponse = await fetch(
      `${config.baseUrl}/qr/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          invoice_id: invoiceData.invoice_id,
          qr_type: "DIRECT_PAYMENT",
        }),
      }
    );

    if (!qrResponse.ok) {
      throw new Error(`QPay QR generation failed: ${qrResponse.statusText}`);
    }

    const qrData = await qrResponse.json();

    return {
      qr_image: qrData.qr_image,
      qr_data: qrData.qr_data,
      shortUrl: qrData.short_url,
      invoiceId: invoiceData.invoice_id,
    };
  } catch (error) {
    console.error("QPay QR generation error:", error);
    throw error;
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  config: QPayConfig,
  invoiceId: string
): Promise<{
  status: "pending" | "paid" | "failed" | "cancelled";
  transactionId?: string;
  paidDate?: string;
  amount?: number;
}> {
  try {
    const response = await fetch(
      `${config.baseUrl}/invoice/get?invoice_id=${invoiceId}`,
      {
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Payment status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Map QPay status to our internal status
    let status: "pending" | "paid" | "failed" | "cancelled" = "pending";
    if (data.invoice_status === "PAID") status = "paid";
    else if (data.invoice_status === "CANCELLED") status = "cancelled";
    else if (data.invoice_status === "FAILED") status = "failed";

    return {
      status,
      transactionId: data.transaction_id,
      paidDate: data.paid_date,
      amount: data.amount,
    };
  } catch (error) {
    console.error("Payment status check error:", error);
    throw error;
  }
}

/**
 * Generate a simple payment QR data string (alternative to API)
 * Format: "https://merchant.qpay.mn/p/{data}"
 */
export function generateSimpleQPayData(
  amount: number,
  invoiceRef: string,
  description: string
): string {
  // This is a simplified implementation
  // For production, use the API-based approach above
  const data = {
    amount,
    invoiceRef,
    description,
  };
  const encoded = btoa(JSON.stringify(data));
  return `https://merchant.qpay.mn/p/${encoded}`;
}
