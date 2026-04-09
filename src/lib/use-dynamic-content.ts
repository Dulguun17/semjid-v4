import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ContentItem = {
  id: string;
  section: string;
  key: string;
  lang: 'mn' | 'en';
  value: string;
  image_url: string;
};

export function useDynamicContent() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data } = await supabase.from('content').select('*');
        setContent(data || []);
      } catch (error) {
        console.error('Failed to load dynamic content:', error);
        // Fall back to empty array if table doesn't exist
      }
      setLoading(false);
    };

    loadContent();
  }, []);

  const getContent = (section: string, key: string, lang: 'mn' | 'en'): string => {
    const item = content.find(c => c.section === section && c.key === key && c.lang === lang);
    return item?.value || item?.image_url || '';
  };

  return { content, loading, getContent };
}