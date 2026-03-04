"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLang } from "@/lib/lang-context";

const testimonials = [
  {
    name: "Дорж Б.",
    loc: { mn: "Улаанбаатар", en: "Ulaanbaatar" },
    text: { mn: "Нуруу, үе мөчний өвдөлттэй байсан би Сэмжид Хужиртад 14 хоног рашаан, шавар эмчилгээ хийлгэсний дараа маш их сайжирсан. 10 жилийн өмнөөс л ирж байна.", en: "I had severe joint and back pain. After 14 days of spring and mud therapy at Semjid Khujirt, I improved enormously. I've been coming for 10 years." },
    prog: { mn: "Рашаан & Шавар Эмчилгээ", en: "Spring & Mud Therapy" },
  },
  {
    name: "Нармаа Г.",
    loc: { mn: "Эрдэнэт", en: "Erdenet" },
    text: { mn: "Арьсны өвчин намаас удаан зовж байлаа. Шавар эмчилгээний курс дууссаны дараа арьсны байдал гайхалтай сайжирсан. \"Хүжиртын хар сувд\" гэдэг нь үнэн.", en: "I suffered from skin disease for years. After the mud therapy course, my skin improved dramatically. The \"Black Pearl of Khujirt\" is no myth." },
    prog: { mn: "Шавар Эмчилгээ", en: "Mud Therapy" },
  },
  {
    name: "Болормаа С.",
    loc: { mn: "Дархан", en: "Darkhan" },
    text: { mn: "Физик эмчилгээний мэргэжилтнүүд маш ур чадвартай, тусламж болоосон. Хагалгааны дараах нөхөн сэргэлт хийлгэхэд маш тохиромжтой газар байлаа.", en: "The physiotherapy specialists are highly skilled. An ideal place for post-surgical rehabilitation. The peaceful natural setting accelerates recovery." },
    prog: { mn: "Физик Эмчилгээ", en: "Physiotherapy" },
  },
];

export function TestimonialsSection() {
  const { lang } = useLang();
  const [idx, setIdx] = useState(0);
  const tc = testimonials[idx];
  const prev = ()=>setIdx(i=>(i===0?testimonials.length-1:i-1));
  const next = ()=>setIdx(i=>(i===testimonials.length-1?0:i+1));

  return (
    <section className="bg-primary py-20 px-6 lg:px-14 ornament-bg" style={{backgroundBlendMode:'multiply'}}>
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-center mb-10">
          <h2 className="font-display text-[clamp(22px,3vw,38px)] font-semibold text-white uppercase tracking-wide mb-2">
            {lang==="mn"?"Зочдын Сэтгэгдэл":"Guest Reviews"}
          </h2>
          <div className="w-12 h-0.5 bg-gold mx-auto" />
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-10">
          <div className="flex justify-center gap-1 mb-5">
            {[...Array(5)].map((_,i)=><Star key={i} size={14} className="fill-gold text-gold"/>)}
          </div>
          <p className="font-display text-[clamp(15px,2vw,20px)] italic text-white/90 leading-relaxed mb-6">
            "{tc.text[lang]}"
          </p>
          <div className="font-body font-medium text-sm text-white">{tc.name}</div>
          <div className="font-body text-[10px] tracking-widest uppercase text-white/50 mt-1">{tc.loc[lang]} · {tc.prog[lang]}</div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <button onClick={prev} className="w-9 h-9 border border-white/20 hover:border-gold flex items-center justify-center text-white/60 hover:text-gold transition-colors cursor-none">
            <ChevronLeft size={14}/>
          </button>
          <div className="flex gap-2">
            {testimonials.map((_,i)=>(
              <button key={i} onClick={()=>setIdx(i)}
                className={`cursor-none transition-all duration-300 ${i===idx?"w-8 h-2 bg-gold":"w-2 h-2 rounded-full bg-white/30 hover:bg-white/60"}`}/>
            ))}
          </div>
          <button onClick={next} className="w-9 h-9 border border-white/20 hover:border-gold flex items-center justify-center text-white/60 hover:text-gold transition-colors cursor-none">
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </section>
  );
}
