# Test Scripts Directory

This directory contains scripts for generating test data and running comprehensive tests of the booking and chatbot system.

## 📋 Available Scripts

### 1. **test-setup.ts** - Master Setup Script
**One-command setup for everything**

```bash
npx tsx scripts/test-setup.ts
```

**What it does:**
- ✅ Verifies environment variables
- ✅ Generates 20 test bookings
- ✅ Creates 20 customer chat messages
- ✅ Adds 20 admin response patterns
- ✅ Displays complete testing instructions

**Output:** Interactive guide with all next steps

---

### 2. **generate-test-bookings.ts** - Create Test Bookings
**Generate 20 realistic bookings with customer info**

```bash
npx tsx scripts/generate-test-bookings.ts
```

**Creates:**
- 20 bookings with random dates (spread over 2-3 months)
- Various booking statuses (pending, confirmed, checked-in, checked-out)
- Realistic Mongolian names for customers
- Different room assignments
- Various payment methods
- Guest detail information (gender, age)

**Database Tables Updated:**
- `bookings` table (20 new records)

**Example Booking:**
```json
{
  "ref": "SKH-100001",
  "fname": "Баяр",
  "lname": "Монгол",
  "check_in": "2026-04-13",
  "check_out": "2026-04-20",
  "room_id": "room-2",
  "status": "confirmed",
  "total": 1250000
}
```

---

### 3. **add-admin-responses.ts** - Add Admin Response Patterns
**Add varied admin responses to customer messages**

```bash
npx tsx scripts/add-admin-responses.ts
```

**Response Patterns Added:**
1. **Quick Confirmation** - Immediate acknowledgment
   - `"Яасч байна? Даруй засна."`
   - `"Зүр авч байна! Даруу болно."`

2. **Troubleshooting Steps** - Step-by-step guidance
   - `"1. Сум асаалтаа унагаа\n2. 30 сек хүлээ\n3. Дахин холбоё"`

3. **Clarifying Questions** - Request more information
   - `"Ямар эмчилгээний цаг шилжүүлэхийг хүсье?"`
   - `"Ямар төрлийн өрөө сонго?"`

4. **Upselling/Offers** - Additional services
   - `"Массаж 100,000₮. Сонирхолтой юу?"`
   - `"20% хөнгөлөлт! 5+ сеанс авбал!"`

5. **Empathy Responses** - Handle complaints
   - `"Уучлаарай! Даруй засна."`
   - `"Та илүүхэн эхээрэй гэж гомдлоо."`

6. **Escalation** - Hand off to higher authority
   - `"Менежертэй яриулна."`
   - `"IT-г нэрэлүүлэв."`

7. **Multi-Step** - Complex procedures
   - Multiple short messages sent in sequence

**Database Tables Updated:**
- `chat_messages` table (20 admin responses added)

---

## 🚀 Quick Start

### Option A: One-Command Setup (Recommended)
```bash
# Run everything at once
npx tsx scripts/test-setup.ts
```

### Option B: Run Individually
```bash
# Step 1: Generate bookings
npx tsx scripts/generate-test-bookings.ts

# Step 2: Add admin responses
npx tsx scripts/add-admin-responses.ts
```

---

## 🧪 After Running Scripts

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Navigate to Chat Dashboard
```
http://localhost:3000/admin/chat
```

### 3. Test Admin Responses
- Click on different chat sessions
- Send varied responses (see response patterns above)
- Observe message flow and delivery

### 4. Test Different Scenarios
- **Immediate response** (< 10 seconds)
- **Step-by-step guidance** (multiple messages)
- **Upselling** (with follow-up questions)
- **Complex resolution** (3+ message conversation)

---

## 📊 Generated Test Data

### Bookings
- **Count:** 20
- **Date Range:** Today to +60 days
- **Spacing:** 3 days apart
- **Statuses:** Mixed (pending, confirmed, checked-in, checked-out)
- **Rooms:** Distributed across room-1 to room-5

### Customer Names
- **First Names:** Bajar, Tsagaan, Dorja, Enkhbayar, etc.
- **Last Names:** Mongol, Sukhbaatar, Battulag, etc.
- **All Mongolian** for realistic booking data

### Chat Messages
- **Count:** 20 customer + 20 admin = 40 total
- **Scenarios:** Temperature, WiFi, Schedule, Room Change, Checkout, etc.
- **Response Types:** 7 different patterns

---

## 🧹 Cleanup

### Manual Deletion (SQL)
```sql
-- Delete test bookings
DELETE FROM bookings WHERE ref LIKE 'SKH-100%';

-- Delete test chat messages
DELETE FROM chat_messages WHERE session_id LIKE 'session-%';
```

### Via Supabase Dashboard
1. Go to your database
2. Open `bookings` table
3. Filter: `ref LIKE 'SKH-100%'`
4. Select all and delete

---

## 🐛 Troubleshooting

### Error: "Missing environment variables"
**Fix:** Set these in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Error: "ECONNREFUSED" or database connection failed
**Fix:** Verify Supabase is running and accessible

### Error: "Table does not exist"
**Fix:** Run Supabase migrations first:
```bash
npx supabase db push
```

### Messages not appearing in chat?
**Fix:** Refresh the chat page (F5) in your browser

---

## 📝 Response Examples by Type

### ✅ Quick Confirmation
```
✓ "Яасч байна? Даруй засна."
✓ "Заалцав! Хүргэнэ."
✗ "Та хүнээлээрэй..."  (Too wordy)
```

### 🔧 Troubleshooting
```
✓ "1. Сум асаалтаа\n2. Хүлээ\n3. Дахин холбоё"
✓ "IT-д нэрэлүүлэв"
✗ "Маш ойлгосон..."  (Skip to solution)
```

### ❓ Clarification
```
✓ "Та ямар төрөл хүсэж байна?"
✓ "Цагийц сонго: 9-11 эсвэл 15-17?"
✗ "Юу хайж байна?" (Too vague)
```

### 💰 Upselling
```
✓ "Массаж 100,000₮. Сонирхолтой?"
✓ "20% хөнгөлөлт! 5+ авбал 15%!"
✗ "Үйлчилгээ байна..."  (Not specific)
```

### 😟 Empathy
```
✓ "Уучлаарай! Даруй засна."
✓ "Та гомдлоо. Шилжүүлэй?"
✗ "Энэ алдаа..."  (Blame-shifting)
```

### 📞 Escalation
```
✓ "Менежертэй яриулна"
✓ "IT-г нэрэлүүлэв"
✗ "Би ойлгоогүй"  (Not professional)
```

---

## 📈 Performance Metrics

After running tests, track these metrics:

| Metric | Target | Note |
|--------|--------|------|
| Message Delivery | < 500ms | Supabase latency |
| Response Time | < 2s | Admin reply delay |
| Conversation Depth | 3-5 msgs | Average per issue |
| Resolution Rate | 80%+ | Issues fully resolved |

---

## 🎓 Learning Resources

- See: `BOOKING_CHATBOT_TEST_GUIDE.md` for comprehensive testing guide
- See: `src/lib/chat-test-api.ts` for programmatic API examples
- See: `src/app/admin/chat/page.tsx` for admin interface code

---

## ✨ Next Steps

1. **Run:** `npx tsx scripts/test-setup.ts`
2. **Visit:** `http://localhost:3000/admin/chat`
3. **Test:** 20 different response patterns
4. **Document:** Bugs, improvements, suggestions
5. **Iterate:** Refine responses based on real usage

---

**Created:** April 2026  
**Version:** 1.0  
**Maintenance:** As needed for regression testing
