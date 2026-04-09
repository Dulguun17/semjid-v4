import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Different response patterns with examples
const responsePatterns = {
  quickConfirmation: [
    "Яасч байна? Даруй засна.",
    "Зүр авч байна! 5 минутаар хүргэнэ.",
    "Чандалгүй асуух асуулт биз. Шууд засна.",
  ],

  troubleshootingSteps: [
    "1. Сум асаалтаа унагаа\n2. 30 сек хүлээ\n3. Дахин холбоё",
    "Маргаангүй. IT-д контролийн сууга - 2 минутын дотор.",
    "Вай-фай сэргээнэ үү самбаруудыг. Дараа холбоё.",
  ],

  clarifyingQuestion: [
    "Ямар эмчилгээний цаг шилжүүлэхийг хүсье?",
    "Чи ямар төрлийн өрөө хүсэж байна?",
    "Чи хэдэн бүрэлдэхүүний өрөө хэрэгтэй юу?",
  ],

  upselling: [
    "Сайн сонголт! Манай массаж 100,000₮. Цалингийн авалтад захиал!",
    "Энэ сар 20% хөнгөлөлт байна. 5+ сеанс авбал!",
    "Спортын багц 150,000₮. Спортын хэрэглүүр + массаж + йога.",
  ],

  empathy: [
    "Уучлаарай! Энэ дараа шилжүүлэй. Чанда үнэгүй.",
    "Та илүүхэн эхээрэй гэж гомдлоо. Бид яасахьа авч болно?",
    "Ойлгосон. Энэ асуудал аль болох хурдан шийдвэрлэнэ.",
  ],

  escalation: [
    "Менежертэй яриулна. Холбоо барь. Асуугаа бишлэв.",
    "IT-г нэрэлүүлэв. Утас явахаа хүлээнэ үү?",
    "6 Гүүгэлийн өндөрлөгт хүрүүлнэ. 2 цагаар хариу авна.",
  ],

  multiStep: [
    "Холбоо баримуу. Та нарт сонголт өгнө.",
    "Дараа: 1. Нэр\n2. Хаяг\n3. Утас дугаар",
    "Энэ тохиолдолд урьдчилан төлбөр хэрэгтэй. Картан байна уу?",
  ],
};

async function addAdminResponsesTest() {
  try {
    console.log("🤖 Adding different admin response patterns to test bookings...\n");

    // Get all bookings with chat messages
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("session_id, sender_name")
      .eq("sender", "client")
      .order("created_at", { ascending: false })
      .limit(20);

    if (msgError || !messages) {
      console.error("❌ Error fetching messages:", msgError);
      process.exit(1);
    }

    console.log(`Found ${messages.length} client messages\n`);

    // Group by session
    const sessions = [...new Set(messages.map((m) => m.session_id))];

    // Add responses with different patterns
    const responses: any[] = [];
    const patterns = Object.entries(responsePatterns);

    for (let i = 0; i < sessions.length; i++) {
      const sessionId = sessions[i];
      const patternName = patterns[i % patterns.length][0];
      const patternResponses = patterns[i % patterns.length][1];
      const responseText = patternResponses[i % patternResponses.length];

      responses.push({
        session_id: sessionId,
        sender: "admin",
        sender_name: "Сувилалын ажилтан",
        message: responseText,
      });

      console.log(
        `${i + 1}. [${patternName}] Session: ${sessionId.substring(0, 15)}...`
      );
      console.log(`   Response: "${responseText.substring(0, 60)}..."\n`);
    }

    // Insert admin responses
    const { data: insertedResponses, error: respError } = await supabase
      .from("chat_messages")
      .insert(responses)
      .select();

    if (respError) {
      console.error("❌ Error inserting responses:", respError);
      process.exit(1);
    }

    console.log("=".repeat(60));
    console.log("✅ TEST RESPONSES ADDED");
    console.log("=".repeat(60));
    console.log(`✅ Added ${insertedResponses.length} admin responses\n`);

    // Display summary stats
    console.log("📊 Response Pattern Summary:");
    patterns.forEach(([name, responses], idx) => {
      const count = responses.length;
      console.log(`  • ${name}: ${count} variations available`);
    });

    console.log("\n🎯 Response Patterns Used:");
    const patternCounts: Record<string, number> = {};
    responses.forEach((r, idx) => {
      const patternName = patterns[idx % patterns.length][0];
      patternCounts[patternName] = (patternCounts[patternName] || 0) + 1;
    });

    Object.entries(patternCounts).forEach(([name, count]) => {
      console.log(`  • ${name}: ${count} responses`);
    });

    console.log("\n💬 Sample Admin Responses:");
    responses.slice(0, 3).forEach((r, idx) => {
      console.log(`  ${idx + 1}. "${r.message}"`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✨ ADMIN RESPONSES TEST COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📌 Next Steps:");
    console.log("  1. Visit: http://localhost:3000/admin/chat");
    console.log("  2. Verify each session has both:");
    console.log("     ✓ Customer message");
    console.log("     ✓ Admin response");
    console.log("  3. Try clicking on different conversations");
    console.log("  4. Send additional responses to test different patterns\n");

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

addAdminResponsesTest();
