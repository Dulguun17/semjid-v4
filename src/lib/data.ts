export type Lang = "mn" | "en";

// ── Phone numbers ──────────────────────────────────────────────
export const PHONE1 = "8802-1191";
export const PHONE2 = "7202-1191";
export const PHONE_BUS1 = "9011-5757";
export const PHONE_BUS2 = "8802-2304";

// ── Currency formatter ─────────────────────────────────────────
export function formatMNT(n: number): string {
  return new Intl.NumberFormat("mn-MN").format(n) + "₮";
}

// ── All UI text ────────────────────────────────────────────────
export const t = {
  nav: {
    home:     { mn: "Нүүр",         en: "Home" },
    about:    { mn: "Бидний тухай", en: "About Us" },
    rooms:    { mn: "Байр, өрөө",   en: "Rooms" },
    services: { mn: "Эмчилгээ",     en: "Treatments" },
    booking:  { mn: "Захиалга",     en: "Book Now" },
  },
  hero: {
    badge: { mn: "Монголын анхны хувийн рашаан сувилал · 2003 оноос", en: "Mongolia's First Private Mineral Resort · Est. 2003" },
    tag1:  { mn: "Амралт",  en: "Rest"        },
    tag2:  { mn: "рашаан",  en: "Springs"     },
    tag3:  { mn: "сэргэлт", en: "Renewal"     },
    desc:  { mn: "«Хүжиртын хөх сувд» халуун рашаан, «Хүжиртын хар сувд» эмчилгээний шавраар байгалийн аргаар эрүүлж, сэргэн хүч авна уу.", en: "Restore yourself through the world-renowned «Blue Pearl» hot springs and «Black Pearl» therapeutic mud of Khujirt." },
    cta1:  { mn: "Захиалга өгөх",   en: "Book Your Stay"    },
    cta2:  { mn: "Эмчилгээ үзэх",   en: "View Treatments"   },
    phone: { mn: "Захиалгын утас",   en: "Booking hotline"   },
  },
  about: {
    badge:  { mn: "Бидний тухай", en: "About Us" },
    title:  { mn: "Сэмжид Хүжирт Рашаан Сувилал", en: "Semjid Khujirt Resort" },
    p1: { mn: "Сэмжид Хүжирт рашаан сувилал нь анх 2003 онд байгуулагдсан Монголын анхны хувийн сувиллуудын нэг юм.", en: "Founded in 2003 as one of Mongolia's first private mineral resorts." },
    p2: { mn: "Дэлхийн соёлын өвд бүртгэгдсэн Орхон голын сав газар, эртний Хархорин, Эрдэнэзуу хийд, Төвхөн хийд, Шанх хийд, Улаан цутгалан зэрэй байгалийн үзэсгэлэнт газруудтай ойролцоо байрладаг.", en: "Located near the UNESCO-listed Orkhon Valley, ancient Kharkhorin, Erdene Zuu monastery, and scenic natural landmarks." },
    p3: { mn: "«Хүжиртын хөх сувд» халуун рашаан, «Хүжиртын хар сувд» эмчилгээний шавраар голлон эмчилгээ хийхийн сацуу европ болон монгол уламжлалт эмчилгээнүүдийг хийдэг.", en: "Treatments centre on the «Blue Pearl» hot springs and «Black Pearl» mud, combined with European and Mongolian therapies." },
    p4: { mn: "Нарийн мэргэжлийн эмч болон үйлчилгээний 50 гаруй ажилтантай. Өвлийн улиралд 90, зуны улиралд 180 гаруй зочин нэгэн зэрэг хүлээн авах хүчин чадалтай.", en: "50+ specialist doctors and staff. Capacity: 90 winter / 180+ summer guests." },
    p5: { mn: "Улаанбаатараас 380 км. Хатуу хучилттай засмал замаар холбогдсон. Жилийн 4 улиралд нээлттэй.", en: "380 km from Ulaanbaatar via paved road. Open all four seasons." },
    s1n: "2003", s1l: { mn: "Үүссэн он",      en: "Founded"       },
    s2n: "50+",  s2l: { mn: "Мэргэжилтэн",    en: "Specialists"   },
    s3n: "180",  s3l: { mn: "Зочны багтаамж", en: "Guest Capacity" },
    s4n: "4×",   s4l: { mn: "Улирал нээлттэй",en: "Seasons Open"  },
    more: { mn: "Дэлгэрэнгүй уншах →", en: "Read Full Story →" },
  },
  conditions: {
    badge:  { mn: "Эмчилдэг өвчнүүд", en: "Conditions We Treat" },
    title:  { mn: "Хүжиртын рашаан, шавраар эмчилдэг өвчнүүд", en: "Conditions Treated with Khujirt Springs & Mud" },
    note:   { mn: "Тэр дундаа нуруу, үе мөчний өвчинд онцгой үр дүнтэй.", en: "Especially effective for spinal and joint conditions." },
  },
  services: {
    badge:   { mn: "Эмчилгээний төрлүүд", en: "Our Treatments"  },
    title:   { mn: "Эмчилгээ & Үйлчилгээ", en: "Treatments & Services" },
    viewAll: { mn: "Бүгдийг үзэх →",      en: "View All →"     },
    book:    { mn: "Захиалах",             en: "Book"           },
  },
  rooms: {
    badge:   { mn: "Байр, өрөөнүүд",       en: "Accommodation"  },
    title:   { mn: "Өрөө, байрны төрлүүд", en: "Room Types"     },
    sub:     { mn: "Өрөө бүр халуун хүйтэн ус, боловсон ОО-той. Олон сувгийн TV, интернет.", en: "Each room has hot & cold water, private bathroom, TV, and free Wi-Fi." },
    viewAll: { mn: "Бүгдийг үзэх →", en: "View All →"  },
    night:   { mn: "/ шөнө",         en: "/ night"     },
    guests:  { mn: "хүн",            en: "guests"      },
    book:    { mn: "Захиалах",       en: "Book Room"   },
    note:    { mn: "* Зуны байр VI–IX сард нээлттэй. Иргэний үнэмлэх шаардлагатай.", en: "* Summer cottages open June–September. National ID required." },
  },
  location: {
    badge:    { mn: "Байршил & Хүрэх зам", en: "Location & Directions" },
    title:    { mn: "Хэрхэн хүрэх вэ?",   en: "How to Get Here"       },
    sub:      { mn: "Улаанбаатар хоттой хатуу хучилттай засмал замаар холбогдсон. Жилийн 4 улиралд нээлттэй.", en: "Connected to Ulaanbaatar by paved road. Open year-round." },
    busTitle: { mn: "Тээврийн мэдээлэл",  en: "Transport Info"        },
    bus:      { mn: "Зорчигч тээврийн автобус УБ хотоос өдөр бүр 14:00 цагаас Драгон товоос явна. Хужирт сумаас өдөр бүр 10:00 цагаас УБ хот руу явна.", en: "Daily bus from Dragon Terminal (UB) at 14:00. Return from Khujirt at 10:00 daily." },
    ticket:   { mn: "Билет захиалга:",    en: "Bus tickets:"           },
    addr:     { mn: "Өвөрхангай аймаг, Хүжирт сум, Монгол улс", en: "Khujirt soum, Uvurkhangai aimag, Mongolia" },
  },
  booking: {
    badge:    { mn: "Онлайн захиалга",   en: "Online Booking"     },
    title:    { mn: "Захиалга өгөх",     en: "Make a Reservation" },
    sub:      { mn: "QPay, карт болон банкны шилжүүлгээр төлөх боломжтой.", en: "Pay via QPay, card, or bank transfer." },
    s1:       { mn: "Хувийн мэдээлэл",  en: "Personal Info"      },
    s2:       { mn: "Өрөө & Эмчилгээ",  en: "Room & Treatments"  },
    s3:       { mn: "Төлбөр",           en: "Payment"            },
    fname:    { mn: "Нэр",              en: "First Name"         },
    lname:    { mn: "Овог",             en: "Last Name"          },
    phone:    { mn: "Утасны дугаар",    en: "Phone Number"       },
    email:    { mn: "И-мэйл (заавал биш)", en: "Email (optional)"},
    checkin:  { mn: "Ирэх өдөр",        en: "Check-in"           },
    checkout: { mn: "Явах өдөр",        en: "Check-out"          },
    numGuests:{ mn: "Хүний тоо",        en: "Guests"             },
    addTreat: { mn: "Эмчилгээ нэмэх (заавал биш)", en: "Add Treatments (optional)" },
    notes:    { mn: "Тэмдэглэл, хүсэлт", en: "Notes & Requests" },
    total:    { mn: "Нийт дүн",          en: "Total"             },
    nights:   { mn: "шөнө",             en: "nights"             },
    payTitle: { mn: "Төлбөрийн арга",   en: "Payment Method"     },
    qpay:     { mn: "QPay",             en: "QPay"               },
    card:     { mn: "Карт",             en: "Card"               },
    bank:     { mn: "Банкны шилжүүлэг", en: "Bank Transfer"      },
    cash:     { mn: "Бэлэн мөнгө",      en: "Cash on Arrival"    },
    qNote:    { mn: "QPay QR кодыг уншуулан төлбөр хийнэ үү", en: "Scan the QPay QR code to pay" },
    bankCo:   { mn: "\"ТӨБАСЭ ХХК\" — Сэмжид Хужирт", en: "\"TOBAS LLC\" — Semjid Khujirt" },
    bankAcc:  { mn: "Данс: 4900 XXXX XXXX (Хаан Банк)", en: "Account: 4900 XXXX XXXX (Khan Bank)" },
    bankRef:  { mn: "Утга: Таны нэр + ирэх өдөр", en: "Ref: Your name + check-in date" },
    submit:   { mn: "Захиалга илгээх",  en: "Submit Booking"     },
    next:     { mn: "Үргэлжлүүлэх →",  en: "Continue →"         },
    back:     { mn: "← Буцах",          en: "← Back"             },
    success:  { mn: "Захиалга амжилттай хүлээн авлаа! Бид удахгүй холбоо барина.", en: "Booking received! We will contact you shortly." },
    summary:  { mn: "Захиалгын дэлгэрэнгүй", en: "Booking Summary" },
    noRoom:   { mn: "Өрөө сонгогдоогүй",     en: "No room selected" },
    childInfo:{ mn: "Хүүхдийн үнэ: 0–2 нас 43,000₮ · 3–7 нас 53,000₮ · 8–12 нас 68,000₮", en: "Child rates: 0–2 yrs 43,000₮ · 3–7 yrs 53,000₮ · 8–12 yrs 68,000₮" },
  },
  footer: {
    tagline: { mn: "Монголын анхны хувийн рашаан сувилал. Орхон голын хөндий, Хүжирт сум.", en: "Mongolia's first private mineral resort. Orkhon Valley, Khujirt soum." },
    addr:    { mn: "Өвөрхангай аймаг, Хүжирт сум", en: "Khujirt soum, Uvurkhangai aimag" },
    nav:     { mn: "Цэс",          en: "Navigation" },
    contact: { mn: "Холбоо барих", en: "Contact Us"  },
    rights:  { mn: "Бүх эрх хамгаалагдсан.", en: "All rights reserved." },
  },
};

