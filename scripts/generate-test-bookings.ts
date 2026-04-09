import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample customer names
const firstNames = [
  "Баяр", "Цагаан", "Доржа", "Энхбаяр", "Амарзая", 
  "Сарай", "Болд", "Хүүхэлбаатар", "Эрдэнэ", "Оюунчимэг",
  "Пүрэв", "Оюун", "Нямдаваа", "Сайхан", "Алтан",
  "Даваа", "Сорил", "Жавхлан", "Монхбаяр", "Цэцэг"
];

const lastNames = [
  "Монгол", "Сүхбаатар", "Баттулга", "Энхтүвшин", "Намжилдорж",
  "Цоломтоосон", "Бат-Орших", "Батмөнх", "Сарантогоо", "Хайдаб",
  "Ташдолгор", "Нарантүүл", "Батбаяр", "Мөнхжаргал", "Магсарних"
];

const roomIds = ["room-1", "room-2", "room-3", "room-4", "room-5"];

const treatments = ["massage", "herbal-bath", "mud-therapy", "water-therapy", "yoga"];

const customerIssues = [
  "Өрөөний температур хүйтэн байна. Дээд дэвсгэр нэмж өгөх боломж байна уу?",
  "Вай-фай холбогдоход бэрхшээл байна. Туслаарай!",
  "Эмчилгээний графикаа сөрөг дээр авч болох уу?",
  "Өрөөнийхөө сөрөг өөрчлөх хэрэгтэй байна",
  "Чекаутын цаг сөргөлжүүлэх боломж байна уу?",
  "Нэмэлт массаж захиалмаар байна. Ямар үнэтэй байна?",
  "Спортын зүйл авсан аа? Гүйлгэх замаа байна уу?",
  "Аэропортоос авч хүргүүлэх үйлчилгээ байна уу?",
  "Хоол идэхэд аллергитай зүйлс байна. Хоолны цэнгэлгээ сольж болох уу?",
  "Өрөөнийхөө чанартай холбоотой байгуулалт хийхийг хүсье",
];

const adminResponses = {
  temperature: "Уучлаарай! Даруй халаагч асааж өгье. Өрөөнд очиж шалгаж үзнэ үү?",
  wifi: "Вай-фай холбогдоход бэрхшээл учирч байна уу? Би IT-д мессеж явуулга. минутаас бүрэн болно.",
  schedule: "Эмчилгээний цагийнхаа солих хэрэгтэй юу? Цалингийн хүлээн авалтад хандаарай.",
  roomchange: "Өөр өрөө үзүүлэх боломж байна. Хүлээн авалтын дэсктэй холбоо барь.",
  checkout: "Чекаутын цаг сөргөлжүүлэх боломж бий. Нэмэлт төлбөртэй байна.",
  massage: "Нэмэлт массаж 100,000₮ байна. Үйлчилгээний цэнгэл дээр захиалж болно.",
  sports: "Спортын зүйлс байна. Цалингийн хүлээн авалтад дүрсэл өгөх болно.",
  airport: "Аэропортоос авчуулах үйлчилгээ байна. Текш цуцлах хэрэгтэй. Илүүчилэн яриулж өгнө.",
  allergen: "Аллергитай сайтар хэлээрэй. Шал хоолны үйлчилгээнд нэрэлүүлнэ.",
  complaint: "Өрөөнийхөө асуудлын талаар өндөрлөгт мэдэгдэнэ үү? Даруй шийдвэрлэнэ.",
};

