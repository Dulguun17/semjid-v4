# 🚀 Dynamic Website Setup Guide

Your website is now fully dynamic! Here's everything you need to know to manage your content through the admin panel.

## 📋 What You Can Now Control

### ✅ 1. **Website Content** (`/admin/content`)
- **Hero Section**: Badge, tags, description, background image, CTA buttons
- **About Section**: Title, paragraphs, statistics, images
- **Room Descriptions**: Room details and images
- **Conditions Section**: Medical information
- **Gallery & Services**: All descriptions and images
- **Footer**: All footer text and links
- **Bilingual Support**: Switch between Mongolian (МН) and English (EN)

### ✅ 2. **Room Pricing & Images** (`/admin/rooms-management`)
- Update room prices for:
  - Adult (1 person)
  - Adult (2 persons)
  - Children (0-2 years)
- Upload/change room images
- Changes reflect instantly on `/rooms` page

### ✅ 3. **Global Settings** (`/admin/settings`)
- upload **Referral Letter PDF** for guests to download
- Automatically available on `/booking` page
- Guests can download before arrival

## 🔧 Initial Setup Steps

### Step 1: Set Up Database Tables

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a **New Query**
3. Copy and paste the content from: `supabase/create_rooms_table.sql`
4. Click **Run**

This creates the `rooms` table for dynamic pricing.

### Step 2: Create Storage Buckets

Your Supabase needs two storage buckets for files:

1. **For Referral Letters**:
   - Go to Supabase → **Storage**
   - Click **Create bucket**
   - Name: `ilgeeh-bichig`
   - Set to **Public**
   - Click **Create**

2. **For Room/Content Images** (if doesn't exist):
   - Name: `resort-images`
   - Set to **Public**
   - Click **Create**

### Step 3: Test it Works

1. **Login** to admin panel: `/admin/login`
2. Go to **Settings** (`/admin/settings`)
   - Upload any PDF file as a test referral letter
   - You should see upload success message
3. Go to **Content** (`/admin/content`)
   - Edit a section title
   - Click Save
   - Check that it saved successfully
4. Go to **Rooms** (`/admin/rooms-management`)
   - Edit a room price
   - Upload a new image
   - Click Save

### Step 4: Verify on Public Site

After uploading content:
1. Check `/booking` page - should show your referral letter download link
2. Check `/rooms` page - should show updated prices and images
3. Check `/about` page - should show updated About section
4. Homepage should show all updated content

## 📱 Admin Panel Structure

```
Admin Dashboard (/)
├── Хяналтын самбар (Overview)
├── Аналитик (Analytics)
├── Захиалгын календар (Booking Calendar)
├── Зочид (Guests List)
├── Өрөөний удирдалга (Rooms Management)  ← Room prices & images
├── Контент удирдах (Content Editor)     ← All website text & images
├── Тохиргоо (Settings)                  ← Referral letters & global settings
└── Чат (Chat Support)
```

## 🎨 Making Changes

### To Update Content:
1. Go to `/admin/content`
2. Select section (Hero, About, Rooms, etc.)
3. Select language (МН or EN)
4. Edit text fields
5. Upload images if needed
6. Click **Хадгалах** (Save)

### To Update Prices:
1. Go to `/admin/rooms-management`
2. Click **Edit** on room card
3. Change prices or upload new image
4. Click **Save**

### To Upload Referral Letter:
1. Go to `/admin/settings`
2. Drag & drop PDF or click to browse
3. File automatically appears on `/booking` page

## 🔐 Security

- All admin pages require authentication
- Only authenticated users can make changes
- Database uses Row Level Security (RLS)
- Files are stored in Supabase Storage
- All changes are logged with timestamps

## 💾 Where Data is Stored

| Data | Location | Edit At |
|------|----------|---------|
| Text Content | Supabase `content` table | `/admin/content` |
| Images (content) | Supabase Storage `resort-images` | `/admin/content` |
| Room Prices | Supabase `rooms` table | `/admin/rooms-management` |
| Room Images | Supabase Storage `resort-images` | `/admin/rooms-management` |
| Referral Letter | Supabase Storage `ilgeeh-bichig` | `/admin/settings` |
| Settings | Supabase `settings` table | `/admin/settings` |

## ⚡ How It Works Behind the Scenes

```javascript
// Frontend fetches dynamic content
const { data } = await supabase.from("content").select("*");
// Component displays fetched content
// When you update in admin → frontend automatically shows new content
```

## 🐛 Troubleshooting

### Content not updating?
- Clear browser cache (Ctrl+Shift+Delete)
- Check Supabase tables have data
- Verify you're logged in to admin

### Images not uploading?
- Check file size (max 10MB)
- Ensure image format: JPG, PNG, WebP
- Check storage buckets exist and are public

### Room prices not showing?
- Create `rooms` table using SQL from `supabase/create_rooms_table.sql`
- Verify prices are saved in Supabase
- Check database RLS policies

### File upload failing?
- Ensure `ilgeeh-bichig` bucket exists and is public
- Check file is PDF format
- File size under 10MB

## 📚 File Locations

- Admin pages: `src/app/admin/*/page.tsx`
- Upload APIs: `src/app/api/upload/` and `src/app/api/upload-image/`
- Database helpers: `src/lib/dynamic-data.ts`
- Migrations: `supabase/*.sql`

## 🎯 Next Steps

1. ✅ Create rooms table (SQL migration)
2. ✅ Create storage buckets
3. ✅ Upload your referral letter PDF
4. ✅ Update room prices
5. ✅ Update website copy and images
6. ✅ Test all pages on public site

## 💡 Pro Tips

- Edit content in batches to avoid confusion
- Always proofread Mongolian/English versions
- Use consistent image sizes for best appearance
- Test on mobile after updating
- Keep referral letter updated with latest requirements

## ❓ Questions?

Check these files for technical details:
- Dynamic data loading: `src/lib/dynamic-data.ts`
- Upload handling: `src/app/api/upload/route.ts`
- Schema: `supabase/schema.sql`
- Migrations: `supabase/create_rooms_table.sql`

---

**Your website is now fully dynamic and ready to manage! 🎉**
