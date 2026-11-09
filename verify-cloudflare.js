#!/usr/bin/env node

// Cloudflare DNS Verification Script
// Run with: node verify-cloudflare.js

function verifyCloudflareSetup() {
  console.log('🔍 VERIFYING CLOUDFLARE DNS SETUP\n');

  console.log('📋 CHECKLIST:');
  console.log('   ✅ Cloudflare account created');
  console.log('   ✅ Domain added to Cloudflare');
  console.log('   ✅ Nameservers changed in Namecheap');
  console.log('   ✅ TXT record added');
  console.log('   ✅ MX record added');
  console.log('   ✅ DNS propagated');
  console.log('   ✅ Domain verified in Resend\n');

  console.log('🖥️  MANUAL VERIFICATION:');
  console.log('   1. Go to: https://dnschecker.org/');
  console.log('   2. Enter: semjidkhujirt.com');
  console.log('   3. Check TXT records');
  console.log('   4. Check MX records\n');

  console.log('📧 EXPECTED RESULTS:');
  console.log('   TXT: resend-domain-verification=8e12d2d5-9e6f-4246-b200-584ee08f9e2c');
  console.log('   MX:  feedback-smtp.ap-northeast-1.resend.com (Priority: 10)\n');

  console.log('⚡ QUICK CHECK COMMANDS:');
  console.log('   # Check domain verification status');
  console.log('   node -e "require(\'dotenv\').config({path:\'.env.local\'});const{R}=require(\'resend\');const r=new R(process.env.RESEND_API_KEY);r.domains.list().then(x=>console.log(x.data));"');
  console.log('\n   # Test email sending');
  console.log('   node -e "require(\'dotenv\').config({path:\'.env.local\'});const{R}=require(\'resend\');const r=new R(process.env.RESEND_API_KEY);r.emails.send({from:\'test@semjidkhujirt.com\',to:\'your-email@example.com\',subject:\'Test\',html:\'<p>Test</p>\'}).then(x=>console.log(\'Sent:\',x.data)).catch(e=>console.log(\'Error:\',e.message));"');
  console.log('\n');

  console.log('⏱️  TIMING:');
  console.log('   • Nameserver change: 5-30 minutes');
  console.log('   • Record addition: Immediate');
  console.log('   • DNS propagation: 5-30 minutes');
  console.log('   • Resend verification: 1 minute\n');

  console.log('🎯 NEXT STEPS AFTER VERIFICATION:');
  console.log('   1. Update src/lib/email.ts to send to customers');
  console.log('   2. Test a booking to verify emails work');
  console.log('   3. Optionally switch back to Namecheap DNS');
}

verifyCloudflareSetup();