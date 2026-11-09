#!/usr/bin/env node

// Quick DNS Check Script
// Run with: node check-dns.js

function checkDNS(domain) {
  console.log(`🔍 Checking DNS records for ${domain}...\n`);

  // Check TXT record
  console.log('📝 TXT Record Check:');
  console.log('   Expected: resend-domain-verification=8e12d2d5-9e6f-4246-b200-584ee08f9e2c');

  // Check MX record
  console.log('\n📧 MX Record Check:');
  console.log('   Expected: feedback-smtp.ap-northeast-1.resend.com (Priority: 10)');

  console.log('\n🌐 How to check manually:');
  console.log('   1. Go to https://dnschecker.org/');
  console.log(`   2. Enter: ${domain}`);
  console.log('   3. Check TXT and MX records');
  console.log('   4. Look for the values above');

  console.log('\n⚠️  If records are missing:');
  console.log('   - Add them in Namecheap Advanced DNS');
  console.log('   - Wait 5-30 minutes');
  console.log('   - Then verify in Resend dashboard');
}

checkDNS('semjidkhujirt.com');