# 🎯 20 Booking + Chatbot Admin Response Test - Complete Setup

**Created:** April 10, 2026  
**Purpose:** Comprehensive test suite for booking system with chat interaction patterns  
**Status:** ✅ Ready to Use

---

## 📦 What's Been Created

### 1. **Test Data Scripts** (3 files)
Located in `./scripts/`

| File | Purpose | Output |
|------|---------|--------|
| `generate-test-bookings.ts` | Creates 20 test bookings with customer details | 20 bookings + 20 customer messages |
| `add-admin-responses.ts` | Adds varied admin response patterns | 20 different response types |
| `test-setup.ts` | Master script that runs everything | Complete setup in one command |

### 2. **Test API Library**
Located in `./src/lib/`

**File:** `chat-test-api.ts`
- 10+ reusable API functions
- 7 response pattern types
- Full test suite for browser console
- Copy-paste examples for manual testing

### 3. **Documentation** (2 files)

| File | Content |
|------|---------|
| `BOOKING_CHATBOT_TEST_GUIDE.md` | 8 detailed test scenarios with instructions |
| `scripts/README.md` | Complete script usage guide |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Generate Test Data
```bash
npx tsx scripts/test-setup.ts
```
Or run scripts individually:
```bash
npx tsx scripts/generate-test-bookings.ts
npx tsx scripts/add-admin-responses.ts
```

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Open Chat Dashboard
```
http://localhost:3000/admin/chat
```

---

## 🧪 7 Admin Response Patterns Included

### Pattern 1: **Quick Confirmation** ✅
*Immediate acknowledgment and action*
```
"Яасч байна? Даруй засна."
"Зүр авч байна! 5 минутаар хүргэнэ."
```

### Pattern 2: **Troubleshooting Steps** 🔧
*Step-by-step guidance*
```
"1. Сум асаалтаа унагаа
 2. 30 сек хүлээ
 3. Дахин холбоё"
```

### Pattern 3: **Clarifying Questions** ❓
*Request information to better assist*
```
"Ямар эмчилгээний цаг шилжүүлэхийг хүсье?"
"Та ямар өрөөөнд байхыг хүсэж байна?"
```

### Pattern 4: **Upselling/Offers** 💰
*Introduce additional services*
```
"Массаж 100,000₮. Сонирхолтой юу?\nСейчас спец. предложение - 20% скидка!"
```

### Pattern 5: **Empathy & Solution** 😟
*Handle complaints professionally*
```
"Уучлаарай! Даруь засна.
 Чанда өгөх болно эсвэл сөргөлжүүлэнэ?"
```

### Pattern 6: **Escalation** 📞
*Hand off to higher authority when needed*
```
"Менежертэй яриулна. Холбоо барь."
"IT-г нэрэлүүлэв. 5-10 минутаар яриулна."
```

### Pattern 7: **Multi-Step Follow-ups** 📧
*Complex conversations with multiple messages*
```
Message 1: "Спортын хэрэглүүр байна. Ямар төрөл?"
Message 2: "Дурын цагаара үзүүлэх боломж байна."
Message 3: "Гаршилд үзүүлэх болно. Утас: 8802-1191"
```

---

## 📊 Test Data Statistics

```
Total Bookings:           20
Date Range:               Today → +60 days
Booking Statuses:         pending, confirmed, checked-in, checked-out
Room Distribution:        room-1, room-2, room-3, room-4, room-5
Guest Configurations:     1-4 guests per booking

Customer Names:           All realistic Mongolian names
Chat Sessions:            20 (one per booking)
Customer Messages:        20 different issue types
Admin Responses:          20 varied response patterns

Response Types:           Quick, Troubleshooting, Clarifying, 
                         Upselling, Empathy, Escalation, Multi-step
```

---

## 🧪 How to Test Each Pattern

### Test 1: Quick Confirmation
1. Open Admin Chat
2. Select session "SKH-100000"
3. Click reply box
4. Type: `"Яасч байна? Даруй засна."`
5. Click "Илгээх"
6. ✓ Message appears immediately

### Test 2: Troubleshooting
1. Select session with WiFi issue
2. Send: 
   ```
   1. Сум асаалтаа унагаа
   2. 30 сек хүлээ
   3. Дахин холбоё
   ```
3. Wait 2 seconds
4. Send follow-up: `"Холбогдсон уу?"`
5. ✓ See numbered list formatting

### Test 3: Clarification
1. Select session with schedule issue
2. Send: `"Та ямар цагаар хүнээнэ?"`
3. Wait for customer response
4. Send more specific options
5. ✓ Track conversation flow

### Test 4: Upselling
1. Select massage inquiry session
2. Send: `"Массаж 100,000₮. 20% хөнгөлөлт сар энэ!"`
3. Follow up with: `"Та сонирхолтой юу? 📅"`
4. ✓ Measure customer engagement

### Test 5: Empathy
1. Select complaint session
2. Start with: `"Уучлаарай!"`
3. Provide solution: `"Даруй засна."`
4. Offer options: `"Чанда эсвэл сөргөлжүүлэл?"`
5. ✓ Track satisfaction improvement

### Test 6: Escalation
1. Select complex issue
2. Send: `"Энэ асуудал менежерт явна."`
3. Document what happens next
4. ✓ Verify escalation workflow

### Test 7: Multiple Follow-ups
1. Select any session
2. Send 3-5 messages rapidly
3. Observe message order
4. ✓ Test conversation continuity

---

## 💻 Testing via Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Run any of these:

```javascript
// Individual tests
testSuite.test1_quickResponse()
testSuite.test2_troubleshooting()
testSuite.test3_clarifyingQuestion()
testSuite.test4_upsell()
testSuite.test5_empathy()
testSuite.test6_escalation()
testSuite.test7_getHistory()
testSuite.test8_comprehensive()

// Run all tests at once
testSuite.testAll()
```

