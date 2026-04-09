/**
 * Chat & Booking Test API - Manual Testing Guide
 * 
 * This file contains examples of API calls you can make to test
 * different admin response patterns in the chat system.
 */

// ================================================================
// 1. SEND TEST CUSTOMER MESSAGES (via ChatWidget)
// ================================================================

// These simulate customers sending messages through the chat widget
const customerMessages = {
  issue1_temperature: {
    sessionId: "session-customer-1",
    senderName: "Баяр Монгол",
    message: "Өрөөний температур хүйтэн байна. Дээд дэвсгэр нэмж өгөх боломж байна уу?",
  },
  issue2_wifi: {
    sessionId: "session-customer-2",
    senderName: "Цагаан Сүхбаатар",
    message: "Вай-фай холбогдоход бэрхшээл байна. Туслаарай!",
  },
  issue3_schedule: {
    sessionId: "session-customer-3",
    senderName: "Доржа Баттулга",
    message: "Эмчилгээний графикаа сөрөг дээр авч болох уу?",
  },
  issue4_roomchange: {
    sessionId: "session-customer-4",
    senderName: "Энхбаяр Намжилдорж",
    message: "Өрөөнийхөө сөрөг өөрчлөх хэрэгтэй байна",
  },
  issue5_checkout: {
    sessionId: "session-customer-5",
    senderName: "Амарзая Сүхбаатар",
    message: "Чекаутын цаг сөргөлжүүлэх боломж байна уу?",
  },
};

/**
 * POST /api/chat
 * Send a customer message
 */
async function sendCustomerMessage(issue: string) {
  const msg = customerMessages[issue as keyof typeof customerMessages];
  
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });

  const data = await response.json();
  console.log(`✅ Customer message sent:`, data);
  return data;
}

// Example usage:
// await sendCustomerMessage("issue1_temperature");

// ================================================================
// 2. ADMIN RESPONSE PATTERNS - Quick Confirmation
// ================================================================

const quickConfirmationResponses = {
  temperature: "Яасч байна? Даруй халаагч асааж өгье. 5 минутаар хүргэнэ!",
  simple: "Яасч байна! Даруй засна.",
  urgent: "Чандалгүй асуух асуулт биз. Шууд хүргэнэ.",
};

/**
 * POST /api/chat/reply
 * Admin sends a QUICK response (immediate acknowledgment)
 */
async function sendQuickResponse(sessionId: string, responseText: string) {
  const response = await fetch("/api/chat/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      message: responseText,
    }),
  });

  const data = await response.json();
  console.log(`✅ Quick response sent:`, data);
  return data;
}

// Example: Test immediate response to temperature issue
// await sendQuickResponse("session-customer-1", quickConfirmationResponses.temperature);

// ================================================================
// 3. ADMIN RESPONSE PATTERNS - Troubleshooting Steps
// ================================================================

const troubleshootingResponses = {
  wifiSteps:
    "1️⃣ Сум асаалтаа унагаа\n2️⃣ 30 сек хүлээ\n3️⃣ Дахин холбоё\n\nБайхгүй болвол утас яв: 8802-1191",
  wifiEscalation: "Маргаангүй. IT-д даруй нэрэлүүлэв. 5 минутаар хүргэнэ.",
  wifiExplanation:
    "Вай-фай сөргээж байна. Энэ нь ямар нэгэн системийн асуудал. Машин дээр зогсоов.",
};

/**
 * Admin sends STEP-BY-STEP troubleshooting response
 */
async function sendTroubleshooting(sessionId: string) {
  // Send first message with steps
  await sendQuickResponse(sessionId, troubleshootingResponses.wifiSteps);

  // After 2 seconds, send follow-up if not resolved
  setTimeout(
    () =>
      sendQuickResponse(
        sessionId,
        "Холбогдсон уу? Эсвэл дахин туслалцаа хэрэгтэй юу?"
      ),
    2000
  );
}

// ================================================================
// 4. ADMIN RESPONSE PATTERNS - Clarifying Questions
// ================================================================

const clarifyingResponses = {
  askForDetails:
    "Таныг ойлгосон. Ямар төрлийн эмчилгээцийн цаг шилжүүлэхийг хүснэ? 💆",
  askForTimeSlot: "Ямар цагаар хүнээнэ? Манай цайны лауж 9-11 ба 15-17 уу.",
  askForRoomType: "Чи ямар төрлийн өрөө хүсэж байна? Ганцар эсвэл аль болох том?",
};

