# 🚀 Final Pre-Launch Checklist & Deployment Guide

**Status**: Website is ready to deploy! Follow these steps to go live.

---

## ✅ Completed Setup

- [x] `.env.local` configured with Supabase credentials
- [x] Bank account details updated: `08 0005 00 5557333756`
- [x] Production build verified and passing
- [x] Build errors fixed (Suspense boundaries added)

---

## 📋 Immediate Tasks (Do Now)

### 1. **Run Supabase Migrations** ⚠️ CRITICAL

See [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) for complete instructions.

**Copy & run these in Supabase SQL Editor:**

1. **Main schema** (tables, RLS, auth)
2. **Rooms table** (pricing, availability)
3. **Storage buckets** (resort-images, ilgeeh-bichig)
4. **Admin user** account

**Time**: ~5 minutes

### 2. **Test Locally**

```bash
npm run dev
```

- Visit `http://localhost:3000` - Homepage works ✓
- Visit `/booking` - Booking page loads ✓
- Visit `/admin/login` - Admin panel loads ✓
- Try `/login` and `/signup` - Auth pages work ✓

### 3. **Push to GitHub**

```bash
git add .
git commit -m "fix: add Suspense boundaries, update bank account, add deployment guides"
git push origin main
```

---

## 🌐 Deploy to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in or create account
3. Click **Add New** → **Project**
4. Select your GitHub repo: `Viuax/Semjid-v4`
5. Click **Import**

### Step 2: Configure Environment Variables

In Vercel Project Settings → **Environment Variables**, add:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-KRHLKCRS6B
NEXT_PUBLIC_SUPABASE_URL=https://qgutrcekzdaicxhjtrcx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_EMAIL=otgonbatzolboo@gmail.com
RESEND_API_KEY=re_T5fgCVpp_JaGSgdCr4vPghJ4WwyYB4Wai
NEXT_PUBLIC_SITE_URL=https://[YOUR_PROJECT].vercel.app
```

**Copy values from**: `.env.local`

### Step 3: Deploy

1. All variables set → Click **Deploy**
2. Wait for build to complete (~2 min)
3. Get your Vercel URL: `https://semjid-v4.vercel.app`

✅ **Live!**

---

## 🎯 Post-Deployment: Admin Setup (5 min)

1. **Visit your Vercel URL**
2. **Go to `/admin/login`**
3. **Login with**: 
   - Email: `otgonbatzolboo@gmail.com`
   - Password: (the one you set in Supabase)

### Quick Admin Tasks

**In `/admin/settings`:**
- Upload referral letter PDF → saves to Supabase storage
- This appears on `/booking` page automatically

**In `/admin/rooms-management`:**
- Upload room images
- Verify prices are correct
- Check availability calendar

**In `/admin/content`:**
- Edit website sections (hero, about, rooms, etc.)
- Upload images for each section
- New content syncs to public site instantly

---

## 💳 QPay Integration (Optional — For Later)

Currently shows **placeholder** in booking form.

**To add real QPay:**

1. Register at [qpay.mn](https://qpay.mn)
2. Get your **Merchant ID** and **API Token**
3. Update [src/components/sections/BookingPageContent.tsx](src/components/sections/BookingPageContent.tsx#L550)
4. Replace QPay QR code SVG with API call
5. Deploy

---

## 🌍 Custom Domain (Optional)

Once deployed to Vercel, you can add your custom domain:

1. **Vercel** → Project → **Settings** → **Domains**
2. **Enter domain**: `semjid-khujirt.mn` (or your choice)
3. Follow DNS setup instructions
4. Update `NEXT_PUBLIC_SITE_URL` in env variables

---

## 🔒 Security Checklist

- [x] `.env.local` in `.gitignore` (not committed)
- [x] Real bank account added
- [x] Admin email configured
- [x] Supabase RLS (Row Level Security) enabled
- [x] Database backups enabled (Supabase default)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Analytics tracking verified
- [ ] Contact info updated (if needed)

---

## 📊 Monitoring & Support

### After Going Live

1. **Check Vercel Analytics**
   - Real-time page views
   - Edge function performance
   - Build status

2. **Monitor Supabase**
   - Database usage
   - Storage usage
   - Auth logs
   - Chat messages

3. **Test Booking Flow**
   - Create test bookings
   - Verify emails sent
   - Check admin notification

### Common Issues

| Issue | Solution |
|-------|----------|
| 404 Not Found | Check Vercel deployment status |
| Database connection error | Verify env variables in Vercel |
| Images not loading | Check Supabase bucket permissions (Public) |
| Admin login fails | Check Supabase auth & user creation |
| QPay not working | Will show placeholder until configured |

---

## 🎉 Going Live Checklist

- [ ] Supabase migrations completed
- [ ] Admin user created & tested
- [ ] Repository pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables set in Vercel
- [ ] Deployment successful
- [ ] Admin panel tested (login, upload files)
- [ ] Booking form tested
- [ ] Homepage loads correctly
- [ ] All pages accessible
- [ ] Analytics tracking works (optional)

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **QPay Integration**: https://qpay.mn/integration

---

**Estimated Time to Live**: **30 minutes**

1. Run migrations (5 min)
2. Push to GitHub (2 min)
3. Connect & deploy Vercel (10 min)
4. Test & verify (10 min)
5. Admin setup & files (5 min)

**Good luck! 🚀**
