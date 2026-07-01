'use client';
import { useState, useEffect } from 'react';
import { storefrontApi } from '@/lib/api-client';

// Lightweight hook — provides reactive accent/bg colors for JS expressions (gradients, etc.)
// CSS var updates are handled exclusively by ThemeApplier mounted in StorefrontShell.

const DEFAULTS = {
  accent: '#15803D',
  bg: '#FAF7F2',
  primary: '#111827',
};

export const usePageTheme = (_slug?: string) => {
  const [colors, setColors] = useState(DEFAULTS);

  // Initial load from API
  useEffect(() => {
    storefrontApi.getPageContent().then((data: any) => {
      const c = data?.content;
      if (c) setColors({
        accent:  c.color_accent  || DEFAULTS.accent,
        bg:      c.color_bg      || DEFAULTS.bg,
        primary: c.color_primary || DEFAULTS.primary,
      });
    }).catch(() => {});
  }, []);

  // Respond to THEME_UPDATE from editor preview
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'THEME_UPDATE' && e.data?.payload) {
        const p = e.data.payload;
        setColors({
          accent:  p.color_accent  || DEFAULTS.accent,
          bg:      p.color_bg      || DEFAULTS.bg,
          primary: p.color_primary || DEFAULTS.primary,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // cssVariables intentionally empty — CSS vars are set on :root by ThemeApplier.
  const cssVariables = {} as React.CSSProperties;

  // Backward-compat shape for existing callers that destructure `theme`
  const theme: PageTheme = {
    primaryColor:    colors.accent,
    secondaryColor:  colors.accent,
    backgroundColor: colors.bg,
    fontFamily:      undefined,
  };

  return { colors, theme, cssVariables, loading: false };
};

export type PageTheme = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
};
