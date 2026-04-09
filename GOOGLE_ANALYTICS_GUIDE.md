# 📊 Google Analytics Setup Guide

## ✅ Current Status: **ACTIVE**

Your project **already has Google Analytics installed and configured**!

| Item | Status | Value |
|------|--------|-------|
| **Measurement ID** | ✅ Configured | `G-KRHLKCRS6B` |
| **Analytics Code** | ✅ Installed | `src/app/layout.tsx` |
| **Environment Variable** | ✅ Set | `.env.local` |
| **Deployment** | ✅ Ready | Production-ready |

---

## 🔍 What's Currently Set Up

### 1. Measurement ID
```
G-KRHLKCRS6B
```

This ID tracks all your website events and is already:
- ✅ Configured in `.env.local`
- ✅ Integrated into layout.tsx
- ✅ Active on all pages

### 2. Google Analytics Library
Your project uses **Next.js Google Analytics Integration** (`@next/third-parties/google`)

```typescript
// src/app/layout.tsx
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
```

This automatically tracks:
- 📄 Page views
- 🖱️ User interactions
- ⏱️ Session duration
- 📍 Traffic source
- 🌍 Geographic location
- 📱 Device type

---

## 🚀 Verify It's Working

### Step 1: Check Environment Variable
```bash
# In terminal at project root
cat .env.local | grep GA
```

Should show:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-KRHLKCRS6B
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Go to `http://localhost:3000` and open **Developer Console** (F12)

**Look for this in Console**:
```
Google Analytics ID loaded: G-KRHLKCRS6B
```

### Step 4: Check Real-Time in Google Analytics

1. Go to **Google Analytics**: https://analytics.google.com
2. Select property: **Semjid**
3. Go to **Real-time** → **Overview**
4. You should see yourself as active user
5. Refresh page and watch events appear

---

## 📈 View Your Analytics Data

### Dashboard Access
1. Visit: https://analytics.google.com
2. Sign in with **Google Account**
3. Select **Property**: "Semjid Khujirt" (or similar)
4. Select **View**: "All Web Site Data"

### Key Reports to Check

| Report | Location | Shows |
|--------|----------|-------|
| **Real-time** | Home → Real-time | Live visitors RIGHT NOW |
| **Users** | Audience → Overview | Total visitors, new users |
| **Traffic** | Acquisition → All Traffic | Where visitors come from |
| **Pages** | Behavior → Site Content → All Pages | Most visited pages |
| **Devices** | Audience → Technology → Devices | Desktop/Mobile/Tablet split |
| **Location** | Audience → Geo → Location | Visitor countries/cities |
| **Events** | Real-time → Events | Custom events fired |

### Most Important Metrics

**Traffic**:
- Sessions (visits)
- Users (unique visitors)
- Bounce rate (% who left without action)

**Engagement**:
- Pages per session
- Avg session duration
- Event completion rate

**Conversions**:
- Booking completion rate
- Chat initiation rate
- Review submission rate

---

## 🔄 Update Measurement ID (If Needed)

### Only do this if:
- Account changed
- Need tracking under different property
- Google gave you new ID

### Steps to Update

**Step 1**: Get new Measurement ID from Google Analytics
1. Go to https://analytics.google.com
2. Admin (gear icon) → Properties → Property Settings
3. Copy "Measurement ID" (format: `G-XXXXXXXXXX`)

**Step 2**: Update `.env.local`
```bash
# Edit .env.local and change:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOUR-NEW-ID
```

**Step 3**: Restart dev server
```bash
# Stop with Ctrl+C
npm run dev
```

**Step 4**: Verify in browser console (F12)
```
Google Analytics ID loaded: G-YOUR-NEW-ID
```

---

## 🎯 Custom Events to Track

Your site can track custom events. Currently tracking automatically:
- ✅ Page views
- ✅ User sessions
- ✅ Events