/**
 * Admin sends CLARIFYING questions to get more info
 */
async function sendClarifyingQuestion(sessionId: string, questionType: string) {
  const question =
    clarifyingResponses[questionType as keyof typeof clarifyingResponses] ||
    "Та юу хайж байна вэ?";

  // First: Ask question
  await sendQuickResponse(sessionId, question);

  // Wait for customer response (simulated 3 second delay)
  setTimeout(() => {
    console.log(
      `⏰ Waiting for customer response to clarifying question...`
    );
  }, 3000);
}

// ================================================================
// 5. ADMIN RESPONSE PATTERNS - Upselling / Offers
// ================================================================

const upsellResponses = {
  massageOffer:
    "💆 Сайн сонголт! Манай массаж 100,000₮ нэг сеанс. Цалингийн авалтад захиалж болно!",
  discountOffer:
    "✨ Энэ сар 20% хөнгөлөлт байна! 5+ сеанс авбал 15% улам өндөр хөнгөлөлт.",
  bundleOffer:
    "📦 Спортын багц 150,000₮: жүүрлүүр + массаж + йога. Өнөөдрөөс хүчинтэй!",
};

/**
 * Admin sends UPSELLING response with offers/packages
 */
async function sendUpsellResponse(sessionId: string, offerType: string) {
  const offer =
    upsellResponses[offerType as keyof typeof upsellResponses] ||
    "Нэмэлт үйлчилгээ байна!";

  await sendQuickResponse(sessionId, offer);

  // Follow-up question
  setTimeout(
    () =>
      sendQuickResponse(sessionId, "Та сонирхолтой юу? Цаг захиалах уу? 📅"),
    2000
  );
}

// ================================================================
// 6. ADMIN RESPONSE PATTERNS - Empathy + Solution
// ================================================================

const empathyResponses = {
  complaint1:
    "😟 Уучлаарай! Энэ дараа шилжүүлэй. Чанда үнэгүй боллоо.",
  complaint2:
    "😞 Та илүүхэн эхээрэй гэж гомдлоо. Юу болсныг тайлбарла уу? Бид яасахьа авч болно?",
  complaint3:
    "🙏 Ойлгосон. Энэ асуудал аль болох хурдан шийдвэрлэнэ. Менежер холбоо барина.",
};

/**
 * Admin sends EMPATHY response to complaints
 */
async function sendEmpathyResponse(sessionId: string, complaintType: string) {
  const empathy =
    empathyResponses[complaintType as keyof typeof empathyResponses] ||
    "Уучлаарай!";

  // Show empathy first
  await sendQuickResponse(sessionId, empathy);

  // Provide solution after 2 seconds
  setTimeout(
    () =>
      sendQuickResponse(
        sessionId,
        "Та нарт чанда өгөх болно эсвэл дараа сөргөлжүүлэнэ. Аль нь хүнээнэ?"
      ),
    2000
  );
}

// ================================================================
// 7. ADMIN RESPONSE PATTERNS - Escalation
// ================================================================

const escalationResponses = {
  managerNeeded:
    "Энэ асуудал нарийн. Менежертэй яриулна. Утас явахаа хүлээнэ үү? 📞",
  itSupport:
    "IT-г нэрэлүүлэв. Тэд л санаа үзэнэ. 5-10 минутын дотор хүргэнэ.",
  generalManager:
    "Энэ асуудлыг өндрийн гүүгэлийн дэргээ авч явна. 2 цагаар хариу авна.",
};

/**
 * Admin sends ESCALATION message to higher authority
 */
async function sendEscalation(sessionId: string, escalationType: string) {
  const escalation =
    escalationResponses[escalationType as keyof typeof escalationResponses] ||
    "Энэ асуудлыг өндрийн дэргээ авч явна.";

  // Inform customer of escalation
  await sendQuickResponse(sessionId, escalation);

  // Update status
  console.log(`📤 Ticket escalated for session: ${sessionId}`);
}

// ================================================================
// 8. GET CHAT HISTORY
// ================================================================

/**
 * GET /api/chat?sessionId=...
 * Retrieve all messages in a chat session
 */