---

## 📈 Metrics to Track

While testing, document:

| Metric | Method | Goal |
|--------|--------|------|
| **Response Time** | Check timestamp | < 2 seconds |
| **Message Delivery** | Verify inbox | 100% success |
| **Clarity** | Read tone | Professional & warm |
| **Call-to-Action** | Count CTAs | 1 per message |
| **Resolution** | Follow conversation | Issue solved |
| **Satisfaction** | Estimate scale 1-5 | 4+ average |

---

## 🎯 Test Scenarios Covered

### Scenario 1: Environmental Issues
- **Issue:** "Өрөөний температур хүйтэн"
- **Best Response Type:** Quick Confirmation + Empathy
- **Customer Need:** Immediate relief

### Scenario 2: Technical Support
- **Issue:** "Вай-фай холбогдоход бэрхшээл"
- **Best Response Type:** Troubleshooting Steps + Escalation
- **Customer Need:** Clear instructions

### Scenario 3: Schedule Changes
- **Issue:** "Эмчилгээний цаг сөргөлжүүлэх"
- **Best Response Type:** Clarifying Questions + Options
- **Customer Need:** Flexibility

### Scenario 4: Upselling Opportunity
- **Issue:** "Нэмэлт массаж захиалмаар"
- **Best Response Type:** Upselling + Direct Answer
- **Customer Need:** Price & availability

### Scenario 5: Complaint Resolution
- **Issue:** "Өрөөнийхөө сөрөг өөрчлөх"
- **Best Response Type:** Empathy + Multi-step Solution
- **Customer Need:** Problem-solving

### Scenario 6: Service Information
- **Issue:** "Аэропортоос авч хүргүүлэх үйлчилгээ байна уу?"
- **Best Response Type:** Direct Answer + Details
- **Customer Need:** Factual information

### Scenario 7: Complex Request
- **Issue:** "Аллергитай сайтар хэлээрэй"
- **Best Response Type:** Clarifying + Multi-step + Escalation
- **Customer Need:** Specialized attention

### Scenario 8: Multiple Issues
- **Issue:** Multiple sequential questions
- **Best Response Type:** Multi-step Follow-ups
- **Customer Need:** Tracking & consistency

---

## 🔄 Full Conversation Example

```
👤 Customer (14:32): "Өрөөний температур хүйтэн байна!"

👨‍💼 Admin (14:33): 
   "Уучлаарай! Даруй халаагч асааж өгье.
    5 минутаар хүргэнэ! 🔥"

👤 Customer (14:35): "Болж геелээ. Маш их сайхан!"

👨‍💼 Admin (14:36):
   "Сайн үзэл авч байна! 😊
    Чи нар орхи өрөөнд нэмэлт массаж авч 
    болох уу? Энэ сар 20% хөнгөлөлт!
    💆"

👤 Customer (14:37): "Ямар үнэтэй?"

👨‍💼 Admin (14:38):
   "Нэг сеанс 100,000₮
    3+ сеанс авбал 15% хөнгөлөлт!
    📅 Цагийн хүснэгтээ явуулж байна"
```

---

## ✅ Success Criteria

After testing, you should have:

- [ ] ✅ 20 test bookings created
- [ ] ✅ 20 customer chat messages created
- [ ] ✅ 20 admin responses added
- [ ] ✅ All 7 response patterns tested
- [ ] ✅ Message delivery verified
- [ ] ✅ Response times acceptable
- [ ] ✅ Customer satisfaction traced
- [ ] ✅ Conversation flows natural
- [ ] ✅ Escalations work properly
- [ ] ✅ No database errors

---

## 🧹 Cleanup

When done testing, clean up with:

```bash
# Remove test data (replace IDs as needed)
npx supabase db execute "DELETE FROM bookings WHERE ref LIKE 'SKH-100%';"
npx supabase db execute "DELETE FROM chat_messages WHERE session_id LIKE 'session-%';"
```

Or use Supabase Dashboard UI for manual deletion.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `BOOKING_CHATBOT_TEST_GUIDE.md` | Full test guide with 8 scenarios |
| `scripts/README.md` | Script usage and examples |
| `src/lib/chat-test-api.ts` | API functions reference |

---

## 🆘 Troubleshooting

### "Messages not showing in chat?"
- Refresh the page (F5)
- Check Supabase connection
- Verify session_id matches

### "Response taking too long?"
- Check network tab (F12)
- Verify Supabase is running
- Check for database load

### "Can't find test data?"
- Verify scrips ran without errors
- Check Supabase tables directly
- Look for "SKH-100" prefix

### "Need to regenerate?"
- Delete existing test data
- Run scripts again
- Refresh admin page

---

## 🎉 Ready to Go!

All components are in place for comprehensive testing:

✅ **Test Data Generator** - Create realistic bookings  
✅ **Response Patterns** - 7 different communication styles  
✅ **API Functions** - Reusable testing functions  
✅ **Documentation** - Complete guides and examples  
✅ **Browser Support** - Console testing available  

---

## 🚀 Start Testing Now

```bash
# 1. Generate all test data
npx tsx scripts/test-setup.ts

# 2. Start dev server
npm run dev

# 3. Open admin chat
# → http://localhost:3000/admin/chat

# 4. Begin testing different response patterns!
```

---

**Need help?** Check individual files:
- Test Guide: `BOOKING_CHATBOT_TEST_GUIDE.md`
- Script Help: `scripts/README.md`
- API Reference: `src/lib/chat-test-api.ts`

**Happy Testing! 🎊**
