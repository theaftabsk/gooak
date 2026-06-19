import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LivePageData } from '@oak-commerce/types';
import { pageBuilderApi } from '../../../lib/api-client';
import { WidgetRenderer } from '../WidgetRenderer';

interface DynamicPageProps {
  fallback?: React.ReactNode;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ fallback }) => {
  const { slug = 'index' } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const [pageData, setPageData] = useState<LivePageData | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`oaksol_preview_page_${slug}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await pageBuilderApi.getPageBySlug(slug);
        setPageData(data);
        if (data && typeof window !== 'undefined') {
          localStorage.setItem(`oaksol_preview_page_${slug}`, JSON.stringify(data));
        }
      } catch (err: any) {
        setError(err.message || 'Page details not found');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  // Setup preview postMessage listener for visual editor integration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LAYOUT_UPDATE' && event.data.payload?.slug === slug) {
        console.log('[Storefront Preview] Layout update received:', event.data.payload);
        setPageData(event.data.payload);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`oaksol_preview_page_${slug}`, JSON.stringify(event.data.payload));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slug]);

  const theme = pageData?.theme || {
    primaryColor: '#15803D',
    secondaryColor: '#ffffff',
    backgroundColor: '#ffffff',
  };

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--sf-accent', theme.primaryColor);
      document.documentElement.style.setProperty('--sf-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--sf-bg', theme.backgroundColor);
    }
  }, [theme.primaryColor, theme.secondaryColor, theme.backgroundColor]);

  if (loading && !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 border-gray-200" />
      </div>
    );
  }

  // Fallback default state if page is not found or has no widgets yet
  if (!pageData || !pageData.widgets || pageData.widgets.length === 0) {
    if (fallback) {
      return <>{fallback}</>;
    }
    if (!pageData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
          <span className="text-4xl mb-4">🏠</span>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Welcome to your store</h1>
          <p className="text-slate-500 text-sm max-w-sm">
            No published storefront widgets found for this path yet. Customize this page inside the Merchant Dashboard Page Builder.
          </p>
        </div>
      );
    }
  }

  return (
    <WidgetRenderer 
      widgets={pageData.widgets} 
      theme={theme} 
    />
  );
};
