"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Save, Upload, Loader2, FileText, Image as ImageIcon,
  Globe, Edit3, Check, X,
} from "lucide-react";

type ContentItem = {
  id: string;
  section: string;
  key: string;
  lang: 'mn' | 'en';
  value: string;
  image_url: string;
};

type SectionConfig = {
  name: string;
  fields: {
    key: string;
    label: { mn: string; en: string };
    type: 'text' | 'textarea' | 'image' | 'file';
    multiline?: boolean;
  }[];
};

const sectionConfigs: SectionConfig[] = [
  {
    name: 'hero',
    fields: [
      { key: 'badge', label: { mn: 'Байршуулалт', en: 'Badge' }, type: 'text' },
      { key: 'tag1', label: { mn: 'Шошго 1', en: 'Tag 1' }, type: 'text' },
      { key: 'tag2', label: { mn: 'Шошго 2', en: 'Tag 2' }, type: 'text' },
      { key: 'tag3', label: { mn: 'Шошго 3', en: 'Tag 3' }, type: 'text' },
      { key: 'desc', label: { mn: 'Тайлбар', en: 'Description' }, type: 'textarea', multiline: true },
      { key: 'cta1', label: { mn: 'Үйлдэл 1', en: 'CTA 1' }, type: 'text' },
      { key: 'cta2', label: { mn: 'Үйлдэл 2', en: 'CTA 2' }, type: 'text' },
      { key: 'phone', label: { mn: 'Утасны тайлбар', en: 'Phone Label' }, type: 'text' },
      { key: 'background', label: { mn: 'Арын зураг', en: 'Background Image' }, type: 'image' },
    ]
  },
  {
    name: 'about',
    fields: [
      { key: 'badge', label: { mn: 'Байршуулалт', en: 'Badge' }, type: 'text' },
      { key: 'title', label: { mn: 'Гарчиг', en: 'Title' }, type: 'text' },
      { key: 'p1', label: { mn: 'Дэд хэсэг 1', en: 'Paragraph 1' }, type: 'textarea', multiline: true },
      { key: 'p2', label: { mn: 'Дэд хэсэг 2', en: 'Paragraph 2' }, type: 'textarea', multiline: true },
      { key: 'p3', label: { mn: 'Дэд хэсэг 3', en: 'Paragraph 3' }, type: 'textarea', multiline: true },
      { key: 'p4', label: { mn: 'Дэд хэсэг 4', en: 'Paragraph 4' }, type: 'textarea', multiline: true },
      { key: 'p5', label: { mn: 'Дэд хэсэг 5', en: 'Paragraph 5' }, type: 'textarea', multiline: true },
      { key: 'more', label: { mn: 'Дэлгэрэнгүй', en: 'Read More' }, type: 'text' },
      { key: 's1n', label: { mn: 'Статистик 1 тоо', en: 'Stat 1 Number' }, type: 'text' },
      { key: 's1l', label: { mn: 'Статистик 1 тайлбар', en: 'Stat 1 Label' }, type: 'text' },
      { key: 's2n', label: { mn: 'Статистик 2 тоо', en: 'Stat 2 Number' }, type: 'text' },
      { key: 's2l', label: { mn: 'Статистик 2 тайлбар', en: 'Stat 2 Label' }, type: 'text' },
      { key: 's3n', label: { mn: 'Статистик 3 тоо', en: 'Stat 3 Number' }, type: 'text' },
      { key: 's3l', label: { mn: 'Статистик 3 тайлбар', en: 'Stat 3 Label' }, type: 'text' },
      { key: 's4n', label: { mn: 'Статистик 4 тоо', en: 'Stat 4 Number' }, type: 'text' },
      { key: 's4l', label: { mn: 'Статистик 4 тайлбар', en: 'Stat 4 Label' }, type: 'text' },
    ]
  },
  {
    name: 'conditions',
    fields: [
      { key: 'badge', label: { mn: 'Байршуулалт', en: 'Badge' }, type: 'text' },
      { key: 'title', label: { mn: 'Гарчиг', en: 'Title' }, type: 'text' },
      { key: 'note', label: { mn: 'Тэмдэглэл', en: 'Note' }, type: 'textarea', multiline: true },
    ]
  },
  {
    name: 'footer',
    fields: [
      { key: 'tagline', label: { mn: 'Слоган', en: 'Tagline' }, type: 'text' },
      { key: 'addr', label: { mn: 'Хаяг', en: 'Address' }, type: 'text' },
      { key: 'nav', label: { mn: 'Цэс', en: 'Navigation' }, type: 'text' },
      { key: 'contact', label: { mn: 'Холбоо барих', en: 'Contact' }, type: 'text' },
      { key: 'rights', label: { mn: 'Эрх хамгаалалт', en: 'Rights' }, type: 'text' },
    ]
  },
  {
    name: 'images',
    fields: [
      { key: 'hero_main', label: { mn: 'Нүүр хуудасны зураг', en: 'Hero Main Image' }, type: 'image' },
      { key: 'logo', label: { mn: 'Лого', en: 'Logo' }, type: 'image' },
      { key: 'about_image', label: { mn: 'Бидний тухай зураг', en: 'About Image' }, type: 'image' },
      { key: 'resort_main', label: { mn: 'Сувилалын үндсэн зураг', en: 'Resort Main Image' }, type: 'image' },
      { key: 'resort_nature', label: { mn: 'Байгалийн зураг', en: 'Nature Image' }, type: 'image' },
      { key: 'referral_letter', label: { mn: 'Илгээх бичиг', en: 'Referral Letter' }, type: 'file' },
    ]
  }
];

