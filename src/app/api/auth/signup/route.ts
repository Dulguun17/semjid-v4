import { createClient } from "@supabase/supabase-js";
import { readJsonObject, RequestInputError } from "@/lib/request-validation";
import { NextResponse } from "next/server";
import { emailConfirmationRequired } from "@/lib/email-otp-config";
import { normalizeEmail } from "@/lib/customer-auth";

const otpSetupError = () => NextResponse.json({
  error: "Email verification is temporarily unavailable. Try again later.",
  code: "otp_setup_required",
}, { status: 503, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const body: unknown = await readJsonObject(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid signup request." }, { status: 400 });
    }

    const { email, password, firstName, lastName, phone } = body as {
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      phone?: unknown;
    };

    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain both letters and numbers." },
        { status: 400 }
      );
    }

    if ([firstName, lastName].some(value => value !== undefined && (typeof value !== "string" || value.length > 100))
      || (phone !== undefined && (typeof phone !== "string" || phone.length > 30))) throw new RequestInputError("Invalid contact details.");
    const emailOtpEnabled = process.env.CUSTOMER_EMAIL_OTP_ENABLED === "true";
    if (emailOtpEnabled && !await emailConfirmationRequired()) return otpSetupError();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        data: {
          first_name: typeof firstName === "string" ? firstName : "",
          last_name: typeof lastName === "string" ? lastName : "",
          phone: typeof phone === "string" ? phone : "",
        },
      },
    });

    if (error) {
      console.error("Signup failed", { code: error.code });
      return NextResponse.json({ error: "Unable to create account. Check your details or try signing in." }, { status: error.status === 429 ? 429 : 400 });
    }

    // A settings change during signup must never turn the code flow into auto-confirmation.
    if (emailOtpEnabled && data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return otpSetupError();
    }

    return NextResponse.json(
      {
        message: "Check your email to continue.",
        confirmationRequired: !data.session,
        verification: emailOtpEnabled ? "email_otp" : "email_link",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof RequestInputError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
