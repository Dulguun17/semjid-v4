import { Suspense } from "react";
import { CustomerAuth } from "@/components/auth/CustomerAuth";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-[70vh]" aria-busy="true" />}>
      <CustomerAuth key="signup" mode="signup" emailOtpEnabled={process.env.CUSTOMER_EMAIL_OTP_ENABLED === "true"} />
    </Suspense>
  );
}
