# Dynamic Website and Workspace Setup

The admin area now has separate staff and CEO workspaces. Complete the role migration and assign verified accounts before expecting an existing administrator to access either workspace. Full role assignment and permission checks are in [ADMIN_WORKSPACE_ROLES_SETUP.md](./ADMIN_WORKSPACE_ROLES_SETUP.md).

The online booking flow remains closed. This guide describes existing administrative features, not permission to reopen bookings.

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

Do not run `supabase/schema.sql` against a database with existing records; that file drops application tables. After any required table setup, apply `supabase/workspace_roles_migration.sql` before deploying the workspace changes. Do not rerun older SQL setup scripts afterward because they may recreate legacy authenticated-user policies. The role migration preserves records and replaces workspace table policies.

The current data-preserving migration sequence, including booking, payment, CEO reporting, and customer booking ownership, is maintained in [ADMIN_WORKSPACE_ROLES_SETUP.md](./ADMIN_WORKSPACE_ROLES_SETUP.md). Do not apply migrations to production as part of local verification.

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
2. Verify that the account is explicitly assigned `staff` and manager access in `workspace_roles` using the secure instructions.
3. Go to **Settings** (`/admin/settings`) as an explicitly assigned manager
   - Upload any PDF file as a test referral letter
   - You should see upload success message
4. Go to **Content** (`/admin/content`)
   - Edit a section title
   - Click Save
   - Check that it saved successfully
5. Go to **Rooms** (`/admin/rooms-management`)
   - Edit a room price
   - Upload a new image
   - Click Save

### Step 4: Verify on Public Site

After uploading content:
1. `/booking` remains closed and displays a closure notice; the existing referral letter setting is retained but is not shown in the closed booking flow.
2. Check `/rooms` page - should show updated prices and images
3. Check `/about` page - should show updated About section
4. Homepage should show all updated content

## 📱 Workspace Structure

```
Staff Workspace (/admin)
├── Bookings, calendar, and room availability
├── Client contacts and messages
├── Reception payment ledger, separate from booking status
└── Manager-only settings, content, and room pricing

CEO Workspace (/admin/ceo)
└── Read-only aggregate business report; not accounting profit or recognized revenue
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

## 🔐 Access and Data

- Public signups are assigned the `customer` role by a database trigger; auth metadata cannot grant staff or CEO access.
- Staff and CEO roles are assigned by an authorized operator in Supabase SQL Editor. Settings, content, and room pricing changes additionally require an explicitly designated staff manager.
- Admin routes, service-role upload/chat endpoints, and direct table access enforce role checks. A signed-in customer is not an administrator.
- Booking value is not proof of money received. Only completed ledger receipts and refunds are reported as cash activity.
- Customer booking history is restricted by a database-owned account ID, not an email or guessed reference. Existing records are not auto-linked.
- Public booking submission remains closed. The bed availability preview is test-only and forcibly unavailable in production. QPay is not connected.
- See [ADMIN_WORKSPACE_ROLES_SETUP.md](./ADMIN_WORKSPACE_ROLES_SETUP.md) for role assignment, migration sequencing, and test account checks.

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

**This is a pre-launch working copy. Database permissions, provider setup, business terms, and end-to-end checks remain outstanding.**
