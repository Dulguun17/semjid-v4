# Сэмжид Хужирт — Semjid Khujirt Wellness Resort

Full-featured bilingual (Mongolian / English) resort website built with **Next.js 14**, TypeScript, and Tailwind CSS.

## ✅ Requirements Implemented

| # | Requirement | Status |
|---|---|---|
| 1 | Mongolian & English bilingual | ✅ Full MN/EN language switcher on every page |
| 2 | Brand: Semjid Khujirt | ✅ Name, logo, brand colors throughout |
| 3 | QPay booking + service prices | ✅ 3-step booking with QPay QR, bank transfer, cash |
| 4 | Introduction / origin page | ✅ Full /about page with history, mineral composition, location |
| 5 | Wellness intro section | ✅ About section on homepage + stats bar |
| 6 | Logo with transparent background | ✅ Auto-processed PNG with white background removed |

## 📄 Pages

| Route | Description |
|---|---|
| `/` | Home — Hero, Stats, About, Services, Rooms, Gallery, Testimonials |
| `/about` | Origin story, mineral properties, location guide |
| `/rooms` | All 4 rooms with amenities and booking |
| `/services` | All 6 treatments with prices |
| `/booking` | 3-step: Personal → Room+Services → Payment (QPay/Bank/Cash) |

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎨 Design

- **Colors**: Forest green (`#1a4d3a`) + Gold (`#c9a96e`) + Cream
- **Fonts**: Playfair Display (headings) + Noto Sans (body, Mongolian support)
- Real photos from original document used throughout

## 💳 QPay Integration

The booking page shows a QPay QR code placeholder. To connect real QPay:
1. Register at [qpay.mn](https://qpay.mn)
2. Get your merchant ID and API token
3. Replace the QR SVG in `BookingPageContent.tsx` with the QPay API call

## 🌐 Deploy to Vercel

```bash
# Push to GitHub, then connect to Vercel
npm run build  # test build first
```
