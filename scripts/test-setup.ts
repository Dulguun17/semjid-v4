#!/usr/bin/env node

import dotenv from "dotenv";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const execAsync = promisify(exec);

async function main() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║    20 BOOKING CHATBOT TEST - Setup & Execution            ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("📋 Overview:");
  console.log("  • Generate 20 test bookings");
  console.log("  • Create 20 customer chat messages");
  console.log("  • Add 20 admin responses with different patterns");
  console.log("  • Provide testing instructions\n");

  // Step 1: Verify environment variables
  console.log("🔍 Step 1: Checking environment variables...");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("❌ Missing: NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing: SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  console.log("✅ Environment variables OK\n");

  // Step 2: Generate test bookings
  console.log("⏳ Step 2: Generating 20 test bookings...");
  try {
    await execAsync("npx tsx scripts/generate-test-bookings.ts");
    console.log("✅ Bookings generated\n");
  } catch (error: any) {
    console.error("❌ Error generating bookings:");
    console.error(error.stderr || error.message);
    process.exit(1);
  }

  // Step 3: Add admin responses
  console.log("⏳ Step 3: Adding admin response patterns...");
  try {
    await execAsync("npx tsx scripts/add-admin-responses.ts");
    console.log("✅ Admin responses added\n");
  } catch (error: any) {
    console.error("❌ Error adding responses:");
    console.error(error.stderr || error.message);
    process.exit(1);
  }

  // Step 4: Display instructions
  console.log("════════════════════════════════════════════════════════════\n");
  console.log("🎉 TEST DATA GENERATION COMPLETE!\n");
  console.log("════════════════════════════════════════════════════════════\n");

  console.log("📌 Next Steps:\n");

  console.log("1️⃣  START YOUR DEV SERVER");
  console.log("    npm run dev\n");

  console.log("2️⃣  OPEN ADMIN CHAT INTERFACE");
  console.log("    http://localhost:3000/admin/chat\n");

  console.log("3️⃣  TEST DIFFERENT RESPONSE PATTERNS\n");
  console.log("    Pattern 1: Quick Confirmation");
  console.log("      - Select a chat session");
  console.log("      - Reply with: 'Яасч байна? Даруй засна.'");
  console.log("      - ✓ Tests immediate acknowledgment\n");

  console.log("    Pattern 2: Step-by-Step Troubleshooting");
  console.log("      - Reply with:");
  console.log("        1. Сум асаалтаа унагаа");
  console.log("        2. 30 сек хүлээ");
  console.log("        3. Дахин холбоё");
  console.log("      - ✓ Tests instructional responses\n");

  console.log("    Pattern 3: Clarifying Question");
  console.log("      - Reply: 'Ямар төрлийн үйлчилгээ хэрэгтэй?'");
  console.log("      - ✓ Tests interactive clarification\n");

  console.log("    Pattern 4: Upselling");
  console.log("      - Reply: 'Массаж 100,000₮. Сонирхолтой юу?'");
  console.log("      - ✓ Tests sales-oriented responses\n");

  console.log("    Pattern 5: Empathy + Solution");
  console.log("      - Reply: 'Уучлаарай! Даруу засна.'");
  console.log("      - ✓ Tests complaint resolution\n");

  console.log("    Pattern 6: Escalation");
  console.log("      - Reply: 'Менежертэй яриулна.'");
  console.log("      - ✓ Tests handoff protocols\n");

  console.log("    Pattern 7: Multiple Follow-ups");
  console.log(
    "      - Send 2+ messages in sequence to same customer"
  );
  console.log("      - ✓ Tests conversation continuity\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("📊 Test Metrics to Track:\n");

  console.log("  ✓ Response Time: How fast does each message appear?");
  console.log("  ✓ Message Clarity: Are instructions easy to follow?");
  console.log("  ✓ Engagement: Does tone match situation?");
  console.log("  ✓ Resolution: Can customers accomplish tasks?\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("🧪 Browser CONSOLE TESTING\n");

  console.log(
    "You can also test programmatically from browser console:\n"
  );

  console.log("1. Open DevTools (F12) in your browser");
  console.log("2. Go to Console tab");
  console.log("3. Import test functions:");
  console.log('   import { testSuite } from "@/lib/chat-test-api";\n');

  console.log("4. Run individual tests:");
  console.log("   testSuite.test1_quickResponse()");
  console.log("   testSuite.test2_troubleshooting()");
  console.log("   testSuite.test3_clarifyingQuestion()");
  console.log("   testSuite.testAll() // Run all tests\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("📁 Generated Test Files:\n");

  console.log("  scripts/generate-test-bookings.ts");
  console.log("    → Creates 20 bookings + 20 customer messages\n");

  console.log("  scripts/add-admin-responses.ts");
  console.log("    → Adds 20 admin responses with different patterns\n");

  console.log("  src/lib/chat-test-api.ts");
  console.log("    → API functions for programmatic testing\n");

  console.log("  BOOKING_CHATBOT_TEST_GUIDE.md");
  console.log("    → Comprehensive test guide and scenarios\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("💡 Pro Tips:\n");

  console.log("  • Use emoji in responses (✅ 🔧 💆 📞)");
  console.log("  • Keep messages under 2-3 lines");
  console.log("  • Use numbered lists for steps");
  console.log("  • Always be polite and professional");
  console.log("  • Follow up within 2-3 messages if needed\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("🐛 Cleanup (if needed):\n");

  console.log("  Run script to remove test data:");
  console.log("  npx supabase db push --dry-run\n");

  console.log("  Or manually delete:");
  console.log("  DELETE FROM bookings WHERE ref LIKE 'SKH-100%';");
  console.log("  DELETE FROM chat_messages WHERE session_id LIKE 'session-%';\n");

  console.log("════════════════════════════════════════════════════════════\n");

  console.log("✅ Ready to test! Start with: npm run dev\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
