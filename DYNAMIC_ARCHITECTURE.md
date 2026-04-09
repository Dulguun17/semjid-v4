# 🏗️ Dynamic Website Architecture

This document explains how your website's dynamic system works.

## System Overview

```
┌─────────────────────┐
│   Admin Panel       │
│  (/admin/*)         │
├─────────────────────┤
│ • Content Editor    │
│ • Rooms Management  │
│ • Settings/Files    │
└──────────┬──────────┘
           │
      Updates to
           │
┌──────────▼──────────────────┐
│   Supabase Database         │
├─────────────────────────────┤
│ Tables:                     │
│ • content                   │
│ • rooms                     │
│ • settings                  │
│ • bookings                  │
│ • reviews                   │
├─────────────────────────────┤
│ Storage Buckets:            │
│ • resort-images             │
│ • ilgeeh-bichig             │
└──────────┬──────────────────┘
           │
      Reads from
           │
┌──────────▼─────────────────┐
│  Public Website             │
├────────────────────────────┤
│ • / (homepage)              │
│ • /rooms (room prices)      │
│ • /about                    │
│ • /booking (referral letter)│
│ • /services                 │
│ • All dynamic content       │
└────────────────────────────┘
```

## Core Tables

### 1. `content` Table
Stores all website text and images.

```sql
content {
  id: "hero-badge-mn",          -- unique identifier
  section: "hero",              -- hero, about, rooms, etc.
  key: "badge",                 -- field name
  lang: "mn",                   -- mn or en
  value: "Text content",        -- text content
  image_url: "https://...",     -- image URL if image
  updated_at: timestamp
}
```

**Example content by section:**
- `hero`: badge, tags, description, images
- `about`: title, paragraphs, statistics
- `rooms`: room descriptions, amenities
- `conditions`: medical information
- `footer`: footer text and links
- `images`: gallery images

### 2. `rooms` Table
Stores dynamic room pricing.

```sql
rooms {
  id: "luxury",         -- room ID
  adult1: 113000,       -- price for 1 adult
  adult2: 113000,       -- price for 2 adults
  child02: 43000,       -- price for children 0-2
  child37a: 53000,      -- price for children 3-7
  img: "https://...",   -- room image URL
  updated_at: timestamp
}
```

### 3. `settings` Table
Stores global settings.

```sql
settings {
  id: "main",
  referral_letter_url: "https://storage.../referral.pdf",
  updated_at: timestamp
}
```

## File Upload Flow

### Upload Endpoint: `/api/upload`

```
User selects file
        ↓
POST /api/upload (FormData)
        ↓
Validate file type & size
        ↓
Upload to Supabase Storage
        ↓
Get public URL
        ↓
Return URL to client
        ↓
Save URL to database
```

**Supported file types:**
- PDFs (referral letters, documents)
- Images: JPEG, PNG, WebP

**Size limit:** 10MB

### Upload Endpoint: `/api/upload-image`

Same as `/api/upload` but specifically for room images.

## Frontend Data Fetching

### Static + Dynamic Merge (for rooms)

```javascript
// src/lib/dynamic-data.ts
export async function getDynamicRooms() {
  // Fetch live prices from Supabase
  const { data } = await supabase
    .from("rooms")
    .select("id, adult1, adult2, child02, img");

  // Merge with static room data
  // If Supabase has price → use it
  // If Supabase missing → use static default
  return mergedRooms;
}
```

**Usage in pages:**
```javascript
// /rooms/page.tsx
const rooms = await getDynamicRooms();
// Display merged data with live prices
```

### Direct Content Fetching

```javascript
// Any page can fetch content
const { data } = await supabase
  .from("content")
  .select("*")
  .eq("section", "hero")
  .eq("lang", "mn");

// Display content directly
```

## Component Architecture

### Content Management Component

```javascript
ContentEditor {
  ├── Language Selector (MN/EN)
  ├── Section Tabs (Hero, About, etc.)
  ├── Field Editor (text, textarea, image, file)
  ├── Upload Handler
  └── Save Function
}
```

### Rooms Management Component

```javascript
RoomsManagement {
  ├── Session Rooms Grid
  ├── Room Card (image, prices)
  ├── Edit Mode
  │   ├── Price Inputs
  │   ├── Image Upload
  │   └── Save/Cancel
  └── Display Mode
```

