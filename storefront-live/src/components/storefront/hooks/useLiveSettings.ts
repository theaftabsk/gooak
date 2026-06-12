import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { customerApi } from '../../../lib/api-client';

export const useLiveSettings = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<{ shop: any; content: Record<string, string> } | null>(null);
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    customerApi.getPages().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isPreview) return;

    const handleSettingsMsg = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SETTINGS_UPDATE') {
        setData(prev => {
          if (!prev) return { shop: null, content: event.data.payload };
          return {
            ...prev,
            content: { ...prev.content, ...event.data.payload }
          };
        });
      }
    };

    window.addEventListener('message', handleSettingsMsg);
    return () => window.removeEventListener('message', handleSettingsMsg);
  }, [isPreview]);

  return { data, setData, shop: data?.shop, content: data?.content || {} };
};
