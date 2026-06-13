import React, { useState, useEffect, useRef } from 'react';
import { WidgetLayout } from '@oak-commerce/types';
import { catalogApi } from '../../lib/api-client';
import { useSearchParams } from 'react-router-dom';

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
    <div style={{ ...cssVars, display: 'flex', flexDirection: 'column', width: '100%', minHeight: '1px' }}>
      {widgets.map((w, index) => (
        <WidgetBlock key={w.id || `widget-${index}`} widget={w} theme={theme} />
      ))}
    </div>
  );
};

const WidgetBlock: React.FC<{ widget: WidgetLayout; theme: any }> = ({ widget, theme }) => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [isHovered, setIsHovered] = useState(false);

  const { paddingTop = '0px', paddingBottom = '0px' } = widget.styles || {};
  const blockStyle = { paddingTop, paddingBottom, width: '100%' };

  const containerStyle: React.CSSProperties = isPreview ? {
    position: 'relative',
    cursor: 'pointer',
    outline: isHovered ? '2px dashed #3B82F6' : 'none',
    outlineOffset: '-2px',
    transition: 'outline 0.15s ease-in-out',
  } : {};

  const handleBlockClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'SELECT_WIDGET', payload: { id: widget.id } }, '*');
    }
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'HERO_BANNER':
        return (
          <div style={blockStyle}>
            <HeroBanner block={widget} theme={theme} />
          </div>
        );
      case 'PRODUCT_GRID':
        return (
          <div style={{ ...blockStyle, maxWidth: '1400px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <ProductGrid block={widget} theme={theme} />
          </div>
        );
      case 'TEXT_BLOCK':
        return (
          <div style={{ ...blockStyle, maxWidth: '900px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <TextBlock block={widget} theme={theme} />
          </div>
        );
      case 'PROMO_GRID':
        return (
          <div style={{ ...blockStyle, maxWidth: '1400px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <PromoGrid block={widget} theme={theme} />
          </div>
        );
      case 'TESTIMONIALS':
        return (
          <div style={{ ...blockStyle, maxWidth: '1400px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <Testimonials block={widget} theme={theme} />
          </div>
        );
      case 'BEST_SELLERS':
        return (
          <div style={{ ...blockStyle, maxWidth: '1400px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <BestSellers block={widget} theme={theme} />
          </div>
        );
      case 'CATEGORIES_LIST':
        return (
          <div style={{ ...blockStyle, maxWidth: '1400px', margin: '0 auto', padding: `${paddingTop} 24px ${paddingBottom}`, boxSizing: 'border-box' }}>
            <CategoriesList block={widget} theme={theme} />
          </div>
        );
      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div
      style={containerStyle}
      onClick={handleBlockClick}
      onMouseEnter={() => isPreview && setIsHovered(true)}
      onMouseLeave={() => isPreview && setIsHovered(false)}
    >
      {content}
      {isPreview && isHovered && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: '#3B82F6',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '6px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
        }}>
          Click to Edit
        </div>
      )}
    </div>
  );
};


/* 1. HERO_BANNER Component */
const HeroBanner: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const content = block.content || {};
  const overlayColor = content.overlayColor || '#000000';
  const overlayOpacity = content.overlayOpacity || '50';

  // Fallback to legacy single slide content if slides array doesn't exist
  const slides = content.slides && content.slides.length > 0 ? content.slides : [
    {
      title: content.title,
      subtitle: content.subtitle,
      backgroundImageUrl: content.backgroundImageUrl,
      buttonText: content.buttonText,
      buttonLink: content.buttonLink,
      textAlign: content.textAlign || 'center',
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const intervalSec = parseInt(content.autoplaySpeed || '3');
    const intervalMs = (intervalSec > 0 ? intervalSec : 3) * 1000;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [slides.length, content.autoplaySpeed]);

  const primary = theme.primaryColor || '#10B981';
  const secondary = theme.secondaryColor || '#059669';

  // Compute overlay with hex + opacity
  const hexToRgba = (hex: string, opacity: number) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${opacity / 100})`;
    } catch (e) {
      return `rgba(0,0,0,${opacity / 100})`;
    }
  };
  const overlayRgba = hexToRgba(overlayColor, parseInt(overlayOpacity));

  return (
    <div style={{ width: '100%', padding: '0', boxSizing: 'border-box', maxWidth: '100%', margin: '0 auto' }}>
      <style>{`
        .sf-hero-container {
          position: relative;
          width: 100%;
          min-height: 600px;
          overflow: hidden;
          background: #f1f5f9;
        }
        .sf-hero-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease-in-out, visibility 0.6s ease-in-out;
        }
        .sf-hero-slide.active {
          opacity: 1;
          visibility: visible;
        }
        .sf-hero-slide-relative {
          position: relative;
          width: 100%;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease-in-out, visibility 0.6s ease-in-out;
        }
        .sf-hero-slide-relative.active {
          opacity: 1;
          visibility: visible;
        }
        .sf-hero-alignment {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 80px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 600px;
        }
        .sf-hero-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
          align-items: center;
          width: 100%;
        }
        .sf-hero-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: flex-start;
          text-align: left;
        }
        .sf-hero-right {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .sf-hero-img {
          max-width: 100%;
          max-height: 440px;
          object-fit: contain;
          filter: drop-shadow(0 15px 30px rgba(0,0,0,0.1));
        }

        @media (max-width: 1024px) {
          .sf-hero-alignment {
            padding: 40px 40px;
          }
        }
        @media (max-width: 768px) {
          .sf-hero-container {
            min-height: auto !important;
          }
          .sf-hero-slide, .sf-hero-slide-relative {
            min-height: auto !important;
            position: relative !important;
            inset: auto !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          .sf-hero-slide.active, .sf-hero-slide-relative.active {
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .sf-hero-alignment {
            min-height: auto !important;
            padding: 40px 24px;
            height: auto !important;
          }
          .sf-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            justify-items: center;
          }
          .sf-hero-left {
            align-items: center !important;
            text-align: center !important;
          }
          .sf-hero-img {
            max-height: 280px !important;
          }
        }
      `}</style>
      <div className="sf-hero-container">
        {slides.map((slide: any, idx: number) => {
          const isCurrent = idx === activeIndex;
          const hasBgImage = !!slide.backgroundImageUrl;
          const alignStyle: React.CSSProperties = {
            textAlign: (slide.textAlign || 'center') as any,
            alignItems: slide.textAlign === 'left' ? 'flex-start' : slide.textAlign === 'right' ? 'flex-end' : 'center',
          };

          const isSplitLayout = slide.layout === 'split_product';

          // Card theme & customization parameters
          const showTextCard = slide.showTextCard !== undefined ? !!slide.showTextCard : !!slide.showTextBlur;
          const cardTheme = slide.textCardTheme || 'light';
          const opacityVal = slide.textCardOpacity !== undefined ? parseInt(slide.textCardOpacity) : (cardTheme === 'light' ? 15 : 45);
          const blurVal = slide.textCardBlur !== undefined ? parseInt(slide.textCardBlur) : 12;

          const isLightText = !showTextCard || cardTheme === 'dark' || (cardTheme === 'light' && opacityVal < 45);
          const textColor = isLightText ? '#ffffff' : '#0f172a';
          const subtextColor = isLightText ? 'rgba(255,255,255,0.9)' : '#334155';

          const cardBg = cardTheme === 'light'
            ? `rgba(255, 255, 255, ${opacityVal / 100})`
            : `rgba(15, 23, 42, ${opacityVal / 100})`;
          const cardBorder = cardTheme === 'light'
            ? `1px solid rgba(255, 255, 255, ${Math.max(0.1, (opacityVal + 10) / 100)})`
            : `1px solid rgba(255, 255, 255, 0.08)`;

          return (
            <div
              key={idx}
              className={`${idx === 0 ? 'sf-hero-slide-relative' : 'sf-hero-slide'}${isCurrent ? ' active' : ''}`}
              style={{
                background: isSplitLayout
                  ? (slide.slideBgColor || '#e2eee5')
                  : hasBgImage
                    ? `url(${slide.backgroundImageUrl}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${primary}, ${secondary})`,
                zIndex: isCurrent ? 2 : 1,
              }}
            >
              {/* Overlay (only for default layout with background image) */}
              {!isSplitLayout && hasBgImage && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: overlayRgba,
                    zIndex: 1,
                  }}
                />
              )}

              {/* Content Grid Alignment Container */}
              <div className="sf-hero-alignment">
                {isSplitLayout ? (
                  // Split screen product layout
                  <div className="sf-hero-grid">
                    {/* Left Column: Text */}
                    <div className="sf-hero-left">
                      <h1
                        style={{
                          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                          fontWeight: 900,
                          color: slide.textColor || '#1b4332',
                          margin: 0,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.1,
                          fontFamily: "'Outfit', sans-serif",
                          textTransform: 'uppercase',
                        }}
                      >
                        {slide.title || "NOURISH YOUR SKIN"}
                      </h1>

                      {slide.subtitle && (
                        <div
                          style={{
                            borderTop: `2px solid ${slide.textColor || '#1b4332'}`,
                            borderBottom: `2px solid ${slide.textColor || '#1b4332'}`,
                            padding: '12px 24px',
                            background: 'rgba(255, 255, 255, 0.85)',
                            color: slide.textColor || '#1b4332',
                            fontWeight: 800,
                            fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {slide.subtitle}
                        </div>
                      )}

                      {slide.buttonText && (
                        <div style={{ marginTop: 12 }}>
                          <a
                            href={slide.buttonLink || '#'}
                            style={{
                              display: 'inline-block',
                              background: primary,
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              padding: '14px 38px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              boxShadow: `0 4px 12px ${primary}40`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                          >
                            {slide.buttonText}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Centered Contain Image */}
                    <div className="sf-hero-right">
                      {slide.backgroundImageUrl && (
                        <img
                          src={slide.backgroundImageUrl}
                          alt={slide.title || "Product image"}
                          className="sf-hero-img"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  // Default full-bleed layout
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      maxWidth: hasBgImage ? '720px' : '800px',
                      margin: slide.textAlign === 'left' ? '0' : slide.textAlign === 'right' ? '0 0 0 auto' : '0 auto',
                      ...alignStyle,
                    }}
                  >
                    {hasBgImage ? (
                      // Image mode — conditionally show customized card style
                      showTextCard ? (
                        <div
                          style={{
                            background: cardBg,
                            backdropFilter: `blur(${blurVal}px)`,
                            borderRadius: '20px',
                            border: cardBorder,
                            padding: '40px 48px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            ...alignStyle,
                          }}
                        >
                          <h1
                            style={{
                              fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                              fontWeight: 900,
                              color: textColor,
                              margin: 0,
                              letterSpacing: '-0.02em',
                              lineHeight: 1.15,
                              fontFamily: "'Outfit', sans-serif",
                              textShadow: isLightText ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
                            }}
                          >
                            {slide.title || "Welcome to nature's finest"}
                          </h1>
                          <p
                            style={{
                              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                              color: subtextColor,
                              margin: 0,
                              lineHeight: 1.65,
                              maxWidth: 520,
                              fontWeight: 500,
                            }}
                          >
                            {slide.subtitle}
                          </p>
                          {slide.buttonText && (
                            <div style={{ marginTop: 8 }}>
                              <a
                                href={slide.buttonLink || '#'}
                                style={{
                                  display: 'inline-block',
                                  background: primary,
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.92rem',
                                  padding: '14px 36px',
                                  borderRadius: '12px',
                                  textDecoration: 'none',
                                  boxShadow: `0 6px 20px ${primary}55`,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                              >
                                {slide.buttonText}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <h1
                            style={{
                              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                              fontWeight: 900,
                              color: textColor,
                              margin: 0,
                              letterSpacing: '-0.02em',
                              lineHeight: 1.15,
                              fontFamily: "'Outfit', sans-serif",
                              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                            }}
                          >
                            {slide.title || "Welcome to nature's finest"}
                          </h1>
                          <p
                            style={{
                              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                              color: subtextColor,
                              margin: 0,
                              lineHeight: 1.65,
                              maxWidth: 560,
                              fontWeight: 500,
                              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
                            }}
                          >
                            {slide.subtitle}
                          </p>
                          {slide.buttonText && (
                            <div style={{ marginTop: 8 }}>
                              <a
                                href={slide.buttonLink || '#'}
                                style={{
                                  display: 'inline-block',
                                  background: primary,
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '0.92rem',
                                  padding: '14px 36px',
                                  borderRadius: '12px',
                                  textDecoration: 'none',
                                  boxShadow: `0 6px 20px ${primary}55`,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                              >
                                {slide.buttonText}
                              </a>
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      // Gradient mode — clean text on gradient
                      <>
                        <h1
                          style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 900,
                            color: '#ffffff',
                            margin: 0,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            fontFamily: "'Outfit', sans-serif",
                            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          {slide.title || "Welcome to nature's finest"}
                        </h1>
                        <p
                          style={{
                            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                            color: 'rgba(255,255,255,0.92)',
                            margin: 0,
                            lineHeight: 1.6,
                            maxWidth: 560,
                            fontWeight: 500,
                          }}
                        >
                          {slide.subtitle}
                        </p>
                        {slide.buttonText && (
                          <div style={{ marginTop: 8 }}>
                            <a
                              href={slide.buttonLink || '#'}
                              style={{
                                display: 'inline-block',
                                background: 'rgba(255,255,255,0.95)',
                                color: primary,
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                padding: '14px 36px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                            >
                              {slide.buttonText}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Left Arrow Navigation */}
        {slides.length > 1 && (
          <button
            onClick={() => setActiveIndex(prev => (prev - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.4)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right Arrow Navigation */}
        {slides.length > 1 && (
          <button
            onClick={() => setActiveIndex(prev => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.4)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Slide Indicator Dots */}
        {slides.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              zIndex: 10,
            }}
          >
            {slides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: idx === activeIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === activeIndex ? primary : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
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
        const categories = await catalogApi.getCategories();
        const category = categories?.find((c: any) => c.id === collectionId);
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #e5e7eb', borderTopColor: theme.primaryColor || '#10B981',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        border: '1.5px dashed #e2e8f0', borderRadius: '20px',
        background: '#f8fafc'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No products found in this category.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        fontSize: '1.5rem', fontWeight: 900, color: '#1e293b',
        letterSpacing: '-0.02em', margin: '0 0 28px',
        fontFamily: "'Outfit', sans-serif",
      }}>
        Featured Collection
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px',
      }}>
        {products.map((p) => {
          const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url ||
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
          const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
          return (
            <a
              key={p.id}
              href={`/products/${p.slug}`}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 32px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f9fafb' }}>
                <img src={coverImage} alt={p.name} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                />
                {isOnSale && (
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#EF4444', color: '#fff',
                    fontSize: '0.62rem', fontWeight: 700,
                    padding: '3px 8px', borderRadius: '6px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>Sale</span>
                )}
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#9ca3af', display: 'block', marginBottom: 6,
                }}>{p.category?.name || 'Skincare'}</span>
                <h3 style={{
                  fontWeight: 700, color: '#111827', fontSize: '0.9rem',
                  margin: '0 0 14px', lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                }}>{p.name}</h3>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {showPrice && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontWeight: 800, color: theme.primaryColor, fontSize: '0.95rem' }}>₹{p.price}</span>
                      {isOnSale && <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{p.compare_price}</span>}
                    </div>
                  )}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.primaryColor }}>View →</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

/* 3. TEXT_BLOCK Component */
const TextBlock: React.FC<{ block: any; theme: any }> = ({ block }) => {
  const { title, body, imageUrl, imagePosition = 'none' } = block.content || {};

  const hasImage = !!imageUrl && imagePosition !== 'none';

  const textContent = (
    <div style={{ flex: 1, minWidth: '280px', color: '#374151', lineHeight: 1.7, fontWeight: 500 }}>
      {title && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div style={{
            height: 4, width: 48,
            background: 'linear-gradient(to right, #10b981, #14b8a6)',
            borderRadius: 99,
          }} />
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 900, color: '#1e293b',
            letterSpacing: '-0.02em', margin: 0,
            fontFamily: "'Outfit', sans-serif",
          }}>{title}</h2>
        </div>
      )}
      <div
        style={{ fontSize: '0.95rem', color: '#4b5563' }}
        dangerouslySetInnerHTML={{ __html: body || 'Enter paragraph copy here...' }}
      />
    </div>
  );

  const imgContent = hasImage ? (
    <div style={{
      flex: 1,
      minWidth: '280px',
      maxWidth: (imagePosition === 'left' || imagePosition === 'right') ? '45%' : '100%',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <img
        src={imageUrl}
        alt={title || "Section Image"}
        loading="lazy"
        style={{
          width: '100%',
          maxHeight: '400px',
          objectFit: 'cover',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      />
    </div>
  ) : null;

  if (hasImage) {
    const isSideBySide = imagePosition === 'left' || imagePosition === 'right';
    const isRight = imagePosition === 'right';
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: isSideBySide ? (isRight ? 'row-reverse' : 'row') : 'column',
        gap: '32px',
        alignItems: isSideBySide ? 'center' : 'stretch',
        flexWrap: 'wrap',
      }}>
        {isRight ? textContent : imgContent}
        {isRight ? imgContent : textContent}
      </div>
    );
  }

  return textContent;
};

/* 4. PROMO_GRID Component */
const PromoGrid: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const content = block.content || {};
  const layout = content.layout || '3-columns';
  const cards = content.cards || [];
  const title = content.title || '';
  const subtitle = content.subtitle || '';

  const primary = theme.primaryColor || '#10B981';

  // Render a single card
  const renderCard = (card: any, idx: number) => {
    const bgStyle: React.CSSProperties = {
      backgroundColor: card.bgColor || '#f1f5f9',
      color: card.textColor || '#0f172a',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: card.imgPosition === 'left' ? 'row' : card.imgPosition === 'right' ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '30px',
      minHeight: '220px',
      textDecoration: 'none',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
      height: '100%',
    };

    const textWrapStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 2,
      flex: 1,
      minWidth: 0,
      textAlign: card.imgPosition === 'background' ? 'center' : 'left',
      alignItems: card.imgPosition === 'background' ? 'center' : 'flex-start',
      width: '100%',
    };

    if (card.imgPosition === 'background') {
      bgStyle.background = card.backgroundImageUrl ? `url(${card.backgroundImageUrl}) center/cover no-repeat` : '#f1f5f9';
      bgStyle.flexDirection = 'column';
      bgStyle.justifyContent = 'center';
    }

    return (
      <a
        key={idx}
        href={card.buttonLink || '#'}
        style={bgStyle}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
        }}
      >
        {/* Background Image Overlay for Background Mode */}
        {card.imgPosition === 'background' && card.backgroundImageUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 }} />
        )}

        {/* Left Image Mode */}
        {card.imgPosition === 'left' && card.backgroundImageUrl && (
          <img src={card.backgroundImageUrl} alt={card.title} style={{ width: '45%', height: 'auto', maxHeight: '160px', objectFit: 'contain', zIndex: 2, marginRight: '16px' }} />
        )}

        {/* Text Container */}
        <div style={textWrapStyle}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            margin: 0,
            fontFamily: "'Outfit', sans-serif",
            color: card.imgPosition === 'background' && card.backgroundImageUrl ? '#ffffff' : card.textColor || '#0f172a',
            lineHeight: 1.2
          }}>
            {card.title || 'Promo Banner'}
          </h3>
          {card.subtitle && (
            <p style={{
              fontSize: '0.85rem',
              margin: 0,
              opacity: 0.85,
              fontWeight: 500,
              color: card.imgPosition === 'background' && card.backgroundImageUrl ? '#ffffff' : card.textColor || '#475569'
            }}>
              {card.subtitle}
            </p>
          )}
          {card.buttonText && (
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '12px',
              borderBottom: `2px solid ${card.imgPosition === 'background' && card.backgroundImageUrl ? '#ffffff' : primary}`,
              paddingBottom: '2px',
              color: card.imgPosition === 'background' && card.backgroundImageUrl ? '#ffffff' : primary
            }}>
              {card.buttonText}
            </span>
          )}
        </div>

        {/* Right Image Mode */}
        {card.imgPosition === 'right' && card.backgroundImageUrl && (
          <img src={card.backgroundImageUrl} alt={card.title} style={{ width: '45%', height: 'auto', maxHeight: '160px', objectFit: 'contain', zIndex: 2, marginLeft: '16px' }} />
        )}
      </a>
    );
  };

  // Render grid based on layout choice
  const getGridLayout = () => {
    switch (layout) {
      case '2-columns':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {cards.map((c: any, idx: number) => renderCard(c, idx))}
          </div>
        );
      case 'asymmetric-3-box':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ gridColumn: 'span 1' }}>{cards[0] && renderCard(cards[0], 0)}</div>
            <div style={{ gridColumn: 'span 1' }}>{cards[1] && renderCard(cards[1], 1)}</div>
            <div style={{ gridColumn: 'span 2' }}>{cards[2] && renderCard(cards[2], 2)}</div>
          </div>
        );
      case 'asymmetric-4-box':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ gridColumn: 'span 1', gridRow: 'span 2', display: 'flex', height: '100%' }}>
              {cards[0] && renderCard({ ...cards[0], imgPosition: cards[0].imgPosition || 'background' }, 0)}
            </div>
            <div style={{ gridColumn: 'span 1' }}>{cards[1] && renderCard(cards[1], 1)}</div>
            <div style={{ gridColumn: 'span 1' }}>{cards[2] && renderCard(cards[2], 2)}</div>
            <div style={{ gridColumn: 'span 2' }}>{cards[3] && renderCard(cards[3], 3)}</div>
          </div>
        );
      case '3-columns':
      default:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {cards.map((c: any, idx: number) => renderCard(c, idx))}
          </div>
        );
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
            {title}
          </h2>
          {subtitle && <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, fontWeight: 500 }}>{subtitle}</p>}
        </div>
      )}
      {getGridLayout()}
    </div>
  );
};

/* 5. TESTIMONIALS Component */
const Testimonials: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const { title, subtitle, testimonials = [] } = block.content || {};
  const primary = theme.primaryColor || '#10B981';

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {(title || subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {title && (
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              fontSize: '0.92rem',
              color: '#64748b',
              margin: 0,
              fontWeight: 500
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
      }}>
        {testimonials.map((t: any, idx: number) => {
          const rating = t.rating || 5;
          const stars = Array.from({ length: 5 }, (_, i) => i < rating);
          return (
            <div
              key={t.id || idx}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 32px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
              }}
            >
              {/* Stars & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {stars.map((filled, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={filled ? primary : 'none'} stroke={filled ? primary : '#cbd5e1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                {t.date && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                    {t.date}
                  </span>
                )}
              </div>

              {/* Review Text */}
              <p style={{
                fontSize: '0.9rem',
                color: '#475569',
                lineHeight: 1.6,
                margin: 0,
                flex: 1,
                fontStyle: 'italic',
                fontWeight: 500,
              }}>
                "{t.text}"
              </p>

              {/* Reviewer Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                {t.avatarUrl ? (
                  <img
                    src={t.avatarUrl}
                    alt={t.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${primary}22`,
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${primary}15`,
                    color: primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    {t.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                    {t.name}
                  </span>
                  {t.role && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                      {t.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* 6. BEST_SELLERS Component */
const BestSellers: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const { title = 'Best Sellers', subtitle = 'Our most popular organic products', productIds = [] } = block.content || {};
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const fetchBestSellers = async () => {
      setLoading(true);
      try {
        const res = await catalogApi.getProducts({ limit: 100 });
        const allProds = res?.products || [];
        const filtered = productIds
          .map((id: string) => allProds.find((p: any) => p.id === id))
          .filter(Boolean);
        
        if (filtered.length === 0) {
          setProducts(allProds.slice(0, 5));
        } else {
          setProducts(filtered);
        }
      } catch (err) {
        console.error('Error fetching products for Best Sellers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBestSellers();
  }, [JSON.stringify(productIds)]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 270; // 250px width + 20px gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToCard = (idx: number) => {
    if (scrollRef.current) {
      const cardWidth = 270;
      scrollRef.current.scrollTo({
        left: idx * cardWidth,
        behavior: 'smooth'
      });
      setActiveDot(idx);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = 270;
      const scrollLeft = scrollRef.current.scrollLeft;
      const idx = Math.round(scrollLeft / cardWidth);
      setActiveDot(Math.min(products.length - 1, Math.max(0, idx)));
    }
  };

  const primary = theme.primaryColor || '#10B981';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #e5e7eb', borderTopColor: primary,
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      {(title || subtitle) && (
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          {title && (
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
              fontFamily: "'Outfit', sans-serif",
              textTransform: 'uppercase'
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              fontSize: '0.92rem',
              color: '#64748b',
              margin: 0,
              fontWeight: 500
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Slider view wrapper */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-16px',
            zIndex: 10,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0f172a',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Scrolling card track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            width: '100%',
            padding: '12px 4px 20px',
            boxSizing: 'border-box',
          }}
          className="hide-scrollbar"
        >
          {/* Inject dynamic styles to hide scrollbars */}
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>

          {products.map((p) => {
            const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url ||
              'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
            const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
            
            return (
              <div
                key={p.id}
                style={{
                  flex: '0 0 250px',
                  scrollSnapAlign: 'start',
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)';
                }}
              >
                {/* Image Aspect ratio 1 */}
                <div style={{ position: 'relative', aspectRatio: '1', width: '100%', borderRadius: '14px', overflow: 'hidden', background: '#f8fafc' }}>
                  <img src={coverImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {isOnSale && (
                    <span style={{
                      position: 'absolute', top: 8, left: 8,
                      background: '#EF4444', color: '#fff',
                      fontSize: '0.62rem', fontWeight: 700,
                      padding: '3px 8px', borderRadius: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>Sale</span>
                  )}
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#9ca3af', display: 'block',
                  }}>{p.category?.name || 'Skincare'}</span>
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    fontFamily: "'Outfit', sans-serif",
                    margin: 0,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as any,
                  }}>
                    {p.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: '4px' }}>
                    <span style={{ fontWeight: 800, color: primary, fontSize: '1rem' }}>₹{p.price}</span>
                    {isOnSale && <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{p.compare_price}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                  <button
                    style={{
                      background: primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    Add to Cart
                  </button>
                  <button
                    style={{
                      background: '#ffffff',
                      color: primary,
                      border: `1.5px solid ${primary}`,
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'background-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = primary;
                      (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
                      (e.currentTarget as HTMLButtonElement).style.color = primary;
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-16px',
            zIndex: 10,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0f172a',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Carousel dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToCard(idx)}
            style={{
              width: idx === activeDot ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === activeDot ? primary : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* 7. CATEGORIES_LIST Component */
const CategoriesList: React.FC<{ block: any; theme: any }> = ({ block, theme }) => {
  const { title = 'Product Categories', subtitle = 'Explore our curated collections', showViewAll = true } = block.content || {};
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await catalogApi.getCategories();
        setCategories(res || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = 270; // card width (250px) + gap (20px)
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToCard = (idx: number) => {
    if (scrollRef.current) {
      const cardWidth = 270;
      scrollRef.current.scrollTo({
        left: idx * cardWidth,
        behavior: 'smooth'
      });
      setActiveDot(idx);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = 270;
      const scrollLeft = scrollRef.current.scrollLeft;
      const idx = Math.round(scrollLeft / cardWidth);
      setActiveDot(Math.min(categories.length - 1, Math.max(0, idx)));
    }
  };

  const primary = theme.primaryColor || '#10B981';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #e5e7eb', borderTopColor: primary,
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', position: 'relative' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {title && (
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
              fontFamily: "'Outfit', sans-serif",
              textTransform: 'uppercase'
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              fontSize: '0.92rem',
              color: '#64748b',
              margin: 0,
              fontWeight: 500
            }}>
              {subtitle}
            </p>
          )}
          {showViewAll && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <a
                href="/categories"
                style={{
                  display: 'inline-block',
                  background: 'transparent',
                  border: `2px solid ${primary}`,
                  color: primary,
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = primary;
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = primary;
                }}
              >
                View All
              </a>
            </div>
          )}
        </div>

        {/* Side-by-side Navigation Arrows on the right */}
        <div style={{ display: 'flex', gap: '8px', position: 'absolute', right: 0, bottom: '10px' }}>
          <button
            onClick={() => scroll('left')}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slider view wrapper */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Scrolling card track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            width: '100%',
            padding: '12px 4px 20px',
            boxSizing: 'border-box',
          }}
          className="hide-scrollbar"
        >
          {categories.map((cat: any) => {
            const coverImage = cat.imageUrl || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
            return (
              <div
                key={cat.id}
                style={{
                  flex: '0 0 250px',
                  scrollSnapAlign: 'start',
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)';
                }}
              >
                {/* Image Aspect ratio 1 */}
                <div style={{ position: 'relative', aspectRatio: '1', width: '100%', borderRadius: '14px', overflow: 'hidden', background: '#f8fafc' }}>
                  <img src={coverImage} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: "'Outfit', sans-serif",
                    margin: 0,
                    lineHeight: 1.4,
                  }}>
                    {cat.name}
                  </h3>
                </div>

                {/* Action button */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
                  <a
                    href={`/categories/${cat.slug}`}
                    style={{
                      background: primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'opacity 0.2s',
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
                  >
                    Shop Now
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {categories.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToCard(idx)}
            style={{
              width: idx === activeDot ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === activeDot ? primary : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