// ── Services ───────────────────────────────────────────────────
export interface ServiceItem {
  id: string; img: string;
  cat:      { mn: string; en: string };
  name:     { mn: string; en: string };
  desc:     { mn: string; en: string };
  duration: string;
  price:    number;
  badge?:   { mn: string; en: string };
}

export const services: ServiceItem[] = [
  { id:"rashaan", img:"/images/image1.jpg",
    cat:{ mn:"Халуун рашаан", en:"Hot Spring" },
    name:{ mn:"«Хөх Сувд» Халуун Рашааны Эмчилгээ", en:"«Blue Pearl» Hot Spring Therapy" },
    desc:{ mn:"Дэлхийд нэртэй «Хүжиртын хөх сувд» халуун рашааны эмчилгээ. Цусны эргэлтийг сайжруулж, мэдрэлийг тайвшруулна.", en:"World-renowned hot spring therapy. Improves circulation and calms the nervous system." },
    duration:"60 мин / 60 min", price:35000,
    badge:{ mn:"Шилдэг", en:"Signature" } },
  { id:"shavar", img:"/images/image8.jpg",
    cat:{ mn:"Эмчилгээний шавар", en:"Therapeutic Mud" },
    name:{ mn:"«Хар Сувд» Шаварын Эмчилгээ", en:"«Black Pearl» Mud Therapy" },
    desc:{ mn:"«Хүжиртын хар сувд» — үе мөчний өвчин, нуруу нугасны гэмтэл, арьсны өвчинд онцгой үр дүнтэй.", en:"Highly effective for joints, spine, and skin conditions." },
    duration:"45 мин / 45 min", price:40000,
    badge:{ mn:"Алдартай", en:"Popular" } },
  { id:"baria", img:"/images/image2.jpg",
    cat:{ mn:"Уламжлалт эмчилгээ", en:"Traditional Therapy" },
    name:{ mn:"Монгол Бариа Засал", en:"Mongolian Traditional Massage" },
    desc:{ mn:"Монгол уламжлалт бариа засал — булчин ясны тогтолцоог засаж, ядаргааг арилгана.", en:"Traditional Mongolian massage — corrects alignment and relieves fatigue." },
    duration:"90 мин / 90 min", price:45000 },
  { id:"pizik", img:"/images/image10.jpg",
    cat:{ mn:"Физик эмчилгээ", en:"Physiotherapy" },
    name:{ mn:"Физик Эмчилгээ & Реабилитаци", en:"Physiotherapy & Rehabilitation" },
    desc:{ mn:"Мэргэшсэн эмч нарын удирдлаган дор тусгайлсан реабилитаци.", en:"Specialist-supervised rehabilitation and physiotherapy." },
    duration:"60 мин / 60 min", price:50000,
    badge:{ mn:"Мэргэжилтэн", en:"Specialist" } },
  { id:"europe", img:"/images/image7.jpg",
    cat:{ mn:"Европ эмчилгээ", en:"European Therapy" },
    name:{ mn:"Европ Уламжлалт Эмчилгээ", en:"European Traditional Therapy" },
    desc:{ mn:"Европын уламжлалт эмчилгээний аргуудыг монгол рашааны эмчилгээтэй хослуулан хийдэг.", en:"European therapy combined with Mongolian mineral spring treatment." },
    duration:"75 мин / 75 min", price:55000 },
  { id:"course7", img:"/images/image9.jpg",
    cat:{ mn:"Иж бүрдэл курс", en:"Full Course" },
    name:{ mn:"7 Хоногийн Эмчилгээний Курс", en:"7-Day Treatment Course" },
    desc:{ mn:"Рашаан, шавар, бариа засал, физик эмчилгээг хослуулсан 7 хоногийн иж бүрдэл курс.", en:"7-day combined course: hot spring, mud, massage, physiotherapy." },
    duration:"7 өдөр / 7 days", price:420000,
    badge:{ mn:"Хамгийн сайн", en:"Best Value" } },
];

