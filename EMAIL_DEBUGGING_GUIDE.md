# 📧 Email System Debugging Guide

## ✅ What I Just Fixed

Updated email sender to use Resend's verified domain:
- **Old**: `noreply@semjid-khujirt.mn` ❌ (Not verified)
- **New**: `booking@resend.dev` ✅ (Verified)

---

## 🔍 Why Emails Weren't Being Sent

| Issue | Solution |
|-------|----------|
| Domain not verified in Resend | Using Resend's default `@resend.dev` domain |
| Email errors not logged | Added error logging to see exact failures |
| Missing email validation | Added checks for email field |

---

## 🧪 Test Email System (Do This Now)

### Step 1: Verify Configuration
```bash
# Check .env.local has RESEND_API_KEY
cat .env.local | grep RESEND_API_KEY
```

Expected output:
```
RESEND_API_KEY=re_T5fgCVpp_JaGSgdCr4vPghJ4WwyYB4Wai
```

### Step 2: Check ADMIN_EMAIL  
```bash
# Check admin email is set
cat .env.local | grep ADMIN_EMAIL
```

Expected output:
```
ADMIN_EMAIL=otgonbatzolboo@gmail.com
```

### Step 3: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Make a Test Booking
1. Go to `http://localhost:3000/booking`
2. **Important**: Enter a **REAL EMAIL** you can check (not fake)
3. Fill in all details:
   - Name: "Test Guest"
   - Email: **YOUR REAL EMAIL** 
   - Phone: "8802-1191"
   - Dates: Any 7-day period in future
   - Submit

### Step 5: Check Logs

**Open browser console** (F12) and look for:

**SUCCESS** - You should see:
```
✅ Booking confirmation email sent to test@gmail.com
✅ Admin notification email sent to otgonbatzolboo@gmail.com
```

**ERROR** - You might see one of these:

```
❌ Failed to send booking confirmation email: Error: Missing from email
```
→ **Fix**: RESEND_API_KEY is invalid

```
❌ Failed to send booking confirmation email: Error: Invalid API key
```
→ **Fix**: RESEND_API_KEY is expired or wrong

```
⚠️ No guest email provided
```
→ **Fix**: Booking form didn't capture email field

```
⚠️ ADMIN_EMAIL not configured in .env.local
```
→ **Fix**: Add `ADMIN_EMAIL=otgonbatzolboo@gmail.com` to `.env.local`

---

## 📬 Check Email Arrived

### For Guest Email
1. Check **Inbox** of the email you entered in booking form
2. Look for subject: "✅ Захиалга баталгаажлаа - SKH-XXXXX"
3. If not there, check **SPAM** folder

### For Admin Email  
1. Check email: `otgonbatzolboo@gmail.com`
2. Look for subject: "📋 Шинэ захиалга: SKH-XXXXX - [Guest Name]"
3. If not there, check **SPAM** folder

---

## 🔧 Troubleshooting Checklist

### Email Not Arriving

- [ ] **API Key valid?**
  - Go to https://resend.com/api-keys
  - Verify your key is still active
  - If expired, create new key and update `.env.local`

- [ ] **Guest email captured?**
  - In booking form, verify **email field is filled**
  - Check Supabase → bookings table → email column has data

- [ ] **Admin email set?**
  - Check `.env.local` has `ADMIN_EMAIL` variable
  - Try different email address (Gmail might block)

- [ ] **Check SPAM folder?**
  - Emails from `@resend.dev` sometimes marked as spam
  - Add `booking@resend.dev` to contacts

- [ ] **Connected to internet?**
  - Resend API requires network access
  - Ping google.com to verify

### API Errors

**Error: "Invalid API key"**
- [ ] Go to https://resend.com/api-keys
- [ ] Copy your API key exactly
- [ ] Paste into `.env.local`: `RESEND_API_KEY=re_...`
- [ ] Restart server: `npm run dev`

**Error: "Missing from email"**
- [ ] Not your code issue, contact Resend support
- [ ] Or try new API key from https://resend.com

---

## 📊 Real-Time Email Tracking

### Via Resend Dashboard
1. Go to https://resend.com/emails
2. Log in to your Resend account
3. View all emails sent
4. Check delivery status, bounces, spam

### Via Supabase
1. Go to Supabase → bookings table
2. Verify booking was created
3. Check if `email` field has data
4. Check terminal logs for errors

---

## ✉️ Email Templates

**Guest Confirmation Email**:
- Booking reference number
- Check-in/check-out dates
- Room type
- Total cost
- Special check-in code
- Contact information

**Admin Notification Email**:
- Guest name, phone, email
- Room details
- Date range
- Payment method
- Link to admin panel

**Chat Notification Email**:
- Guest name
- Message content
- Link to admin chat panel

---

## 🚨 Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| "Task timed out" | Resend API slow | Retry, wait 10 seconds |
| Emails going to SPAM | Domain reputation | Add to email whitelist |
| Wrong sender name | Not using Resend domain | Already fixed! ✅ |
| Email format wrong | HTML template error | Template is correct now |
| No admin email sent | ADMIN_EMAIL not set | Set `ADMIN_EMAIL=...` in `.env.local` |

---

## 📞 Next Steps

### If Emails Now Work ✅
1. Congratulations! Email system is live
2. Run the **Feature Activation Checklist** step 3

### If Emails Still Don't Work ❌
1. Check `.env.local` has BOTH `RESEND_API_KEY` and `ADMIN_EMAIL`
2. Look at server terminal for error messages
3. Try with different phone number/dates
4. Check email is real (not @test.com)

---

## 🔗 Resources

- **Resend Documentation**: https://resend.com/docs
- **API Key Management**: https://resend.com/api-keys
- **Email Status**: https://resend.com/emails
- **Supabase Logs**: Dashboard → Logs

---

**Last Updated**: April 10, 2026
**Email System**: ✅ **FIXED & READY TO TEST**