export default function ContentManagement() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [activeLang, setActiveLang] = useState<'mn' | 'en'>('mn');

  // Load content
  const loadContent = useCallback(async () => {
    try {
      const { data } = await supabase.from('content').select('*').order('section, key');
      setContent(data || []);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  // Get content value
  const getContent = (section: string, key: string, lang: 'mn' | 'en') => {
    const item = content.find(c => c.section === section && c.key === key && c.lang === lang);
    return item?.value || item?.image_url || '';
  };

  // Save content
  const saveContent = async (section: string, key: string, lang: 'mn' | 'en', value: string, isImage = false) => {
    setSaving(`${section}-${key}-${lang}`);
    try {
      const id = `${section}-${key}-${lang}`;
      const data = isImage
        ? { image_url: value }
        : { value };

      const { error } = await supabase.from('content').upsert({
        id,
        section,
        key,
        lang,
        ...data,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setContent(prev => {
        const existing = prev.findIndex(c => c.section === section && c.key === key && c.lang === lang);
        const newItem: ContentItem = {
          id,
          section,
          key,
          lang,
          value: isImage ? '' : value,
          image_url: isImage ? value : '',
        };

        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newItem;
          return updated;
        } else {
          return [...prev, newItem];
        }
      });
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setSaving(null);
    }
  };

  // Upload image
  const uploadImage = async (section: string, key: string, lang: 'mn' | 'en', file: File) => {
    setUploading(`${section}-${key}-${lang}`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await saveContent(section, key, lang, data.url, true);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal"/>
      </div>
    );
  }

  const currentConfig = sectionConfigs.find(s => s.name === activeSection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Контент удирдах</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveLang('mn')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeLang === 'mn' ? 'bg-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Монгол
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeLang === 'en' ? 'bg-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {sectionConfigs.map(section => (
          <button
            key={section.name}
            onClick={() => setActiveSection(section.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.name ? 'bg-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
          </button>
        ))}
      </div>

      {currentConfig && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 capitalize">{currentConfig.name} Section</h2>
            <p className="text-[12px] text-slate-400 mt-1">Edit content for {activeLang === 'mn' ? 'Mongolian' : 'English'} version</p>
          </div>

          <div className="divide-y divide-slate-50">
            {currentConfig.fields.map(field => {
              const value = getContent(currentConfig.name, field.key, activeLang);
              const isSaving = saving === `${currentConfig.name}-${field.key}-${activeLang}`;
              const isUploading = uploading === `${currentConfig.name}-${field.key}-${activeLang}`;

              return (
                <div key={field.key} className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {field.label[activeLang]}
                      </label>

                      {field.type === 'image' || field.type === 'file' ? (
                        <div className="space-y-3">
                          {value && field.type === 'image' ? (
                            <div className="w-32 h-24 rounded-lg overflow-hidden bg-slate-100 relative">
                              <img src={value} alt="" className="w-full h-full object-cover"/>
                            </div>
                          ) : value ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
                            >
                              <FileText size={16} />
                              {activeLang === 'mn' ? 'Файл татах' : 'Download file'}
                            </a>
                          ) : null}

                          <label className={`flex items-center justify-center gap-2 text-sm cursor-pointer px-4 py-2 rounded-lg border transition-colors ${
                            isUploading ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-teal/30 hover:border-teal/50 hover:bg-teal/5 text-teal'
                          }`}>
                            {isUploading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                            {value ? (field.type === 'image' ? 'Зураг солих' : 'Файл солих') : (field.type === 'image' ? 'Зураг оруулах' : 'Файл оруулах')}
                            <input
                              type="file"
                              accept={field.type === 'image' ? 'image/*' : 'image/*,application/pdf'}
                              className="hidden"
                              disabled={isUploading}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) uploadImage(currentConfig.name, field.key, activeLang, file);
                              }}
                            />
                          </label>
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={value}
                          onChange={e => {
                            const newContent = [...content];
                            const existing = newContent.findIndex(c =>
                              c.section === currentConfig.name && c.key === field.key && c.lang === activeLang
                            );
                            if (existing >= 0) {
                              newContent[existing].value = e.target.value;
                            } else {
                              newContent.push({
                                id: `${currentConfig.name}-${field.key}-${activeLang}`,
                                section: currentConfig.name,
                                key: field.key,
                                lang: activeLang,
                                value: e.target.value,
                                image_url: '',
                              });
                            }
                            setContent(newContent);
                          }}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal resize-vertical"
                          rows={field.multiline ? 4 : 2}
                          placeholder={`Enter ${field.label.en.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={e => {
                            const newContent = [...content];
                            const existing = newContent.findIndex(c =>
                              c.section === currentConfig.name && c.key === field.key && c.lang === activeLang
                            );
                            if (existing >= 0) {
                              newContent[existing].value = e.target.value;
                            } else {
                              newContent.push({
                                id: `${currentConfig.name}-${field.key}-${activeLang}`,
                                section: currentConfig.name,
                                key: field.key,
                                lang: activeLang,
                                value: e.target.value,
                                image_url: '',
                              });
                            }
                            setContent(newContent);
                          }}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal"
                          placeholder={`Enter ${field.label.en.toLowerCase()}...`}
                        />
                      )}
                    </div>

                    <button
                      onClick={() => saveContent(currentConfig.name, field.key, activeLang, getContent(currentConfig.name, field.key, activeLang), field.type === 'image')}
                      disabled={isSaving}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSaving ? 'bg-slate-100 text-slate-400' : 'bg-teal text-white hover:bg-teal-dark'
                      }`}
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                      Хадгалах
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}