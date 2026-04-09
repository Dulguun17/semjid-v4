# 🌐 Domain Purchase & Website Publishing Guide

**Complete beginner-friendly walkthrough**

---

## Part 1: Understanding the Basics

### What You Need
1. **Domain** - Your website address (e.g., `semjid-khujirt.mn`)
2. **Hosting** - Where your website lives (we use Vercel - FREE)
3. **DNS** - Points your domain to Vercel (we'll set this up)

### What You Already Have
✅ Website code (ready to deploy)  
✅ Supabase database (back-end)  
✅ `.env.local` with all credentials  

### What Costs Money
- **Domain**: ~$10-15/year
- **Hosting**: FREE (Vercel)
- **Database**: FREE tier (Supabase) - or paid if you grow

**Total Cost: ~ 10,000-15,000₮/year for domain only**

---

## Part 2: Where to Buy a Domain

### Option 1: GoDaddy (Easiest for Mongolia)
**Website**: [godaddy.com](https://godaddy.com)

**Steps**:
1. Go to godaddy.com
2. Search for your domain (e.g., `semjid-khujirt.mn`)
3. Add to cart
4. Pay (credit card or PayPal)
5. You own it! ✓

**Typical cost**: $12/year for `.mn` domain

### Option 2: Namecheap
**Website**: [namecheap.com](https://namecheap.com)

**Steps**: Same as GoDaddy  
**Similar cost**: $12-15/year

### Option 3: Local Mongolian Registrar
- **www.marcom.mn** - Mongolian domain registrar
- May support local payment methods
- Similar pricing

---

## Part 3: Deploy to Vercel (FREE Hosting)

### Step 1: Create Vercel Account
1. Go to **[vercel.com](https://vercel.com)**
2. Click **Sign Up** (top right)
3. Choose **GitHub** to sign up
4. Authorize with your GitHub account
5. Verify email
6. Done! ✓

### Step 2: Import Your GitHub Repository

1. In Vercel, click **+ Add New** (top)
2. Select **Project**
3. Click **Import Git Repository**
4. Search for: `Semjid-v4` (or `Viuax/Semjid-v4`)
5. Click **Import**

### Step 3: Add Environment Variables

1. You'll see a page asking for environment variables
2. Copy each from your `.env.local` file:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID = G-KRHLKCRS6B
NEXT_PUBLIC_SUPABASE_URL = https://qgutrcekzdaicxhjtrcx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
ADMIN_EMAIL = otgonbatzolboo@gmail.com
RESEND_API_KEY = re_T5fgCVpp_...
NEXT_PUBLIC_SITE_URL = https://semjid-v4.vercel.app
```

**Where to find `.env.local`:**
```
d:\Semjid\dulguun\.env.local
```

3. Paste each variable in Vercel
4. Click **Deploy**

### Step 4: Wait for Deployment

- Vercel will build your site (~2-3 minutes)
- You'll see a progress bar
- When done, you get a **live URL**

**Example**: `https://semjid-v4.vercel.app`

✅ **Your website is now LIVE on the internet!**

---

## Part 4: Connect Your Domain to Vercel

### After You Buy Domain

**You now own**: `semjid-khujirt.mn` (example)

### Connect to Vercel (Step by Step)

#### Step 1: In Vercel Dashboard

1. Open your Vercel project
2. Go to **Settings** (top menu)
3. Click **Domains** (left sidebar)
4. Under "Production Domains", paste your domain: `semjid-khujirt.mn`
5. Click **Add**

#### Step 2: Vercel Gives You DNS Instructions

Vercel will show you:
```
Type: A
Name: @
Value: 76.76.19.20
```

**Keep this window open!** You'll need this info next.

#### Step 3: Login to Domain Registrar (GoDaddy example)

1. Go to [godaddy.com](https://godaddy.com)
2. Login with your account
3. Click **My Products** (top left)
4. Find your domain: `semjid-khujirt.mn`
5. Click **Manage DNS** (next to the domain)

#### Step 4: Update DNS Records

In GoDaddy DNS Management:

1. Look for existing **A Record** (might say `@`)
2. Click **Edit** (pencil icon)
3. Replace the value with Vercel's IP: `76.76.19.20`
4. Click **Save**

**Alternatively, add a new record:**
- Type: `A`
- Name: `@` (or blank)
- Value: `76.76.19.20`
- TTL: `3600`

#### Step 5: Wait for DNS Propagation

- Takes 15 minutes to 24 hours (usually 30 min)
- DNS "propagates" around the world
- Be patient! ✓

#### Step 6: Test It Works

After 30 minutes, try visiting:
```
https://semjid-khujirt.mn
```

If it works → **CONGRATULATIONS! 🎉**

---

## Part 5: Complete Timeline

### What Happens When

| Time | What's Happening |
|------|------------------|
| **Now** | You're reading this |
| **5 min** | Purchase domain (GoDaddy) |
| **10 min** | Vercel setup starts |
| **20 min** | Deploy to Vercel (get live URL) |
| **25 min** | Update DNS in domain registrar |
| **30-60 min** | "DNS Propagation" (behind scenes) |
| **1-24 hours** | Domain works worldwide ✓ |

---

## Part 6: After Going Live - Admin Setup

Once your domain works, setup your admin panel:

### Admin Panel Setup (5 min)

1. Visit: `https://semjid-khujirt.mn/admin/login`
2. Login:
   - Email: `otgonbatzolboo@gmail.com`
   - Password: (you set this in Supabase)
3. Upload files:
   - Referral letter → `/admin/settings`
   - Room images → `/admin/rooms-management`
4. Edit content → `/admin/content`

---

## Part 7: Troubleshooting

### Domain Not Connecting?

**Problem**: Domain shows "Domain doesn't resolve"

**Solution**:
1. Check DNS records in domain registrar
2. Verify IP is correct: `76.76.19.20`
3. Wait longer (up to 24 hours)
4. Try: `nslookup semjid-khujirt.mn` in terminal

### Vercel Build Failed?

**Problem**: You see error after clicking Deploy

**Solution**:
1. Check environment variables (copy again)
2. Check `.env.local` file in your repo
3. Redeploy: Click **Deployments** → **Redeploy**

### Website Shows Old Version?

**Problem**: You updated code but site didn't change

**Solution**:
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys on every push
3. Wait 2-3 minutes for new build

---

## Part 8: Quick Checklist

### Before Purchasing Domain
- [ ] Website built locally: `npm run dev` works
- [ ] Production build passes: `npm run build` succeeds
- [ ] Supabase migrations completed
- [ ] `.env.local` configured

### When Purchasing Domain
- [ ] Choose domain name (e.g., `semjid-khujirt.mn`)
- [ ] Buy from GoDaddy, Namecheap, or local registrar
- [ ] Get confirmation email (keep this!)
- [ ] Can take 15-60 min to register

### When Deploying to Vercel
- [ ] Create Vercel account (free)
- [ ] Import GitHub repo
- [ ] Add environment variables
- [ ] Deploy (automatic)
- [ ] Get live URL

### When Connecting Domain
- [ ] Login to domain registrar
- [ ] Find DNS Management
- [ ] Add/update A record
- [ ] Set value to Vercel IP
- [ ] Wait for DNS propagation

### After Going Live
- [ ] Test website works
- [ ] Test admin panel
- [ ] Upload files in admin panel
- [ ] Create test booking
- [ ] Share link with friends!

---

## Part 9: Examples

### Example 1: Using GoDaddy (Full Process)

```
1. Go to GoDaddy.com
2. Search: "semjid-khujirt.mn"
3. See price: $12/year
4. Add to cart
5. Checkout (use credit card)
6. Pay ~$15 (with taxes)
7. Wait 5-15 minutes
8. Check email for confirmation
9. Login to GoDaddy
10. Navigate to DNS settings
11. Update A record: 76.76.19.20
12. Wait 30 minutes
13. Visit semjid-khujirt.mn
14. SUCCESS! ✓
```

### Example 2: Using Vercel (Full Process)

```
1. Go to Vercel.com
2. Sign up (use GitHub)
3. Click: + Add New → Project
4. Select: Semjid-v4 repo
5. Click: Import
6. Add environment variables (copy from .env.local)
7. Click: Deploy
8. Wait 2-3 minutes
9. See message: "Congratulations. Your site has been deployed"
10. Get URL: semjid-v4.vercel.app
11. TEST IT! Click link
12. SUCCESS! ✓
```

---

## Part 10: Monthly/Yearly Costs

### Your Actual Costs

| Item | Cost | Notes |
|------|------|-------|
| Domain | $12-15/year | One time per year (auto-renew) |
| Hosting (Vercel) | FREE | Unlimited for small sites |
| Database (Supabase) | FREE | Free tier for small traffic |
| Email (Resend) | FREE (tier) | Included, pay if heavy usage |
| **Total** | **~$1/month** | 10,000-15,000₮/year |

### When You Grow
- Vercel charges if more than X deployments
- Supabase charges if more than X database calls
- But FREE tier is plenty for a resort booking site

---

## 🎯 Next Actions

### RIGHT NOW (Do This Today)

1. **Buy Domain**
   - Go to GoDaddy.com or Namecheap.com
   - Search for your domain
   - Buy it ($12-15)
   - Save confirmation email

2. **Deploy to Vercel**
   - Go to Vercel.com
   - Sign up with GitHub
   - Import Semjid-v4 repository
   - Add `.env.local` variables
   - Deploy

3. **Connect Domain**
   - Login to domain registrar
   - Update DNS A record to: `76.76.19.20`
   - Wait 30 minutes to 24 hours

### WITHIN 24 HOURS

- [ ] Domain works: `semjid-khujirt.mn`
- [ ] Visit `/admin/login`
- [ ] Upload referral letter
- [ ] Upload room images
- [ ] Test booking

### AFTER 1 DAY

- [ ] Website fully live
- [ ] Admin panel working
- [ ] Bookings coming in
- [ ] CELEBRATE! 🎉

---

## 📞 Help & Support

### I'm Stuck On...

| Question | Answer |
|----------|--------|
| Which domain registrar? | GoDaddy easiest, but any works |
| How much does it cost? | ~$12-15/year (affordable!) |
| Is hosting free? | YES - Vercel is free |
| When do I pay? | Only when domain renews (yearly) |
| Can I change domain later? | Yes, but requires DNS update |
| What if DNS doesn't resolve? | Wait 24 hours or contact support |

### Learn More

- **Vercel Docs**: https://vercel.com/docs/deployments/overview
- **GoDaddy DNS**: https://www.godaddy.com/help/change-an-a-record-19226
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 🎉 You're Ready!

**Total Steps: 15**  
**Total Time: ~1 hour**  
**Total Cost: ~$15**  
**Result: Live website online for a year!**

---

**Questions? Ask me! I'll walk you through any step.**
