'use client';
import React, { useEffect, useState } from 'react';
import { storefrontApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import type { Section } from './types';
import { STYLES } from './styles';

import { SectionHero }               from './sections/SectionHero';
import { SectionRichText }            from './sections/SectionRichText';
import { SectionImageText }           from './sections/SectionImageText';
import { SectionCards }               from './sections/SectionCards';
import { SectionCta }                 from './sections/SectionCta';
import { SectionContactForm }         from './sections/SectionContactForm';
import { SectionAnnouncementBar }     from './sections/SectionAnnouncementBar';
import { SectionBannerSlider }        from './sections/SectionBannerSlider';
import { SectionCategoriesCarousel }  from './sections/SectionCategoriesCarousel';
import { SectionProductsGrid }        from './sections/SectionProductsGrid';
import { SectionFeaturesStrip }       from './sections/SectionFeaturesStrip';
import { SectionAboutSection }        from './sections/SectionAboutSection';

function renderSection(s: Section, i: number) {
  switch (s.type) {
    case 'hero':                return <SectionHero               key={i} data={s.data} />;
    case 'rich_text':           return <SectionRichText           key={i} data={s.data} />;
    case 'image_text':          return <SectionImageText          key={i} data={s.data} />;
    case 'cards':               return <SectionCards              key={i} data={s.data} />;
    case 'cta':                 return <SectionCta                key={i} data={s.data} />;
    case 'contact_form':        return <SectionContactForm        key={i} data={s.data} />;
    case 'announcement_bar':    return <SectionAnnouncementBar    key={i} data={s.data} />;
    case 'banner_slider':       return <SectionBannerSlider       key={i} data={s.data} />;
    case 'categories_carousel': return <SectionCategoriesCarousel key={i} data={s.data} />;
    case 'products_grid':       return <SectionProductsGrid       key={i} data={s.data} />;
    case 'features_strip':      return <SectionFeaturesStrip      key={i} data={s.data} />;
    case 'about_section':       return <SectionAboutSection       key={i} data={s.data} />;
    default:                    return null;
  }
}

export const CustomPage: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
  const { cssVariables } = usePageTheme('page');
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previewSections, setPreviewSections] = useState<Section[] | null>(null);

  const isPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  useEffect(() => {
    if (!isPreview) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'page_preview' && Array.isArray(e.data.sections)) {
        setPreviewSections(e.data.sections);
        setLoading(false);
        setNotFound(false);
      }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'preview_ready' }, '*');
    return () => window.removeEventListener('message', handler);
  }, [isPreview]);

  useEffect(() => {
    if (isPreview || !pageSlug) return;
    const fetch = (showLoading = false) => {
      if (showLoading) { setLoading(true); setNotFound(false); }
      storefrontApi
        .getPage(pageSlug)
        .then(d => { setPage(d); setNotFound(false); })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    };
    fetch(true);
    const onVisible = () => { if (document.visibilityState === 'visible') fetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pageSlug, isPreview]);

  const sections: Section[] = previewSections ?? (Array.isArray(page?.sections) ? page.sections : []);

  if (loading) {
    return (
      <div className="cp-page" style={cssVariables}>
        <style>{STYLES}</style>
        <div style={{ padding: '120px 5%', textAlign: 'center', color: 'var(--sf-text-muted,#9ca3af)', fontSize: '0.88rem' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || (!page && !previewSections)) {
    return (
      <div className="cp-page" style={cssVariables}>
        <style>{STYLES}</style>
        <div style={{ padding: '120px 5%', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--sf-font-heading,serif)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
            Page Not Found
          </h2>
          <p style={{ color: 'var(--sf-text-muted,#6b7280)' }}>
            This page does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page" style={cssVariables}>
      <style>{STYLES}</style>
      {sections.map(renderSection)}
      {sections.length === 0 && (
        <div style={{ padding: '80px 5%', textAlign: 'center', color: 'var(--sf-text-muted,#9ca3af)', fontSize: '0.88rem' }}>
          No content yet.
        </div>
      )}
    </div>
  );
};

export default CustomPage;
