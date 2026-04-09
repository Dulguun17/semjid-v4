# 20 Booking + Chatbot Admin Response Test Guide

This guide shows how to generate 20 test bookings with chat messages and test different admin response patterns.

## ✅ Setup & Execution

### Step 1: Generate Test Data

Run the test data generation script:

```bash
# Make sure environment variables are set
$env:NEXT_PUBLIC_SUPABASE_URL = "your-url"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-key"

# Run the script (requires Node with TypeScript support)
npx ts-node scripts/generate-test-bookings.ts
```

Or with `tsx`:

```bash
npx tsx scripts/generate-test-bookings.ts
```

**Expected Output:**
```
✅ Created 20 bookings
✅ Created 20 chat messages

📊 TEST DATA SUMMARY
✅ Total Bookings: 20
✅ Total Messages: 20

Sample Bookings:
  1. Баяр Монгол - Room: room-1 - Check-in: 2026-04-10
  2. Цагаан Сүхбаатар - Room: room-2 - Check-in: 2026-04-13
  ...
```

---

## 🧪 Test Different Admin Response Patterns

Once data is generated, go to **Admin Dashboard → Chat** to test these patterns:

### Pattern 1: Quick Confirmation
**Customer Issue:** "Өрөөний температур хүйтэн байна. Дээд дэвсгэр нэмж өгөх боломж байна уу?"

**Admin Response Options:**
- ✅ "Яасч байна вэ? Даруй халаагч асааж өгье."
- ✅ "Зүр авч байна! 5 минутаар хүргэнэ."
- ✅ "Чандалгүй асуух асуулт биз. Шууд засна."

**Test:** Choose one response type

---

### Pattern 2: Troubleshooting with Steps
**Customer Issue:** "Вай-фай холбогдоход бэрхшээл байна. Туслаарай!"

**Admin Response Options:**
1. **Immediate Action:** "Маргаангүй. IT-д контролийн суугаа."
2. **With Guidance:** "Сум асаалтаа унагаж, 30 сек хүлээгээрэй. Дахин холбоё."
3. **Escalation:** "IT-г нэрэлүүлэв. Утас явахаа хүлээнэ үү?"

**Test:** Try all three approaches and observe different response flows

---

### Pattern 3: Clarifying Questions
**Customer Issue:** "Эмчилгээний графикаа сөрөг дээр авч болох уу?"

**Admin Response Options:**
1. **Ask for Details:** "Чи ямар эмчилгээний цаг шилжүүлэхийг хүсье?"
2. **Direct Answer:** "Бүх эмчилгээ сөргөлжүүлж болно. Хүлээн авалтад хандаа."
3. **With Alternatives:** "Чи нар энэ цагаа үзүүлж, эсвэл позже цагаа сонго."

**Test:** Document customer's response to each clarification

---

### Pattern 4: Upselling (with politeness)
**Customer Issue:** "Нэмэлт массаж захиалмаар байна. Ямар үнэтэй байна?"

**Admin Response Options:**
1. **Info + Enthusiasm:** "Сайн сонголт! Манай массаж 100,000₮. Цалингийн авалтад захиал!"
2. **Package Deal:** "Энэ сар 20% хөнгөлөлт байна. 5+ сеанс авбал!"
3. **Link to Schedule:** "Цагийн хүснэгтээ явуулж байна. Ямар цаг хүнээнэ?"

**Test:** Measure customer engagement with each style

---

### Pattern 5: Problem Resolution
**Customer Issue:** "Өрөөнийхөө сөрөг өөрчлөх хэрэгтэй байна"

**Admin Response Options:**
1. **Immediate Offer:** "Яшаж байна. Эхний 3 сүүдэр сонгулт өгнө. Ямар төрөл сонго?"
2. **Availability Check:** "Ямар料 эргүүлэлт авч болох юу? Үнэгүй авч сольлоо."
3. **Escalation:** "Менежертэй яриулна. Холбоо барь. Асуугаа бишлэв."

**Test:** Note response time and resolution rate

---

### Pattern 6: Multiple Follow-ups
**Customer Issue:** "Спортын зүйл авсан аа? Гүйлгэх замаа байна уу?"

**Expected Admin Conversation:**
```
Message 1: "Спортын хэрэглүүр байна. Ямар төрөл хэрэгтэй?"
(Wait for customer response)

Message 2: "Харанхуй цагт гүйлгэх замаа дурын цагаар нээлттэй."
(Wait for customer response)

Message 3: "Гаршилд үзүүлэх болно. Утасны дугаарыг 8802-1191 агуулавч."
```

**Test:** Send multiple messages and track conversation flow

---