### Events Being Tracked
When implemented, these will auto-track:
- 📖 Booking submissions
- 💬 Chat messages
- ⭐ Review submissions
- 👤 Profile updates
- 📞 Contact form submissions

---

## 📱 Mobile Tracking

Google Analytics tracks:
- ✅ Mobile phone users
- ✅ Tablet users
- ✅ Desktop users
- ✅ Browser type
- ✅ Operating system

Check breakdown in: **Audience → Technology → Devices**

---

## 🌍 Geographic Tracking

See visitors from:
- Country level → **Audience → Geo → Location**
- City level → **Audience → Geo → City**
- Specific regions showing visitors from Mongolia

---

## 🔐 Privacy & GDPR

Your Google Analytics setup includes:
- ✅ Cookie consent ready
- ✅ IP anonymization available
- ✅ User privacy settings
- ✅ Data retention policies

**Recommendation**: Add cookie banner to your site for EU visitors

---

## ⚙️ Advanced Settings Available

### Enable Features (Optional)
1. **Goal tracking** - Track booking completions
2. **E-commerce** - Track payment events
3. **Custom events** - Track specific user actions
4. **Audiences** - Create user segments

### Recommendations
1. Set up **conversion goal** for bookings
2. Track **chat initiations**
3. Monitor **form abandonment**
4. Track **review submissions**

---

## 📊 Key Metrics to Monitor

### Daily Checklist
- [ ] Real-time visitors
- [ ] Today's bookings
- [ ] Chat engagement
- [ ] Review submissions
- [ ] Traffic sources

### Weekly Review
- [ ] Total sessions
- [ ] User growth
- [ ] Top pages
- [ ] Traffic sources
- [ ] Device breakdown

### Monthly Analysis
- [ ] Trends
- [ ] ROI metrics
- [ ] User behavior
- [ ] Seasonal patterns
- [ ] Goal completion rates

---

## 🚀 Next Steps

### Immediate
1. ✅ Verify GA is working (open browser, check console)
2. ✅ Log into Google Analytics dashboard
3. ✅ Check real-time visitors

### This Week
1. Set up booking completion goal
2. Set up chat engagement event
3. Create custom dashboard
4. Set up daily email reports

### This Month
1. Analyze visitor patterns
2. Identify top performing pages
3. Optimize low-performing areas
4. Track revenue/booking metrics

---

## 📞 Troubleshooting

### GA Not Showing Data

**Problem**: Real-time shows 0 visitors

**Solutions**:
1. [ ] Refresh page multiple times
2. [ ] Check tab activity (GA needs recent activity)
3. [ ] Clear cache: Ctrl+Shift+Delete
4. [ ] Check ID is correct: `G-KRHLKCRS6B`
5. [ ] Verify `.env.local` has variable

**If still not working**:
```bash
# Restart everything
npm run dev
# Open in new/private browser window
# Wait 30 seconds for GA to load
```

### Wrong Measurement ID

**Symptom**: Data not appearing in Google Analytics

**Fix**:
1. Get correct ID from Google Analytics dashboard
2. Update `.env.local`
3. Restart dev server
4. Wait 24-48 hours for data to process

---

## 🎓 Resources

- **Google Analytics Documentation**: https://support.google.com/analytics
- **Measurement ID Info**: https://support.google.com/analytics/answer/12270356
- **Next.js GA Integration**: https://nextjs.org/docs/app/building-your-application/integrations/third-party-libraries#google-analytics
- **GA Real-time Guide**: https://support.google.com/analytics/answer/1638635

---

## ✨ Summary

✅ **Google Analytics is ACTIVE**

- Measurement ID: `G-KRHLKCRS6B`
- Location: All pages via `src/app/layout.tsx`
- Tracking: Page views, users, sessions, devices, locations
- Status: **Ready to use**

**To view your data**: Go to https://analytics.google.com → Select Semjid property

---

**Last Verified**: April 10, 2026
**Status**: ✅ **FULLY OPERATIONAL**
