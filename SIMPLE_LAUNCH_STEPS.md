# 🚀 Simple 3-Step Website Launch

**No experience needed. Follow these steps exactly.**

---

## STEP 1: BUY DOMAIN (5 minutes)

### What is a domain?
A domain is your website address. Like: `semjid-khujirt.mn`

### Where to buy?
Go to: **[GoDaddy.com](https://godaddy.com)**

### How to buy (exactly):

1. Open **GoDaddy.com** in browser
2. In the search box at top, type your domain:
   ```
   semjid-khujirt.mn
   ```
   (Or any name you want like: `semjid.mn`, `khujirt.mn`, etc.)

3. Click **Search** button

4. You'll see the price (usually $12/year)

5. Click green **Add to Cart** button

6. Click **Proceed to Checkout**

7. Create account (email + password)

8. Enter credit card OR PayPal

9. Click **Complete Purchase**

10. Check your email - you'll get confirmation ✓

**DONE!** You now own a domain.

---

## STEP 2: DEPLOY WEBSITE TO VERCEL (15 minutes)

### What is Vercel?
It's FREE hosting. Your website lives on their computers.

### How to deploy:

**2a. Create Vercel Account**

1. Go to: **[Vercel.com](https://vercel.com)**
2. Click **Sign Up** (top right)
3. Click **GitHub** button
4. Login to GitHub (or create account)
5. Click **Authorize**
6. Email verification (check your email)

**DONE!** You have a Vercel account.

---

**2b. Deploy Your Website**

1. In Vercel, click **+ Add New** button
2. Click **Project**
3. Click **Import Git Repository**
4. Find your repo: `Semjid-v4` (or `Viuax/Semjid-v4`)
5. Click **Import**

Now you need to add your `.env.local` file contents:

**To find your `.env.local`:**
- Open: `d:\Semjid\dulguun\.env.local`
- Copy ALL the content

**In Vercel:**
6. You see screen asking for "Environment Variables"
7. For each line in your `.env.local`, add it:
   - **NAME**: (the part before `=`)
   - **VALUE**: (the part after `=`)
   
   Example:
   ```
   NAME: NEXT_PUBLIC_GA_MEASUREMENT_ID
   VALUE: G-KRHLKCRS6B
   ```

8. Click **Add** for each one

9. Click **Deploy** button (big blue button)

**WAIT** → Vercel builds your site (2-3 minutes)

10. When done, you'll see:
    ```
    ✓ Deployment complete!
    ```

11. Copy the URL it gives you, like:
    ```
    https://semjid-v4.vercel.app
    ```

12. Visit that URL in your browser → You see your website live! ✓

**DONE!** Website is live on the internet.

---

## STEP 3: CONNECT DOMAIN TO VERCEL (10 minutes)

### What we're doing:
Making your domain (`semjid-khujirt.mn`) point to Vercel.

### How to connect:

**3a. Add Domain to Vercel**

1. In Vercel, go to your project
2. Click **Settings** (top menu bar)
3. Click **Domains** (left sidebar)
4. Under "Production Domains", paste your domain:
   ```
   semjid-khujirt.mn
   ```
5. Click **Add**

**Get DNS Info:**
Vercel shows you something like:
```
Type: A
Name: @
Value: 76.76.19.20
```

**KEEP THIS WINDOW OPEN** - copy this IP: `76.76.19.20`

---

**3b. Update Domain Registrar (GoDaddy)**

1. Go back to **[GoDaddy.com](https://godaddy.com)**
2. Login to your account
3. Click **My Products** (top left)
4. Find your domain in the list
5. Click **Manage** next to it
6. Look for **DNS Settings** tab
7. Find the **A Record** (might have @ symbol)
8. Click **Edit** button
9. Change the value to: `76.76.19.20`
10. Click **Save**

**DNS Propagation:**
- DNS changes take 15 min to 24 hours
- Your domain will start working
- It's automatic, just wait ✓

---

## 30 MINUTES LATER...

**Test if it works:**

Open your browser and visit:
```
https://semjid-khujirt.mn
```

If you see your website → **CONGRATULATIONS! 🎉**

---

## THAT'S IT!

You now have:
- ✓ Website published on internet
- ✓ Custom domain (`semjid-khujirt.mn`)
- ✓ Automatic HTTPS (secure 🔒)
- ✓ Live for the whole world

---

## NEXT: ADMIN PANEL

**Once domain works**, setup admin:

1. Visit: `https://semjid-khujirt.mn/admin/login`
2. Login with:
   - Email: `otgonbatzolboo@gmail.com`
   - Password: (you set this)
3. Upload files and edit content

---

## COSTS

| Item | Cost |
|------|------|
| Domain (1 year) | $12-15 |
| Hosting (Vercel) | FREE |
| **Total** | **$12-15/year** |

---

## HELP

**Something went wrong?**

**Problem**: Vercel deployment failed
- **Fix**: Go to "Deployments" tab → Click "Redeploy"

**Problem**: Domain doesn't work
- **Fix**: Wait 30 minutes (DNS is updating)
- **If still broken**: Check DNS record is `76.76.19.20`

**Problem**: Website shows old version
- **Fix**: Your code needs to be pushed to GitHub first
- Run: `git push origin main`
- Vercel auto-deploys

---

## 🎯 SUMMARY

1. **BUY DOMAIN** (GoDaddy) - $12
   - Takes 10 minutes

2. **DEPLOY SITE** (Vercel) - FREE
   - Takes 15 minutes

3. **CONNECT DOMAIN** (Update DNS) - FREE
   - Takes 5 minutes + 30 min wait

**Total: 1 hour to go FULLY LIVE 🚀**

---

**Next step: If you need help with any of these steps, ask me!**
