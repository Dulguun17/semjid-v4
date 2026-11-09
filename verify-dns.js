import { Resend } from "resend";
import { config } from "dotenv";

config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);

export async function verifyDNSRecords() {
  try {
    console.log("🔍 Verifying DNS records for semjidkhujirt.com...");

    // Check domain status
    const response = await resend.domains.list();
    const domains = response.data?.data || [];

    const domain = domains.find(d => d.name === 'semjidkhujirt.com');

    if (!domain) {
      console.log("❌ Domain semjidkhujirt.com not found in Resend");
      return;
    }

    console.log(`📋 Domain: ${domain.name}`);
    console.log(`   Status: ${domain.status}`);
    console.log(`   ID: ${domain.id}`);

    if (domain.status === 'verified') {
      console.log("✅ Domain is verified! Customer emails will now work.");
      console.log("   Update your email code to send to customers:");
      console.log(`   from: "booking@semjidkhujirt.com"`);
      console.log(`   to: booking.email`);
    } else {
      console.log("⏳ Domain not yet verified. Check these DNS records:");

      // Use Node.js DNS lookup to check records
      const dns = await import('dns');
      const { promises: dnsPromises } = dns;

      try {
        // Check TXT record
        const txtRecords = await dnsPromises.resolveTxt('semjidkhujirt.com');
        const hasCorrectTXT = txtRecords.some(record =>
          record.some(value => value.includes(`resend-domain-verification=${domain.id}`))
        );

        console.log(`   TXT Record: ${hasCorrectTXT ? '✅ Found' : '❌ Missing'}`);

        // Check MX record
        const mxRecords = await dnsPromises.resolveMx('semjidkhujirt.com');
        const hasCorrectMX = mxRecords.some(record =>
          record.exchange.includes('resend.com')
        );

        console.log(`   MX Record: ${hasCorrectMX ? '✅ Found' : '❌ Missing'}`);

        if (hasCorrectTXT && hasCorrectMX) {
          console.log("   DNS records are set correctly. Click 'Verify' in Resend dashboard.");
        } else {
          console.log("   DNS records missing. Add them in GoDaddy DNS settings.");
        }

      } catch {
        console.log("   Could not check DNS records automatically.");
        console.log("   Use online DNS checker or wait for propagation.");
      }
    }

  } catch (error) {
    console.error("❌ Error checking domain:", error.message);
  }
}

// Run verification
verifyDNSRecords();