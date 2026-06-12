import React, { useState, useEffect } from 'react';
import { WidgetLayout } from '@oak-commerce/types';
import { catalogApi } from '../../lib/api-client';

interface WidgetRendererProps {
  widgets: WidgetLayout[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widgets, theme }) => {
  const cssVars = {
    '--sf-accent': theme.primaryColor,
    '--sf-primary': theme.primaryColor,
    '--sf-bg': theme.backgroundColor,
    backgroundColor: theme.backgroundColor,
  } as React.CSSProperties;

  return (
    <div style={cssVars} className="min-h-screen flex flex-col w-full">
      {widgets.map((w, index) => (
        <WidgetBlock key={w.id || `widget-${index}`} widget={w} theme={theme} />
      ))}
    </div>
  );
};

const WidgetBlock: React.FC<{ widget: WidgetLayout; theme: any }> = ({ widget, theme }) => {
  const { paddingTop = '2rem', paddingBottom = '2rem' } = widget.styles || {};
  const blockStyle = {
    paddingTop,
    paddingBottom,
  };

  switch (widget.type) {
    case 'HERO_BANNER':
      return (
        <div style={blockStyle} className="w-full">
          <HeroBanner block={widget} theme={theme} />
        </div>
      );
    case 'PRODUCT_GRID':
      return (
        <div style={blockStyle} className="w-full max-w-7xl mx-auto px-6">
          <ProductGrid block={widget} theme={theme} />
        </div>
      );
    case 'TEXT_BLOCK':
      return (
        <div style={blockStyle} className="w-full max-w-3xl mx-auto px-6">
          <TextBlock block={widget} theme={theme} />
        </div>
      );
    default:
      return null;
  }
};

/* 1. HERO_BANNER Component */
const HeroBanner: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const { title, subtitle, backgroundImageUrl, buttonText, buttonLink } = block.content || {};

  const hasBgImage = !!backgroundImageUrl;
  const primary = theme.primaryColor || '#10B981';
  const secondary = theme.secondaryColor || '#059669';

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-4">
      <div 
        className="relative w-full h-[400px] lg:h-[480px] flex flex-col items-center justify-center text-center overflow-hidden rounded-3xl"
        style={{
          background: hasBgImage 
            ? `url(${backgroundImageUrl}) center/cover no-repeat` 
            : `linear-gradient(135deg, ${primary}, ${secondary})`,
          boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)'
        }}
      >
        {hasBgImage ? (
          <>
            {/* Dynamic Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/40 to-transparent z-10" />

            {/* Glassmorphic Card Container */}
            <div className="relative z-20 text-center max-w-2xl mx-4 p-8 lg:p-12 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in">
              <h1 className="text-3xl lg:text-5xl font-black mb-4 tracking-tight drop-shadow-md text-white">
                {title || 'Organic Skincare Secrets'}
              </h1>
              <p className="text-sm lg:text-lg text-slate-100 font-medium mb-8 max-w-md mx-auto leading-relaxed drop-shadow">
                {subtitle || 'Discover premium organic blends, sourced with raw ingredients and custom-designed for wellness.'}
              </p>
              {buttonText && (
                <a
                  href={buttonLink || '#'}
                  className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {buttonText}
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="relative z-20 max-w-3xl px-6 lg:px-12 flex flex-col items-center">
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-4 tracking-tight text-white leading-tight drop-shadow-sm">
              {title || "Welcome to nature's finest"}
            </h1>
            <p className="text-sm lg:text-lg text-white/90 font-medium mb-8 max-w-xl leading-relaxed drop-shadow-sm">
              {subtitle || 'Discover our curated collection of premium organic products designed for you.'}
            </p>
            {buttonText && (
              <a
                href={buttonLink || '#'}
                className="inline-block px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md bg-white"
                style={{ color: primary }}
              >
                {buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* 2. PRODUCT_GRID Component */
const ProductGrid: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const { collectionId, itemsPerPage = 4, showPrice = true } = block.content || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGridProducts = async () => {
      setLoading(true);
      try {
        // Fetch categories first to find category slug by collectionId
        const categories = await catalogApi.getCategories();
        const category = categories?.find((c: any) => c.id === collectionId);
        
        // Fetch products filtered by the category slug
        const res = await catalogApi.getProducts({
          category_slug: category?.slug || undefined,
          limit: itemsPerPage,
        });
        setProducts(res?.products || []);
      } catch (err) {
        console.error('Error loading products for grid widget:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGridProducts();
  }, [collectionId, itemsPerPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-gray-200" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-sm">No products found in this category.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Featured Collection</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => {
          const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
          return (
            <div 
              key={p.id}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              {/* Product Thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <img 
                  src={coverImage} 
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[10px] px-2 py-1 rounded-md shadow-sm uppercase">
                    Sale
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-4 flex flex-col flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{p.category?.name || 'Skincare'}</span>
                <h3 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {p.name}
                </h3>
                
                <div className="mt-auto flex items-center justify-between pt-2">
                  {showPrice && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-slate-900 text-sm">₹{p.price}</span>
                      {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                        <span className="text-xxs text-slate-400 line-through">₹{p.compare_price}</span>
                      )}
                    </div>
                  )}
                  <a 
                    href={`/products/${p.slug}`}
                    className="text-[10px] font-black uppercase tracking-wider transition-colors duration-150 hover:underline"
                    style={{ color: theme.primaryColor }}
                  >
                    View details →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 3. TEXT_BLOCK Component */
const TextBlock: React.FC<{ block: any; theme: any }> = ({ block }) => {
  const { title, body } = block.content || {};

  return (
    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
      {title && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
        </div>
      )}
      <div 
        className="text-sm lg:text-base text-slate-600 space-y-4"
        dangerouslySetInnerHTML={{ __html: body || 'Enter paragraph copy here...' }}
      />
    </div>
  );
};
