# ✅ Feature Activation Checklist

Complete these steps in order to make all 10 features fully functional.

---

## 🟥 CRITICAL - Must Do First

### 1. ⚙️ Configure Environment Variables
**File**: `.env.local`

Add/update these values:

```bash
# Already Present - Verify these exist
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=re_... (should be configured)

# OPTIONAL - For QPay Payments (Mongolia only)
QPAY_MERCHANT_ID=your_merchant_id
QPAY_API_KEY=your_api_key
QPAY_BASE_URL=https://merchant.qpay.mn/api
```

**Check**: 
- [ ] Open `.env.local`
- [ ] Verify `RESEND_API_KEY` exists
- [ ] (Optional) Add `QPAY_*` variables

⏱️ **Time**: 5 minutes

---

### 2. 🗄️ Run Database Migration
**File**: `supabase/database_improvements.sql`

This adds performance indexes and new tables for payment tracking.

**Steps**:
1. [ ] Log in to [Supabase Dashboard](https://supabase.com)
2. [ ] Select your project (Semjid)
3. [ ] Go to **SQL Editor** (left sidebar)
4. [ ] Click **New Query**
5. [ ] Copy entire contents of `supabase/database_improvements.sql`
6. [ ] Paste into SQL editor
7. [ ] Click **Run** button (▶️)
8. [ ] Wait for success message (should show "Success")
9. [ ] Go to **Database** → **Tables** to verify new tables exist:
   - [ ] `payment_history` table created
   - [ ] `admin_responses` table created
   - [ ] `audit_log` table created
   - [ ] `room_availability` table created

**Check Indexes**: Go to **Database** → **Tables** → **bookings** → **Indexes** tab
- Should see new indexes on: `email`, `status`, `room`, `created_at`

⏱️ **Time**: 10 minutes

---

## 🟨 HIGH PRIORITY - Do Next

### 3. ✉️ Verify Email System
**Feature**: Booking Confirmations & Admin Notifications

**Check that emails work**:
1. [ ] Go to `/booking` page
2. [ ] Complete test booking with:
   - Name: "Test User"
   - Email: *your personal email*
   - Dates: Any future dates
   - Submit booking
3. [ ] Check your email for **Booking Confirmation**
   - Should have booking reference (SKH-XXXXX)
   - Should have special check-in code
   - Should have property address
4. [ ] Check **admin@semjid.mn** email for **New Booking Notification**
   - Should have booking details, guest info, admin link
5. [ ] If no emails received:
   - Check SPAM folder
   - Verify `RESEND_API_KEY` is correct in `.env.local`
   - Check Resend dashboard for delivery status

⏱️ **Time**: 10 minutes

---

### 4. 💬 Test Chat System (Manual Admin Responses)
**Feature**: Guest Support via Chat

**Test the chat**:
1. [ ] Go to home page - look for **Chat Widget** (bottom right)
2. [ ] Click chat icon to open
3. [ ] Send test message: "Hello, I have a question about rooms"
4. [ ] Message should be stored successfully (no error)
5. [ ] Check your email:
   - [ ] Should receive admin notification "New Chat Message from [Guest Name]"
   - [ ] Subject should include guest name and timestamp
6. [ ] Log in to `/admin` panel
7. [ ] Go to **Chat** tab (💬 icon)
8. [ ] Find the guest's message
9. [ ] Write a response: "Thank you for your question! We have several rooms available."
10. [ ] Post reply
11. [ ] Back on guest side (home page chat widget):
    - [ ] Refresh or wait a moment
    - [ ] Admin response should appear in chat history

**Troubleshooting**:
- Email not received? Check SPAM folder, verify ADMIN_EMAIL in `.env.local`
- Response not appearing? Refresh page or check browser console for errors
- Chat widget not showing? Clear cache, restart dev server: `npm run dev`

⏱️ **Time**: 5 minutes

---

### 5. 📊 Test Analytics Dashboard
**Feature**: Business Intelligence

**Access admin dashboard**:
1. [ ] Navigate to `/admin`
2. [ ] Go to **Analytics** tab (📊 icon)
3. [ ] Verify these sections display:
   - [ ] Key Stats Card (Total Bookings, Guests, Revenue)
   - [ ] Monthly Revenue Chart (should show data or empty if no bookings)
   - [ ] Booking Status Breakdown (pie chart)
   - [ ] Room Popularity Bar Chart
   - [ ] Recent Bookings Table (shows last 10 bookings)
4. [ ] Try date filtering if available
5. [ ] Verify numbers match database records

**Expected data**:
- If you have test bookings, analytics should show them
- Revenue should calculate correctly
- Charts should render without errors

⏱️ **Time**: 5 minutes

---

### 6. 💳 Test Payments Dashboard
**Feature**: Payment Tracking

**Check payments page**:
1. [ ] Navigate to `/admin`
2. [ ] Go to **Payments** tab (💳 icon)
3. [ ] Verify these sections display:
   - [ ] Total Amount Stats (total, confirmed, pending)
   - [ ] Payment Method Breakdown (Cash, Bank, QPay)
   - [ ] Payment History Table (shows all transactions)
4. [ ] Click **Export CSV** button
   - Should download payment report as CSV
5. [ ] Try filters:
   - [ ] Filter by Payment Type (Cash/Bank/QPay)
   - [ ] Filter by Booking Status

**Expected**:
- Should match bookings made earlier
- Numbers should correlate with analytics
- CSV should be valid

⏱️ **Time**: 5 minutes

---

### 7. 👤 Test Profile Management
**Feature**: Guest Profiles & Booking History

**Test as guest user**:
1. [ ] Go to `/profile` page (as logged-in user)
2. [ ] Verify profile displays:
   - [ ] User email
   - [ ] First name, last name (editable)
   - [ ] Phone number (editable)
3. [ ] Click **Edit Profile** button
   - [ ] Change first name
   - [ ] Change phone
   - [ ] Click **Save**
4. [ ] Verify profile updated:
   - [ ] Refresh page
   - [ ] Changes persisted
5. [ ] Scroll down to **Booking History**
   - [ ] Should show all guest's bookings
   - [ ] Verify dates, room, status correct

**Expected**:
- Profile edits save to Supabase
- Booking history matches database
- No errors on page load

⏱️ **Time**: 5 minutes

---

## 🟩 MEDIUM PRIORITY - Do After

### 8. ⭐ Test Review System
**Feature**: Review Moderation

**Setup**:
1. [ ] Create test booking as guest (if not done yet)
2. [ ] Fill review form with test data:
   - Rating: 5 stars
   - Comment: "Great property!"
3. [ ] Submit review

**Check admin moderation**:
1. [ ] Go to `/admin` → **Reviews** tab (⭐ icon)
2. [ ] Verify review appears in "Pending" section
3. [ ] Click **Approve** button
4. [ ] Verify review moves to "Approved" section
5. [ ] Try **Reject** on another test review (if multiple)
6. [ ] Verify statistics update:
   - Pending count decreases
   - Approved count increases

**Expected**:
- Reviews don't appear on public site until approved
- Admin can control all reviews
- Ratings show as stars

⏱️ **Time**: 5 minutes

---

### 9. 🏨 Test Booking Management
**Feature**: Admin Booking CRUD

**Access booking manager**:
1. [ ] Go to `/admin` → **Bookings** tab (📖 icon)
2. [ ] Verify these features work:

**Search**:
- [ ] Search by guest name
- [ ] Search by email
- [ ] Search by booking reference (SKH-XXXXX)

**Filters**:
- [ ] Filter by status: Pending
- [ ] Filter by status: Confirmed
- [ ] Filter by status: Cancelled

**Edit Booking**:
1. [ ] Click **Edit** button on a booking
2. [ ] Modal pops up with editable fields
3. [ ] Change guest name
4. [ ] Change payment status
5. [ ] Click **Save**
6. [ ] Verify changes persisted

**Delete Booking**:
1. [ ] Click **Delete** button
2. [ ] Confirm deletion
3. [ ] Booking removed from table

**Expected**:
- All operations work without errors
- Data updates immediately
- Search/filter results accurate

⏱️ **Time**: 10 minutes

---

### 10. 📱 Test QPay Integration (Optional - Mongolia Only)
**Feature**: Mobile Payment QR Codes

**Note**: Only works if `QPAY_*` variables configured in `.env.local`

**Generate QR code**:
1. [ ] Make booking with QR-based checkout
2. [ ] Payment screen should show QPay QR code
3. [ ] Scan with Mongolian mobile wallet app
   - [ ] XacBank
   - [ ] Khan Bank
   - [ ] Any app that supports QPay
4. [ ] Verify payment flows through

**If no credentials**:
- [ ] Fallback QR mode will still work
- [ ] Shows placeholder QR for testing
- [ ] Full API integration requires merchant account

⏱️ **Time**: 10 minutes (if configured)

---

### 11. 🚫 Test Availability System
**Feature**: Prevent Double-Booking

**Test occupancy logic**:
1. [ ] Create booking for Room 1, Feb 15-18
2. [ ] Try to create another booking for Room 1, Feb 16-20
   - [ ] Should fail with "Room not available" message
3. [ ] Try different room for overlapping dates
   - [ ] Should succeed (different room available)
4. [ ] Try same room after check-out date (Feb 18+)
   - [ ] Should succeed (room free after checkout)

**Expected**:
- System prevents overbooking
- Error message is clear
- Available alternatives shown

⏱️ **Time**: 5 minutes

---

## 🔴 DEPLOYMENT - Final Steps

### 12. 🚀 Test Full Workflow End-to-End
**Complete booking cycle**:
1. [ ] Guest visits website
2. [ ] Guest books room:
   - [ ] Email confirmation received
   - [ ] Admin notified
   - [ ] Booking appears in admin panel
   - [ ] Availability updated
3. [ ] Guest receives booking reference
4. [ ] Guest can see booking in profile
5. [ ] Admin can view in analytics
6. [ ] Admin can track payment status
7. [ ] Admin can approve reviews
8. [ ] Chat answers questions

**Check**: All systems working together without errors

⏱️ **Time**: 15 minutes

---

### 13. 📋 Verify All Menu Items
**Check admin sidebar**:
1. [ ] Go to `/admin`
2. [ ] Verify these menu items exist:
   - [ ] Dashboard
   - [ ] Analytics 📊
   - [ ] Payments 💳
   - [ ] Bookings 📖
   - [ ] Reviews ⭐
   - [ ] Chat 💬
   - [ ] Guests 👥
   - [ ] Rooms 🏨
   - [ ] Settings ⚙️
   - [ ] Customers 👨‍💼

**All clickable?** All pages loading without errors?

⏱️ **Time**: 5 minutes

---

### 14. 🔍 Error Checking
**Run tests**:

Open browser console (F12) and check for:
- [ ] No red error messages
- [ ] No undefined errors
- [ ] Network tab shows successful API calls

Go through each feature and check:
- [ ] Analytics page: No console errors
- [ ] Payments page: No console errors
- [ ] Bookings page: No console errors
- [ ] Chat: No console errors

⏱️ **Time**: 5 minutes

---

## 📈 Optional Enhancements

These are nice-to-have after everything is working:

- [ ] **Customize email templates** - Edit `src/lib/email.ts` to match branding
- [ ] **Adjust AI personality** - Edit system prompt in `src/lib/ai-chat.ts`
- [ ] **Configure QPay** - Get merchant account for real payments
- [ ] **Set up analytics tracking** - Add booking analytics events
- [ ] **Create backup** - Export database regularly
- [ ] **Monitor AI responses** - Review quality in admin panel
- [ ] **Set payment reminders** - For pending invoices

---

## ⏱️ Total Time Estimate

| Step | Time |
|------|------|
| 1. Environment Variables | 5 min |
| 2. Database Migration | 10 min |
| 3. Email Verification | 10 min |
| 4. Chat System Test | 5 min |
| 5. Analytics | 5 min |
| 6. Payments | 5 min |
| 7. Profile | 5 min |
| 8. Reviews | 5 min |
| 9. Bookings | 10 min |
| 10. QPay (optional) | 10 min |
| 11. Availability | 5 min |
| 12. End-to-End Test | 15 min |
| 13. Menu Verification | 5 min |
| 14. Error Checking | 5 min |
| **TOTAL** | **120 minutes** |

---

## 🆘 Troubleshooting

### Feature Not Working?

**Email not sending**:
- [ ] Check RESEND_API_KEY in `.env.local`
- [ ] Check Resend dashboard: https://resend.com/emails
- [ ] Verify email domain is verified in Resend

**Chat not working**:
- [ ] Admin email notifications configured in `.env.local`
- [ ] Admin can access `/admin` panel
- [ ] Check browser console for JavaScript errors (F12)
- [ ] Verify Supabase connection working
- [ ] Restart dev server: `npm run dev`

**Database migration failed**:
- [ ] Check for SQL syntax errors in Supabase editor
- [ ] Run migrations one section at a time
- [ ] Check Supabase database logs for errors

**Admin pages blank**:
- [ ] Clear browser cache
- [ ] Restart dev server: `npm run dev`
- [ ] Check browser console for errors (F12)
- [ ] Verify Supabase connection

**Booking failure**:
- [ ] Check room availability in database
- [ ] Verify dates are in future
- [ ] Check guest email format

---

## ✅ Sign-Off Checklist

After completing all steps, check these:

- [ ] All environment variables configured
- [ ] Database migration completed successfully
- [ ] Emails sending and receiving correctly
- [ ] AI chat responding to messages
- [ ] Analytics dashboard showing data
- [ ] Payments tracked correctly
- [ ] Profile editing works
- [ ] Reviews management functional
- [ ] Booking CRUD operations working
- [ ] Availability preventing double-bookings
- [ ] Admin menu items all present
- [ ] No console errors
- [ ] Full workflow tests passed

**Status**: 🟢 **READY FOR PRODUCTION**

---

**Last Updated**: April 10, 2026
**Ready to Launch**: Once all ✅ checked