async function getChatHistory(sessionId: string) {
  const response = await fetch(`/api/chat?sessionId=${sessionId}`);
  const data = await response.json();

  console.log(`📋 Chat history for ${sessionId}:`);
  data.messages.forEach((msg: any) => {
    const sender = msg.sender === "admin" ? "👨‍💼 Admin" : "👤 Customer";
    console.log(`  ${sender}: ${msg.message}`);
  });

  return data.messages;
}

// ================================================================
// 9. MULTIPLE FOLLOW-UP RESPONSES
// ================================================================

/**
 * Admin sends multiple messages in sequence to continue conversation
 */
async function sendMultipleFollowups(
  sessionId: string,
  responses: string[],
  delayBetweenMs: number = 1000
) {
  for (let i = 0; i < responses.length; i++) {
    await new Promise((resolve) =>
      setTimeout(resolve, delayBetweenMs * i)
    );
    await sendQuickResponse(sessionId, responses[i]);
  }
}

// Example: Complex follow-up conversation
// const followups = [
//   "Спортын хэрэглүүр байна. Ямар төрөл хэрэгтэй?",
//   "Эргүүлэх замаа дурын цагаар нээлттэй.",
//   "Гаршилд үзүүлэх болно. Утас: 8802-1191",
// ];
// await sendMultipleFollowups("session-customer-6", followups, 1000);

// ================================================================
// 10. TEST COMPREHENSIVE CONVERSATION FLOW
// ================================================================

/**
 * Full test scenario: Customer issue → Clarification → Solution
 */
async function testComprehensiveFlow() {
  const sessionId = "test-comprehensive-flow";

  console.log("🎬 Starting comprehensive test flow...\n");

  // Step 1: Customer sends issue
  console.log("1️⃣ Customer sends initial message...");
  await sendCustomerMessage("issue1_temperature");

  // Step 2: Admin asks clarifying question
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("2️⃣ Admin asks for clarification...");
  await sendClarifyingQuestion(
    sessionId,
    "askForDetails"
  );

  // Step 3: Simulate customer response (would be real in production)
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("3️⃣ (Simulated) Customer responds...");

  // Step 4: Admin provides solution
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("4️⃣ Admin provides solution...");
  await sendQuickResponse(
    sessionId,
    "Daruу halaagtag asaatai ögnö. 5 minutaär hürgene!"
  );

  // Step 5: Offer upsell
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("5️⃣ Admin offers additional service...");
  await sendUpsellResponse(sessionId, "massageOffer");

  console.log("\n✅ Comprehensive flow complete!\n");
}

// ================================================================
// TESTING COMMANDS (Copy-paste these into browser console)
// ================================================================

/**
 * QUICK TEST SUITE - Run all tests
 */
const testSuite = {
  test1_quickResponse: () =>
    sendQuickResponse(
      "session-customer-1",
      "Яасч байна? Даруй засна!"
    ),

  test2_troubleshooting: () =>
    sendTroubleshooting("session-customer-2"),

  test3_clarifyingQuestion: () =>
    sendClarifyingQuestion(
      "session-customer-3",
      "askForTimeSlot"
    ),

  test4_upsell: () =>
    sendUpsellResponse("session-customer-5", "massageOffer"),

  test5_empathy: () =>
    sendEmpathyResponse("session-customer-4", "complaint1"),

  test6_escalation: () =>
    sendEscalation("session-customer-6", "managerNeeded"),

  test7_getHistory: () =>
    getChatHistory("session-customer-1"),

  test8_comprehensive: () =>
    testComprehensiveFlow(),

  testAll: async function () {
    console.log("🚀 Running ALL tests...\n");
    for (const [name, testFn] of Object.entries(this)) {
      if (name !== "testAll") {
        console.log(`\n▶️ ${name}...`);
        await testFn();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    console.log("\n✅ All tests complete!");
  },
};

// ================================================================
// EXPORT FOR USE IN BROWSER CONSOLE
// ================================================================

if (typeof window !== "undefined") {
  (window as any).testSuite = testSuite;
  console.log("✅ Test suite loaded. Use testSuite.[functionName]() to run tests");
  console.log("   Example: testSuite.test1_quickResponse()");
  console.log("   Or: testSuite.testAll() to run everything");
}

export {
  sendCustomerMessage,
  sendQuickResponse,
  sendTroubleshooting,
  sendClarifyingQuestion,
  sendUpsellResponse,
  sendEmpathyResponse,
  sendEscalation,
  getChatHistory,
  sendMultipleFollowups,
  testComprehensiveFlow,
};
