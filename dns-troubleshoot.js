#!/usr/bin/env node

// DNS Troubleshooting Script
// Run with: node dns-troubleshoot.js

function troubleshootDNS() {
  console.log('🔧 DNS TROUBLESHOOTING FOR semjidkhujirt.com\n');

  console.log('📋 REQUIRED RECORDS:');
  console.log('   TXT: resend-domain-verification=8e12d2d5-9e6f-4246-b200-584ee08f9e2c');
  console.log('   MX:  feedback-smtp.ap-northeast-1.resend.com (Priority: 10)\n');

  console.log('🖥️  MANUAL CHECK STEPS:');
  console.log('   1. Go to: https://dnschecker.org/');
  console.log('   2. Enter: semjidkhujirt.com');
  console.log('   3. Check TXT records tab');
  console.log('   4. Check MX records tab');
  console.log('   5. Look for the values above\n');

  console.log('❌ IF MX RECORD TYPE IS MISSING IN NAMECHEAP:');
  console.log('   • Make sure you\'re in "Advanced DNS" tab (not Nameservers)');
  console.log('   • Try refreshing the page');
  console.log('   • Contact Namecheap support to enable MX records');
  console.log('   • Alternative: Use Cloudflare DNS temporarily\n');

  console.log('📞 NAMECHEAP SUPPORT:');
  console.log('   • https://www.namecheap.com/support/tickets/new/');
  console.log('   • Subject: "MX record type missing in Advanced DNS"');
  console.log('   • Include: Domain name and screenshot of DNS page\n');

  console.log('⏱️  TIMELINE:');
  console.log('   • Contact support: 5 minutes');
  console.log('   • Support response: 1-24 hours');
  console.log('   • Add records: 5 minutes');
  console.log('   • DNS propagation: 5-30 minutes');
  console.log('   • Verification: 1 minute\n');

  console.log('✅ AFTER FIXING:');
  console.log('   1. Add both TXT and MX records');
  console.log('   2. Wait 30 minutes');
  console.log('   3. Go to resend.com/domains');
  console.log('   4. Click "Verify"');
  console.log('   5. Update email code to send to customers');
}

troubleshootDNS();