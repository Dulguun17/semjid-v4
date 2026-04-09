"use client";
import Image from "next/image";
import { useLang } from "@/lib/lang-context";
import { t, services } from "@/lib/data";

export default function ServicesPage() {
  const { lang } = useLang();

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-teal py-14 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase text-teal-light mb-2">{t.services.badge[lang]}</p>
          <h1 className="font-serif text-[clamp(28px,4vw,52px)] text-white">{t.services.title[lang]}</h1>
          <p className="text-[14px] text-white/55 mt-2 max-w-2xl">
            {lang === "mn"
              ? "Дэлхийд нэртэй рашаан, шавар, уламжлалт эмчилгээгээр эрүүлжин урт насалъя."
              : "Restore your health with world-renowned mineral springs, therapeutic mud, and traditional therapies."
            }
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        {/* Information Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12 max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl text-slate-800 mb-4">
            {lang === "mn" ? "Эмчилгээний үйл явц" : "Treatment Process"}
          </h2>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            {lang === "mn"
              ? "Өрөө захиалахад бүх эмчилгээний төрлүүд багтсан байдаг. Зочдын биеийн байдал, өвчний түүхийг үндэслэн манай мэргэжилтэн эмч нар шинжилгээ хийж, тохирсон эмчилгээг сонгон хийдэг."
              : "All treatments are included when booking a room. Based on the guest's physical condition and medical history, our specialist doctors conduct examinations and provide suitable treatments."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
              {/* Image */}
              <div className="relative h-48 flex-shrink-0">
                <Image
                  src={service.img}
                  alt={service.name[lang]}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                {service.badge && (
                  <div className="absolute top-4 left-4 bg-teal/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
                    {service.badge[lang]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-[11px] text-slate-400 uppercase tracking-[0.15em] mb-2">
                  {service.cat[lang]}
                </div>

                <h3 className="font-serif text-xl text-slate-800 mb-3">
                  {service.name[lang]}
                </h3>

                <p className="text-[14px] text-slate-500 leading-relaxed flex-1">
                  {service.desc[lang]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}