// ── Rooms ──────────────────────────────────────────────────────
export interface RoomItem {
  id: string; img: string;
  type:      { mn: string; en: string };
  name:      { mn: string; en: string };
  desc:      { mn: string; en: string };
  capacity:  number;
  adult1:    number | null;
  adult2:    number | null;
  child02:   number | null;
  child37a:  number | null;
  child37b:  number | null;
  child812a: number | null;
  child812b: number | null;
  amenities: { mn: string; en: string }[];
}

export const rooms: RoomItem[] = [
  { id:"luxury", img:"/images/image3.jpeg",
    type:{ mn:"Люкс өрөө", en:"Luxury Room" },
    name:{ mn:"Люкс өрөө", en:"Luxury Room" },
    desc:{ mn:"Орчин үеийн тав тухтай люкс өрөө.", en:"Modern luxury room with premium amenities." },
    capacity:2, adult1:null, adult2:113000, child02:43000,
    child37a:null, child37b:null, child812a:null, child812b:68000,
    amenities:[{mn:"Хувийн угаалгын өрөө",en:"Private bathroom"},{mn:"Халуун, хүйтэн ус",en:"Hot & cold water"},{mn:"Олон сувгийн TV",en:"Multi-channel TV"},{mn:"Үнэгүй Wi-Fi",en:"Free Wi-Fi"}] },
  { id:"halflux", img:"/images/image4.jpeg",
    type:{ mn:"Хагас Люкс", en:"Half-Luxury" },
    name:{ mn:"Хагас Люкс өрөө", en:"Half-Luxury Room" },
    desc:{ mn:"Люкс өрөөний бүх тохижилттой, илүү хүртээмжтэй үнэтэй.", en:"All luxury amenities at a more accessible price." },
    capacity:2, adult1:null, adult2:93000, child02:43000,
    child37a:null, child37b:null, child812a:null, child812b:68000,
    amenities:[{mn:"Хувийн угаалгын өрөө",en:"Private bathroom"},{mn:"Халуун, хүйтэн ус",en:"Hot & cold water"},{mn:"Олон сувгийн TV",en:"Multi-channel TV"},{mn:"Үнэгүй Wi-Fi",en:"Free Wi-Fi"}] },
  { id:"std2", img:"/images/image5.jpeg",
    type:{ mn:"Стандарт өрөө", en:"Standard Room" },
    name:{ mn:"2 Ортой Стандарт өрөө", en:"2-Bed Standard Room" },
    desc:{ mn:"Хосуудад тохиромжтой стандарт 2 ортой өрөө.", en:"Comfortable 2-bed room for couples." },
    capacity:2, adult1:88000, adult2:null, child02:43000,
    child37a:53000, child37b:null, child812a:68000, child812b:null,
    amenities:[{mn:"Хувийн угаалгын өрөө",en:"Private bathroom"},{mn:"Халуун, хүйтэн ус",en:"Hot & cold water"},{mn:"Олон сувгийн TV",en:"Multi-channel TV"},{mn:"Үнэгүй Wi-Fi",en:"Free Wi-Fi"}] },
  { id:"std4", img:"/images/image6.jpeg",
    type:{ mn:"Стандарт өрөө", en:"Standard Room" },
    name:{ mn:"4 Ортой Стандарт өрөө", en:"4-Bed Standard Room" },
    desc:{ mn:"Гэр бүл болон жижиг бүлгийн аялагчдад 4 ортой өрөө.", en:"4-bed room for families and small groups." },
    capacity:4, adult1:83000, adult2:88000, child02:43000,
    child37a:53000, child37b:53000, child812a:68000, child812b:68000,
    amenities:[{mn:"Хувийн угаалгын өрөө",en:"Private bathroom"},{mn:"Халуун, хүйтэн ус",en:"Hot & cold water"},{mn:"Олон сувгийн TV",en:"Multi-channel TV"},{mn:"Үнэгүй Wi-Fi",en:"Free Wi-Fi"}] },
  { id:"std5", img:"/images/image3.jpeg",
    type:{ mn:"Стандарт өрөө", en:"Standard Room" },
    name:{ mn:"5 Ортой Стандарт өрөө", en:"5-Bed Standard Room" },
    desc:{ mn:"Том гэр бүл, бүлгийн аялагчдад тохиромжтой.", en:"Spacious room for large families and groups." },
    capacity:5, adult1:83000, adult2:null, child02:43000,
    child37a:53000, child37b:null, child812a:68000, child812b:null,
    amenities:[{mn:"Хувийн угаалгын өрөө",en:"Private bathroom"},{mn:"Халуун, хүйтэн ус",en:"Hot & cold water"},{mn:"Олон сувгийн TV",en:"Multi-channel TV"},{mn:"Үнэгүй Wi-Fi",en:"Free Wi-Fi"}] },
  { id:"summer", img:"/images/resort-nature.jpg",
    type:{ mn:"Зуны байр", en:"Summer Cottage" },
    name:{ mn:"Зуны байр", en:"Summer Cottage" },
    desc:{ mn:"Зуны улиралд (VI–IX сар) нээлттэй. Байгалийн орчинд тайван амрах боломж.", en:"Open June–September. Peaceful natural surroundings." },
    capacity:3, adult1:78000, adult2:null, child02:43000,
    child37a:53000, child37b:null, child812a:68000, child812b:null,
    amenities:[{mn:"Зуны улиралд нээлттэй",en:"Open June–September"},{mn:"Байгалийн орчин",en:"Natural surroundings"}] },
];

