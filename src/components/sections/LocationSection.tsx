"use client";
import { MapPin, Bus, Phone, Clock, Navigation } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { t, distances, PHONE_BUS1, PHONE_BUS2 } from "@/lib/data";

export function LocationSection() {
  const { lang } = useLang();

  const lat = 46.9022;
  const lng = 102.7780;
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=13&output=embed&hl=${lang === "mn" ? "mn" : "en"}`;

  return (
    <section id="location" className="bg-slate-50 py-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <span className="text-[11px] tracking-[0.2em] uppercase text-teal block mb-2">
            {t.location.badge[lang]}
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="font-serif text-[clamp(26px,3vw,42px)] text-slate-800 leading-tight">
              {t.location.title[lang]}
            </h2>
            <a
              href={`https://maps.google.com/?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-medium text-teal border border-teal/30 hover:bg-teal hover:text-white px-4 py-2 rounded-lg transition-all no-underline shrink-0"
            >
              <Navigation size={13} />
              {lang === "mn" ? "Google Maps-д нээх" : "Open in Google Maps"}
            </a>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left info panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Address */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} className="text-teal" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 tracking-widest uppercase mb-1">
                    {lang === "mn" ? "Хаяг" : "Address"}
                  </p>
                  <p className="text-[14px] text-slate-700 font-medium leading-snug">
                    {t.location.addr[lang]}
                  </p>
                </div>
              </div>
            </div>

            {/* Distances */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-[11px] text-slate-400 tracking-widest uppercase mb-4">
                {lang === "mn" ? "Зай & хугацаа" : "Distance & Travel Time"}
              </p>
              <div className="space-y-0">
                {distances.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                      <span className="text-[13px] text-slate-600">{d.from[lang]}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold text-slate-800">{d.km}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 justify-end">
                        <Clock size={10} />{d.time[lang]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bus info */}
            <div className="bg-teal rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Bus size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[12px] text-white/60 uppercase tracking-wider mb-1">{t.location.busTitle[lang]}</p>
                  <p className="text-[13px] text-white/85 leading-relaxed">{t.location.bus[lang]}</p>
                </div>
              </div>
              <div className="border-t border-white/15 pt-4">
                <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">{t.location.ticket[lang]}</p>
                <div className="flex flex-col gap-1.5">
                  <a href={`tel:${PHONE_BUS1.replace(/-/g,"")}`} className="flex items-center gap-2 text-[13px] text-white no-underline hover:text-white/80 transition-colors">
                    <Phone size={12} className="text-teal-light" /> {PHONE_BUS1}
                  </a>
                  <a href={`tel:${PHONE_BUS2.replace(/-/g,"")}`} className="flex items-center gap-2 text-[13px] text-white no-underline hover:text-white/80 transition-colors">
                    <Phone size={12} className="text-teal-light" /> {PHONE_BUS2}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Google Map */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{height:"460px"}}>
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{border:0}}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={lang === "mn" ? "Сэмжид Хужирт байршил" : "Semjid Khujirt Location"}
              />
            </div>

            {/* Coordinates + directions */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <MapPin size={13} className="text-teal" />
                <span className="font-mono text-slate-600">{lat}°N, {lng}°E</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-teal hover:text-teal-dark no-underline font-medium transition-colors flex items-center gap-1"
              >
                <Navigation size={12} />
                {lang === "mn" ? "Чиглэл авах" : "Get Directions"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