### Pattern 7: Negative to Positive Turn-Around
**Customer Issue:** "Чекаутын цаг сөргөлжүүлэх боломж байна уу?"

**Admin Response Strategy:**
1. **Empathy:** "Та илүүхэн эхээрэй гэж гомдлоо. Бид яасахьа авч болно?"
2. **Offer Options:** "Чекаутаа 2-4 цагаар сөргөлжүүлж болно. +50,000₮ өндөр."
3. **Bonus:** "Чи нар 1 цагаар сөргөлжүүлэй. Нөхөөреэнэ биш сүүдэрт + массаж 50% хөнгөлөлт."

**Test:** Measure customer satisfaction upgrade

---

### Pattern 8: Handling Complaints
**Customer Issue:** "Аэропортоос авч хүргүүлэх үйлчилгээ байна уу?"

**Admin Response Levels:**
1. **Level 1 - Direct:** "Байна. 100,000₮ нэг чиглэл. Нэмэлт телефон дугаар хэлээрэй."
2. **Level 2 - Personal:** "Барьж байна. Таныг хугацаа хэлч давчуулланаа?"
3. **Level 3 - VIP:** "Огноо хэлэ. Авто хүрнүүлэх цагаа урьдчилан худалдаж авалт хийнэ."

**Test:** Select different levels based on booking status

---

## 📊 Response Type Classification

Admin can respond with these communication styles:

| Type | Usage | Example |
|------|-------|---------|
| **Acknowledgment** | Show you heard them | "Яасч байна? Даруй засна." |
| **Question** | Need clarification | "Ямар төрлийн эмчилгээ сонго?" |
| **Step-by-Step** | Complex troubleshooting | "1. Сум асаалтаа унагаа. 2. 30 сек хүлээ. 3. Дахин холбоё." |
| **Direct Answer** | Simple info request | "Массаж 100,000₮." |
| **Upsell/Offer** | Additional services | "20% хөнгөлөлт сар энэ!" |
| **Escalation** | Hand off to manager | "Менежертэй яриулна. Холбоо барь." |
| **Empathy + Solution** | Complex complaint | "Уучлаарай! Энэ дараа шилжүүлэй. Чанда үнэгүй." |

---

## 🎯 Test Checklist

✅ Create 20 bookings with various statuses
✅ Generate 20 different customer issues
✅ For each booking, test:
  - [ ] At least 2 different admin response types
  - [ ] Response time tracking
  - [ ] Message delivery confirmation
  - [ ] Follow-up messages
  - [ ] Customer satisfaction tracking

✅ Document metrics:
  - Response time (seconds)
  - Customer satisfaction (scale 1-5)
  - Resolution rate (yes/no)
  - Follow-up needed (yes/no)

---

## 📈 Sample Test Results Table

| Booking | Issue | Response Style | Time | Satisfaction | Resolved |
|---------|-------|-----------------|------|--------------|----------|
| SKH-100000 | Temperature | Immediate Action | 2min | 5/5 | ✅ |
| SKH-100001 | WiFi | Troubleshooting | 5min | 4/5 | ✅ |
| SKH-100002 | Schedule | Clarification | 1min | 3/5 | ⏳ |
| SKH-100003 | Room Change | Offer Options | 3min | 5/5 | ✅ |
| ... | ... | ... | ... | ... | ... |

---

## 🚀 Advanced Testing

### Test 1: Rapid-Fire Responses
- Send 5 messages rapidly from one customer
- Admin replies to all within 2 minutes
- Track response quality under pressure

### Test 2: Complex Conversation
- Customer asks 3 sequential questions
- Admin must track context across messages
- Measure if admin remembers previous answers

### Test 3: Multi-Issue Booking
- One customer with 2+ unrelated issues
- Admin handles each separately
- Documents resolution of each

### Test 4: Peak Time Simulation
- Simulate 20 simultaneous chat sessions
- Admin handles them in rotation
- Measure response delays

---

## 📝 Notes

- All test data is created with realistic Mongolian names and businesses context
- Booking dates are spread across 2-3 months with various statuses
- Guest details include random gender and age data
- Chat issues cover common resort inquiry types
- Each response type demonstrates different admin personalities/approaches

---

## 🧹 Cleanup (Optional)

To remove all test data:

```sql
-- Delete test bookings (be careful!)
DELETE FROM bookings WHERE ref LIKE 'SKH-100%';

-- Delete associated chat messages
DELETE FROM chat_messages WHERE session_id LIKE 'session-%';
```

Or use Supabase Dashboard to filter and delete manually.

---

**Created:** April 10, 2026
**Purpose:** Comprehensive testing of chat system with real booking scenarios