### Settings Component

```javascript
Settings {
  ├── Settings Loader
  ├── File Upload Panel
  ├── Current File Display
  ├── File Download Button
  └── File Removal
}
```

## Data Flow Examples

### Example 1: Update Room Price

```
Admin edits price in UI
        ↓
onChange event fires
        ↓
Local state updated
        ↓
Admin clicks Save
        ↓
POST /api/update with new price
        ↓
Supabase upserts into rooms table
        ↓
Success message shown
        ↓
Frontend pages fetch updated price
        ↓
/rooms page displays new price
```

### Example 2: Update Content

```
Admin types new title
        ↓
Local state updates
        ↓
Admin clicks Save
        ↓
Supabase upserts into content table
        ↓
Frontend re-fetches content
        ↓
Homepage displays new title
```

### Example 3: Upload Referral Letter

```
Admin selects PDF file
        ↓
Validation: Check format & size
        ↓
Upload to ilgeeh-bichig bucket
        ↓
Get public URL
        ↓
Save URL to settings table
        ↓
/booking page fetches from settings
        ↓
User sees download link
```

## Security Layers

1. **Authentication**
   - Admin pages require Supabase Auth session
   - Check in layout.tsx

2. **Row Level Security (RLS)**
   - Database policies enforce auth
   - Only authenticated users can read/update
   - See schema.sql for policies

3. **File Validation**
   - File type checking on upload
   - File size limits (10MB max)
   - UUID-based naming (no user input in filename)

4. **Access Control**
   - Supabase manages who can edit
   - JWT tokens required
   - Signed URLs for file access

## Performance Optimizations

1. **Caching**
   - Content fetched on demand
   - Images cached by browser
   - Static data fallback if DB slow

2. **Storage**
   - Large files in storage buckets (not DB)
   - Text/small data in PostgreSQL
   - Proper indexing on tables

3. **API Routes**
   - Serverless uploads with Next.js
   - No server restart needed
   - Direct to Supabase storage

## Scalability

Current setup handles:
- Unlimited content pieces
- Unlimited images (10MB each)
- Thousands of bookings
- Real-time updates

To scale further:
- Add CDN for images (Cloudflare, AWS)
- Implement caching layer
- Add database read replicas
- Optimize queries

## Maintenance

### Regular Tasks:
- [ ] Check admin login working
- [ ] Verify images loading
- [ ] Test file uploads
- [ ] Backup content periodically

### Backup Strategy:
Use Supabase automatic backups or:
```bash
# Export database
pg_dump postgresql://... > backup.sql

# Export storage
# Download from Supabase UI
```

## Troubleshooting Checklist

| Issue | Solution |
|-------|----------|
| Content not updating | Check Supabase table, refresh page |
| Images not uploading | Verify bucket exists & is public |
| Prices not showing | Check rooms table created |
| Auth failing | Verify Supabase credentials |
| File too large | Compress/reduce file size |
| Slow uploads | Check internet connection |

## API Reference

### GET Dynamic Content
```javascript
const { data } = await supabase
  .from("content")
  .select("*")
  .eq("section", "hero")
  .eq("lang", "mn");
```

### UPDATE Room Price
```javascript
const { error } = await supabase
  .from("rooms")
  .upsert({ id: "luxury", adult2: 120000 });
```

### UPLOAD File
```javascript
const formData = new FormData();
formData.append("file", file);
const res = await fetch("/api/upload", {
  method: "POST",
  body: formData
});
```

### GET Current Settings
```javascript
const { data } = await supabase
  .from("settings")
  .select("*")
  .eq("id", "main")
  .single();
```

## Technologies Used

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Hosting**: Vercel (recommended)

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── content/page.tsx
│   │   ├── rooms-management/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── upload/route.ts
│   │   └── upload-image/route.ts
│   ├── booking/page.tsx
│   ├── rooms/page.tsx
│   └── about/page.tsx
├── lib/
│   ├── supabase.ts
│   ├── dynamic-data.ts
│   └── data.ts
└── components/
    ├── sections/
    └── layout/
```

---

**This dynamic system gives you complete control over your website content without touching code! 🚀**