// ── Conditions ─────────────────────────────────────────────────
export const conditions: { mn: string; en: string }[] = [
  { mn:"Үе мөчний өвчин",                                  en:"Joint Disease" },
  { mn:"Түнхний мултрал & дутуу хөгжил",                   en:"Hip Dislocation & Dysplasia" },
  { mn:"Нуруу нугасны гэмтэл & дараах үлдэц",              en:"Spinal Injury & Residuals" },
  { mn:"Ясны бэртэл & удаашралт",                          en:"Bone Fractures & Slow Healing" },
  { mn:"Тулгуур хөдөлгөөний эрхтний өвчнүүд",              en:"Musculoskeletal Disorders" },
  { mn:"Нуруу нугасны саа, саажилт",                       en:"Spinal Paralysis & Paresis" },
  { mn:"Нойргүйдэл & архаг ядрах",                         en:"Insomnia & Chronic Fatigue" },
  { mn:"Шээс задгайрах & цистит",                          en:"Urinary Incontinence & Cystitis" },
  { mn:"Мэдрэлийн системийн өвчнүүд",                      en:"Neurological Conditions" },
  { mn:"Хагалгааны дараах наалдац",                        en:"Post-surgical Adhesions" },
  { mn:"Эмэгтэйчүүдийн үргүйдэл",                         en:"Female Infertility" },
  { mn:"Түрүү булчирхайн архаг үрэвсэл",                   en:"Chronic Prostatitis" },
  { mn:"Намарс & хайрст үлд",                              en:"Eczema & Psoriasis" },
  { mn:"Харшлын болон мэдрэлийн гаралтай арьсны өвчнүүд",  en:"Allergic & Neurogenic Skin Conditions" },
];

// ── Distances ──────────────────────────────────────────────────
export const distances = [
  { from:{ mn:"Улаанбаатараас", en:"From Ulaanbaatar" }, km:"380 км", time:{ mn:"5–6 цаг",   en:"5–6 hrs"   } },
  { from:{ mn:"Арвайхээрээс",   en:"From Arvaikheer"  }, km:"90 км",  time:{ mn:"~1.5 цаг", en:"~1.5 hrs"  } },
  { from:{ mn:"Хархориноос",    en:"From Kharkhorin"  }, km:"54 км",  time:{ mn:"~1 цаг",   en:"~1 hr"     } },
];
