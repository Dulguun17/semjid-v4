# 💳 Payment Submit Error - Quick Fix

## 🔍 Step 1: Find the Error Message

1. Go to `/booking` page
2. Go through all 3 steps
3. On **Step 3** (Payment), click **Submit**
4. **Open Browser Console** (F12)
5. Look for error message starting with `❌` or similar

## Common Errors & Fixes

### Error: "Missing required fields"
**Cause**: Email field not filled
**Fix**: Go back to Step 1 and enter email address (required)

### Error: "Invalid total amount"  
**Cause**: Price calculation mismatch
**Fix**: 
1. Refresh page completely (Ctrl+Shift+R)
2. Select dates again
3. Select room again
4. Submit

### Error: "This room is not available"
**Cause**: Room was booked by someone else
**Fix**:
1. Go back to Step 2
2. Click "Recheck" button
3. Select different room or dates
4. Try again

### Error: "Failed to save booking"
**Cause**: Database connection issue
**Fix**:
1. Check Supabase is online: https://supabase.com/status
2. Restart dev server: `npm run dev`
3. Try booking again

### Error: "Mixed genders not allowed"
**Cause**: Added both male and female guests
**Fix**:
1. Go back to Step 1
2. Change all guests to same gender
3. Continue

### Error: "Checkout must be after checkin"
**Cause**: Date format issue
**Fix**:
1. Change check-in date
2. System auto-calculates +7 days
3. Try again

---

## 🛠️ If Error Not Listed Above

### Step 1: Get Exact Error
1. Open Browser Console (F12)
2. Go to **Network** tab
3. Make booking attempt
4. Look for **POST /api/booking** (red = failed)
5. Click it and see **Response** tab
6. Copy exact error message

### Step 2: Share Error With Me
Tell me the exact error so I can fix it

**Example**:
- "Error: relation "bookings" does not exist"
- "Error: invalid input syntax for integer"
- "Error: undefined column "special_code""

---

## ⚡ Quick Debug Checklist

Before trying again, verify:

- [ ] All form fields filled (name, phone, email, dates)
- [ ] Email looks valid (xxx@xxx.xxx format)
- [ ] Room selected (shows in sidebar)
- [ ] Check-in is future date
- [ ] Checkout auto-filled (+7 days)
- [ ] At least one guest added
- [ ] Payment method selected
- [ ] Server running (`npm run dev`)
- [ ] No errors in browser console (F12)

---

## 🔧 Force Reset Everything

If still not working, try this:

```bash
# Stop server (Ctrl+C)

# Clear Next.js cache
rm -r .next

# Restart
npm run dev
```

Then try booking again.

---

## 💬 Tell me:

What error shows in browser console when you click Submit?
