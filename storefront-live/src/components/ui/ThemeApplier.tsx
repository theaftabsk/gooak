'use client';
import { useEffect } from 'react';
import { storefrontApi } from '@/lib/api-client';

function loadGoogleFont(name: string) {
  if (!name || typeof document === 'undefined') return;
  if (document.querySelector(`link[data-gf="${name}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
  link.setAttribute('data-gf', name);
  document.head.appendChild(link);
}

function applyTheme(content: Record<string, string>) {
  const root = document.documentElement;
  const set = (prop: string, val: string) => { if (val) root.style.setProperty(prop, val); };

  // Fonts — update both sf- vars AND the base --font-* vars that components reference directly
  if (content.font_heading) {
    loadGoogleFont(content.font_heading);
    const v = `'${content.font_heading}', serif`;
    set('--sf-font-heading', v);
    set('--font-serif', v);
  }
  if (content.font_body) {
    loadGoogleFont(content.font_body);
    const v = `'${content.font_body}', sans-serif`;
    set('--sf-font-body', v);
    set('--font-sans', v);
  }

  // Colors
  set('--sf-bg',           content.color_bg);
  set('--sf-card-bg',      content.color_surface);
  set('--sf-text-main',    content.color_text);
  set('--sf-text-muted',   content.color_muted);
  set('--sf-primary',      content.color_primary || content.color_text || '');
  set('--sf-accent',       content.color_accent);
  set('--sf-accent-hover', content.color_accent_hover || content.color_accent || '');
  set('--sf-border',       content.color_border);
}

export function ThemeApplier() {
  useEffect(() => {
    storefrontApi.getPageContent().then((data: any) => {
      if (data?.content) applyTheme(data.content);
    }).catch(() => {});

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'THEME_UPDATE' && e.data?.payload) applyTheme(e.data.payload);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return null;
}
