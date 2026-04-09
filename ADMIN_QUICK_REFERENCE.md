# 📍 Admin Panel Quick Reference

## Login & Access

| URL | Purpose |
|-----|---------|
| `/admin/login` | Admin login page |
| `/admin` | Main dashboard |

## Management Pages

| URL | What You Can Do | Icon |
|-----|-----------------|------|
| `/admin/content` | Edit all website content (text, descriptions, images) | 📄 |
| `/admin/rooms-management` | Update room prices and images | 🛏️ |
| `/admin/settings` | Upload referral letter PDF | ⚙️ |
| `/admin/chat` | Chat with visitors | 💬 |
| `/admin/calendar` | View booking calendar | 📅 |
| `/admin/guests` | Manage guest list | 👥 |
| `/admin/analytics` | View statistics | 📊 |

## Content Sections (in `/admin/content`)

| Section | What to Edit |
|---------|-------------|
| **hero** | Homepage banner - title, description, images |
| **about** | About page - company info, stats, images |
| **rooms** | Room descriptions and features |
| **conditions** | Medical conditions treated |
| **services** | Treatment service descriptions |
| **footer** | Footer text and links |
| **gallery** | Gallery images and captions |
| **images** | General website images and logos |

## File Upload Locations

| File Type | Where | Location |
|-----------|-------|----------|
| Referral Letter | Admin Settings | `/admin/settings` |
| Room Images | Rooms Management | `/admin/rooms-management` |
| Content Images | Content Editor | `/admin/content` |

## Common Tasks

### Update Room Prices
1. Go to `/admin/rooms-management`
2. Click Edit on room
3. Change prices
4. Click Save ✓

### Upload Referral Letter
1. Go to `/admin/settings`
2. Drag PDF or click to browse
3. Wait for upload ✓

### Update Homepage Text
1. Go to `/admin/content`
2. Select "hero" section
3. Choose language (MН or EN)
4. Edit fields
5. Click Save ✓

### Change Room Images
1. Go to `/admin/rooms-management`
2. Click Edit on room
3. Click "Upload Image"
4. Select image
5. Click Save ✓

### Edit Multiple Languages
1. Go to `/admin/content`
2. Edit Mongolian (MН) version
3. Click language toggle → EN
4. Edit English version
5. Save both ✓

## Tips & Tricks

✅ **Always save changes** - Click Хадгалах (Save) or your edits will be lost
✅ **Test after editing** - Visit public pages to verify changes
✅ **Use consistent images** - Same dimensions for gallery images
✅ **Proofread text** - Check spelling before saving
✅ **Keep files small** - Compress images before upload for faster loading
✅ **Mobile test** - Always test how it looks on phones

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | (varies by field) Click Save button |
| Upload | Click upload area then select file |
| Cancel | Click Cancel button |
| Refresh | F5 or Ctrl+R |
| Hard refresh | Ctrl+Shift+R (to see latest images) |

## Contact / Troubleshooting

### Issue: Content won't update
→ Hard refresh browser (Ctrl+Shift+R)

### Issue: Images won't upload
→ Check file size < 10MB and format is JPG/PNG

### Issue: Can't login
→ Check email/password and internet connection

### Issue: Rooms table not found
→ Run SQL migration: `supabase/create_rooms_table.sql`

## What Appears Where

| What You Edit | Shows Up Here |
|---------------|--------------|
| Hero content | Homepage top banner |
| Room prices | /rooms page |
| Room images | /rooms and /booking pages |
| About text | /about page |
| Referral letter | /booking download link |
| Services | /services page |
| Footer | Bottom of all pages |

## Need Help?

📚 Full setup guide: `ADMIN_SETUP_GUIDE.md`
🏗️ Technical details: `DYNAMIC_ARCHITECTURE.md`
📱 Admin layout code: `src/app/admin/layout.tsx`

---

**Your admin panel is ready! Start by uploading a referral letter in `/admin/settings` 🎉**
