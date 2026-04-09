import { NextRequest, NextResponse } from "next/server";
import { generateQPayQR, generateSimpleQPayData } from "@/lib/qpay";

/**
 * Generate QPay QR code for a booking payment
 * POST /api/payment/qpay-qr
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      invoiceRef,
      description,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    // Validation
    if (!amount || !invoiceRef || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if QPay API credentials are configured
    const merchantId = process.env.QPAY_MERCHANT_ID;
    const apiKey = process.env.QPAY_API_KEY;

    if (!merchantId || !apiKey) {
      // Fallback: Generate simple QPay data
      const qpayData = generateSimpleQPayData(amount, invoiceRef, description);
      return NextResponse.json({
        success: true,
        method: "simple",
        qr_data: qpayData,
        note: "Using simplified QPay integration. Configure QPAY_MERCHANT_ID and QPAY_API_KEY for full integration.",
      });
    }

    // Full API integration
    try {
      const qpayResponse = await generateQPayQR(
        {
          merchantId,
          apiKey,
          baseUrl: process.env.QPAY_BASE_URL || "https://merchant.qpay.mn/api",
        },
        {
          invoice_id: invoiceRef,
          phone: customerPhone || "",
          amount: Number(amount),
          description,
          customer_name: customerName || "Guest",
          customer_email: customerEmail,
        }
      );

      return NextResponse.json({
        success: true,
        method: "api",
        ...qpayResponse,
      });
    } catch (qpayError) {
      console.error("QPay API error, falling back to simple method:", qpayError);

      // Fallback to simple method
      const qpayData = generateSimpleQPayData(amount, invoiceRef, description);
      return NextResponse.json({
        success: true,
        method: "simple_fallback",
        qr_data: qpayData,
        error_note: "Full QPay API failed, using simplified integration",
      });
    }
  } catch (error) {
    console.error("QPay QR generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate QPay QR code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Check payment status
 * GET /api/payment/qpay-status?invoiceId={id}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    // For now, return pending status
    // In production, query the booking status from database
    return NextResponse.json({
      status: "pending",
      invoiceId,
      message: "Payment status checking available when configured with QPay API",
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
