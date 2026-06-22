import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { customerApi } from '../../../lib/api-client';

export const useLiveSettings = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<{ shop: any; content: Record<string, string> } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('oaksol_preview_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    customerApi.getPages()
      .then(res => {
        setData(res);
        if (res && typeof window !== 'undefined') {
          localStorage.setItem('oaksol_preview_settings', JSON.stringify(res));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleSettingsMsg = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SETTINGS_UPDATE') {
        setData(prev => {
          const nextContent = prev ? { ...prev.content, ...event.data.payload } : event.data.payload;
          const nextData = prev ? { ...prev, content: nextContent } : { shop: null, content: nextContent };
          if (typeof window !== 'undefined') {
            localStorage.setItem('oaksol_preview_settings', JSON.stringify(nextData));
          }
          return nextData;
        });
      }
    };

    window.addEventListener('message', handleSettingsMsg);
    return () => window.removeEventListener('message', handleSettingsMsg);
  }, []);

  return { data, setData, shop: data?.shop, content: data?.content || {} };
};
