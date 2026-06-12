import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pageBuilderApi } from '../../../lib/api-client';

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

const DEFAULT_THEME: PageTheme = {
  primaryColor: '#15803D', // Forest Green
  secondaryColor: '#ffffff',
  backgroundColor: '#FAF7F2', // Warm linen cream
};

export const usePageTheme = (slug: string) => {
  const [searchParams] = useSearchParams();
  const [theme, setTheme] = useState<PageTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      try {
        const actualSlug = slug === '/' || slug === '' ? 'index' : slug;
        const pageData = await pageBuilderApi.getPageBySlug(actualSlug);
        if (pageData?.theme) {
          setTheme({
            primaryColor: pageData.theme.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: pageData.theme.secondaryColor || DEFAULT_THEME.secondaryColor,
            backgroundColor: pageData.theme.backgroundColor || DEFAULT_THEME.backgroundColor,
          });
        }
      } catch (err) {
        console.warn(`[usePageTheme] Failed to load theme for slug "${slug}":`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [slug]);

  // Setup preview postMessage listener for visual editor hot-reloading theme styles
  useEffect(() => {
    if (!isPreview) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LAYOUT_UPDATE') {
        const payload = event.data.payload;
        if (payload && payload.slug === slug && payload.theme) {
          setTheme({
            primaryColor: payload.theme.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: payload.theme.secondaryColor || DEFAULT_THEME.secondaryColor,
            backgroundColor: payload.theme.backgroundColor || DEFAULT_THEME.backgroundColor,
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isPreview, slug]);

  const cssVariables = {
    '--sf-accent': theme.primaryColor,
    '--sf-primary': theme.primaryColor,
    '--sf-bg': theme.backgroundColor,
  } as React.CSSProperties;

  return { theme, cssVariables, loading };
};