async function generateTestData() {
  try {
    console.log("🚀 Generating 20 test bookings with chat messages...\n");

    const bookings = [];
    const today = new Date();
    
    // Generate 20 bookings
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const roomId = roomIds[i % roomIds.length];
      
      // Generate check-in dates from today to 2 months ahead
      const checkInDate = new Date(today);
      checkInDate.setDate(checkInDate.getDate() + (i * 3)); // Spread out bookings
      
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 7); // 7-day stays
      
      const checkInStr = checkInDate.toISOString().split('T')[0];
      const checkOutStr = checkOutDate.toISOString().split('T')[0];

      const booking = {
        ref: `SKH-${String(100000 + i).slice(-6)}`,
        fname: firstName,
        lname: lastName,
        phone: `976${String(Math.random()).slice(2, 10)}`,
        email: `${firstName.toLowerCase()}${i}@gmail.com`,
        check_in: checkInStr,
        check_out: checkOutStr,
        room_id: roomId,
        guests: Math.ceil(Math.random() * 4) + 1,
        notes: i % 3 === 0 ? "Эмчилгээний сэтгүүлтэй байна" : "",
        payment: ["qpay", "card", "bank", "cash"][Math.floor(Math.random() * 4)],
        total: (Math.floor(Math.random() * 50) + 50) * 1000,
        status: ["pending", "confirmed", "cancelled"][Math.floor(Math.random() * 3)],
        guest_details: generateGuestDetails(Math.ceil(Math.random() * 4) + 1),
      };

      bookings.push(booking);
    }

    // Insert bookings
    console.log("📝 Inserting 20 bookings...");
    const { data: insertedBookings, error: bookingError } = await supabase
      .from("bookings")
      .insert(bookings)
      .select();

    if (bookingError) {
      console.error("❌ Error inserting bookings:", bookingError);
      process.exit(1);
    }

    console.log(`✅ Created ${insertedBookings.length} bookings\n`);

    // Generate chat messages for each booking
    console.log("💬 Generating chat messages...");
    const chatMessages = [];
    const responseKeys = Object.keys(adminResponses) as (keyof typeof adminResponses)[];

    for (let i = 0; i < insertedBookings.length; i++) {
      const booking = insertedBookings[i];
      const sessionId = `session-${booking.id}`;
      const issueIndex = i % customerIssues.length;
      const responseKey = responseKeys[i % responseKeys.length];

      // Customer message
      chatMessages.push({
        session_id: sessionId,
        sender: "client",
        sender_name: booking.fname,
        message: customerIssues[issueIndex],
      });

      // Admin response will be added separately via manual endpoint test
    }

    // Insert chat messages
    const { data: insertedMessages, error: chatError } = await supabase
      .from("chat_messages")
      .insert(chatMessages)
      .select();

    if (chatError) {
      console.error("❌ Error inserting messages:", chatError);
      process.exit(1);
    }

    console.log(`✅ Created ${insertedMessages.length} chat messages\n`);

    // Display summary
    console.log("=".repeat(60));
    console.log("📊 TEST DATA SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Total Bookings: ${insertedBookings.length}`);
    console.log(`✅ Total Messages: ${insertedMessages.length}`);
    console.log("\n🔍 Sample Bookings:");
    insertedBookings.slice(0, 5).forEach((b, idx) => {
      console.log(`  ${idx + 1}. ${b.fname} ${b.lname} - Room: ${b.room_id} - Check-in: ${b.check_in}`);
    });

    console.log("\n💬 Sample Chat Sessions:");
    insertedMessages.slice(0, 5).forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${m.sender_name}: "${m.message.substring(0, 50)}..."`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✨ TEST DATA GENERATION COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📌 Next Steps:");
    console.log("  1. Visit: http://localhost:3000/admin/chat");
    console.log("  2. Select a chat session from the left sidebar");
    console.log("  3. Reply with different response types:");
    console.log("     - Short answers (Yes/No)");
    console.log("     - Detailed guidance");
    console.log("     - Clarifying questions");
    console.log("     - Multiple responses");
    console.log("\n");

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

function generateGuestDetails(count: number) {
  const details = [];
  for (let i = 0; i < count; i++) {
    details.push({
      gender: Math.random() > 0.5 ? "male" : "female",
      age: String(18 + Math.floor(Math.random() * 50)),
    });
  }
  return details;
}

generateTestData();
