'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
}

const DEFAULT_THEME: PageTheme = {
  primaryColor: '#15803D', // Forest Green
  secondaryColor: '#ffffff',
  backgroundColor: '#FAF7F2', // Warm linen cream
  fontFamily: 'Inter, sans-serif',
};

export const usePageTheme = (slug: string) => {
  const searchParams = useSearchParams();
  const actualSlug = slug === '/' || slug === '' ? 'index' : slug;

  const [theme, setTheme] = useState<PageTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`oaksol_preview_theme_${actualSlug}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_THEME;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No backend pageBuilderApi theme fetch anymore since visual builder is removed.
    // The theme is initialized to DEFAULT_THEME or loaded from localStorage if saved.
    setLoading(false);
  }, [slug, actualSlug]);

  // Setup preview postMessage listener for visual editor hot-reloading theme styles
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LAYOUT_UPDATE') {
        const payload = event.data.payload;
        if (payload && payload.slug === slug && payload.theme) {
          const fetchedTheme = {
            primaryColor: payload.theme.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: payload.theme.secondaryColor || DEFAULT_THEME.secondaryColor,
            backgroundColor: payload.theme.backgroundColor || DEFAULT_THEME.backgroundColor,
            fontFamily: payload.theme.fontFamily || DEFAULT_THEME.fontFamily,
          };
          setTheme(fetchedTheme);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`oaksol_preview_theme_${actualSlug}`, JSON.stringify(fetchedTheme));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slug, actualSlug]);

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--sf-accent', theme.primaryColor);
      document.documentElement.style.setProperty('--sf-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--sf-bg', theme.backgroundColor);
      if (theme.fontFamily) {
        document.documentElement.style.setProperty('--sf-font', theme.fontFamily);
        document.body.style.fontFamily = theme.fontFamily;
        
        // Dynamically load Google Font if applicable
        const fontName = theme.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (fontName && fontName !== 'Inter' && fontName !== 'sans-serif' && fontName !== 'serif' && fontName !== 'Arial' && fontName !== 'sans') {
          const fontId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
          if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800&display=swap`;
            document.head.appendChild(link);
          }
        }
      }
    }
  }, [theme.primaryColor, theme.secondaryColor, theme.backgroundColor, theme.fontFamily]);

  const cssVariables = {
    '--sf-accent': theme.primaryColor,
    '--sf-primary': theme.primaryColor,
    '--sf-bg': theme.backgroundColor,
    fontFamily: theme.fontFamily,
  } as React.CSSProperties;

  return { theme, cssVariables, loading };
};
