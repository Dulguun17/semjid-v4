"use client";
import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";

const photos = [
  { src: "/images/resort-building.jpg", l: { mn: "Сувилалын байр",      en: "Resort Building"    } },
  { src: "/images/therapy-mud.jpg",     l: { mn: "Шавар эмчилгээ",      en: "Mud Therapy"        } },
  { src: "/images/resort-main.jpg",     l: { mn: "Амралт, рашаан",      en: "Rest & Springs"     } },
  { src: "/images/resort-nature.jpg",   l: { mn: "Байгалийн орчин",     en: "Natural Setting"    } },
  { src: "/images/image8.jpg",          l: { mn: "Эмчилгээ",            en: "Treatment"          } },
  { src: "/images/image10.jpg",         l: { mn: "Физик эмчилгээ",      en: "Physiotherapy"      } },
  { src: "/images/image1.jpg",          l: { mn: "Халуун рашаан",       en: "Hot Spring"         } },
  { src: "/images/resort-sign.jpeg",    l: { mn: "Сувилалын тэмдэг",   en: "Resort Sign"        } },
  { src: "/images/landscape.jpeg",      l: { mn: "Хүжиртийн байгаль",  en: "Khujirt Landscape"  } },
];

export function GallerySection() {
  const { lang } = useLang();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => setLightbox((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length));
  const next = () => setLightbox((i) => (i === null ? 0 : (i + 1) % photos.length));

  return (
    <section className="bg-white py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-teal block mb-1">
              {lang === "mn" ? "Зургийн цомог" : "Gallery"}
            </span>
            <h2 className="font-serif text-[clamp(22px,2.5vw,36px)] text-slate-800">
              {lang === "mn" ? "Сэмжид Хүжирт" : "Semjid Khujirt"}
            </h2>
          </div>
          <span className="text-[12px] text-slate-400">
            {lang === "mn" ? "Зураг дарж томруулан харна уу" : "Click to enlarge"}
          </span>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden group cursor-pointer ${
                i === 2 ? "md:row-span-2" : ""
              }`}
              style={{ height: i === 2 ? "412px" : "200px" }}
              onClick={() => setLightbox(i)}
            >
              <Image
                src={p.src}
                alt={p.l[lang]}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  <span className="text-white text-lg leading-none">+</span>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] tracking-wider text-white uppercase">{p.l[lang]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight size={22} />
          </button>
          <div className="relative max-w-5xl w-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ paddingBottom: "62%" }}>
              <Image
                src={photos[lightbox].src}
                alt={photos[lightbox].l[lang]}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-center text-white/50 text-sm mt-3 tracking-wider">
              {photos[lightbox].l[lang]} · {lightbox + 1}/{photos.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
