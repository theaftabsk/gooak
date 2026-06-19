import React, { useState } from 'react';
import { catalogApi } from '../../../../lib/api-client';

interface ThemesPageProps {
  shopInfo: any;
  onThemeChange: () => Promise<void>;
}

interface ThemeMetadata {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

interface IndustryMetadata {
  id: string;
  name: string;
  icon: string;
  description: string;
  themes: ThemeMetadata[];
}

const INDUSTRIES: IndustryMetadata[] = [
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    icon: '👕',
    description: 'Perfect for clothing brands, luxury boutique apparel, and modern streetwear collections.',
    themes: [
      {
        id: 'classic',
        name: 'Fashion Classic',
        tagline: 'Timeless Style & Classic Cuts',
        description: 'Sophisticated layout styled with elegant serif typography and cozy sand-toned backgrounds.',
        primaryColor: '#1E293B',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F9F6F0',
        fontFamily: 'Playfair Display, serif',
      },
      {
        id: 'modern',
        name: 'Fashion Modern',
        tagline: 'Urban Vibe Collection',
        description: 'Vibrant and clean design featuring bold hot pink highlights and sleek modern elements.',
        primaryColor: '#0F172A',
        secondaryColor: '#EC4899',
        backgroundColor: '#FAF9F6',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'luxury',
        name: 'Fashion Luxury',
        tagline: 'Exquisite Haute Couture',
        description: 'Artisanal high-fashion boutique styling with gold accents and high contrast branding.',
        primaryColor: '#111827',
        secondaryColor: '#D97706',
        backgroundColor: '#FCFBF7',
        fontFamily: 'Cinzel, serif',
      },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    icon: '📱',
    description: 'Engineered for smartphone tech, custom gaming hardware, and audio equipment stores.',
    themes: [
      {
        id: 'dark',
        name: 'Tech Cyber Dark',
        tagline: 'Next-Gen Cyber Space Tech',
        description: 'Immersive deep dark cyberpunk aesthetic with high-visibility blue and green neon elements.',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        backgroundColor: '#0B0F19',
        fontFamily: 'Orbitron, sans-serif',
      },
      {
        id: 'modern',
        name: 'Tech Modern',
        tagline: 'Smart Automation Hub',
        description: 'Minimalist smart living hub template utilizing deep indigo tones and soft page contrasts.',
        primaryColor: '#4F46E5',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'premium',
        name: 'Tech Premium',
        tagline: 'High-Fidelity Sound Systems',
        description: 'Clean studio acoustics styling featuring rich purple colorways and spacious layouts.',
        primaryColor: '#1F2937',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#F3F4F6',
        fontFamily: 'Outfit, sans-serif',
      },
    ],
  },
  {
    id: 'grocery',
    name: 'Grocery & Organic Fresh',
    icon: '🥬',
    description: 'Designed for organic farms, fresh supermarkets, and bulk B2B commercial distribution.',
    themes: [
      {
        id: 'fresh',
        name: 'Fresh Harvest',
        tagline: 'Farm Fresh Organic Harvest',
        description: 'Friendly, rounded layout featuring bright green accents and clean farm-to-table imagery.',
        primaryColor: '#16A34A',
        secondaryColor: '#F59E0B',
        backgroundColor: '#F4FBF7',
        fontFamily: 'Quicksand, sans-serif',
      },
      {
        id: 'organic',
        name: 'Certified Organic',
        tagline: '100% Certified Organic Foods',
        description: 'Clean eco-conscious layout emphasizing purity, chemical-free living, and organic certifications.',
        primaryColor: '#15803D',
        secondaryColor: '#10B981',
        backgroundColor: '#FAFDFB',
        fontFamily: 'Outfit, sans-serif',
      },
      {
        id: 'wholesale',
        name: 'Bulk Wholesale',
        tagline: 'Bulk Wholesale Groceries',
        description: 'B2B distributor focus layout optimized for clear logistics and competitive bulk volume orders.',
        primaryColor: '#166534',
        secondaryColor: '#D97706',
        backgroundColor: '#F5F5F4',
        fontFamily: 'Inter, sans-serif',
      },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Cafe',
    icon: '🍔',
    description: 'Vibrant foodie aesthetics for fine dining rooms, gourmet bistros, and local coffee cafes.',
    themes: [
      {
        id: 'gourmet',
        name: 'Gourmet Fine Dining',
        tagline: 'Masterfully Crafted Gourmet Cuisine',
        description: 'High-class Michelin dining experience showcasing rich warm orange hues and classy serif details.',
        primaryColor: '#EA580C',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FFF7ED',
        fontFamily: 'Merriweather, serif',
      },
      {
        id: 'fastfood',
        name: 'Fast Food Favorites',
        tagline: 'Sizzling Burgers & Hot Crispy Fries',
        description: 'High-energy fast casual layout using bold primary red/yellow accents to spark appetite.',
        primaryColor: '#DC2626',
        secondaryColor: '#EAB308',
        backgroundColor: '#FFFBEB',
        fontFamily: 'Impact, sans-serif',
      },
      {
        id: 'cafe',
        name: 'Boutique Cafe',
        tagline: 'Freshly Roasted Specialty Coffee',
        description: 'Warm espresso tones and cozy cafe vibes with clean readable typography and rich backgrounds.',
        primaryColor: '#78350F',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FAF6F0',
        fontFamily: 'Quicksand, sans-serif',
      },
    ],
  },
  {
    id: 'furniture',
    name: 'Furniture & Decor',
    icon: '🛋',
    description: 'Tailored for minimalist interior design houses, vintage woodworkers, and luxury homeware.',
    themes: [
      {
        id: 'minimalist',
        name: 'Modern Minimalist',
        tagline: 'Minimalist Wooden Living Space',
        description: 'Understated wooden tone palettes optimized for modular room styling and geometric structure.',
        primaryColor: '#78350F',
        secondaryColor: '#F59E0B',
        backgroundColor: '#FAF7F5',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'vintage',
        name: 'Heritage Vintage',
        tagline: 'Crafted Vintage Furniture',
        description: 'Deep mahogany tones highlighting solid oak/teak joinery and rich legacy woodworking styles.',
        primaryColor: '#451A03',
        secondaryColor: '#D97706',
        backgroundColor: '#FBF9F6',
        fontFamily: 'Lora, serif',
      },
      {
        id: 'luxury',
        name: 'Luxe Home Decor',
        tagline: 'Luxury Velvet Seating',
        description: 'Premium textures with elegant velvet styles, gold accents, and white-glove logistics.',
        primaryColor: '#1F2937',
        secondaryColor: '#D97706',
        backgroundColor: '#F9FAF8',
        fontFamily: 'Playfair Display, serif',
      },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty & Skincare',
    icon: '💄',
    description: 'Stunning layouts for organic botanical skincare, luxury serums, and high-pigment professional glam.',
    themes: [
      {
        id: 'organic',
        name: 'Botanical Organic',
        tagline: '100% Organic Beauty Oils',
        description: 'Soft rose tones and organic mint greens highlighting clean ingredients and paraben-free glow.',
        primaryColor: '#BE185D',
        secondaryColor: '#10B981',
        backgroundColor: '#FFF1F2',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'luxury',
        name: 'Elite Skincare',
        tagline: 'Premium Anti-Aging Serum',
        description: 'Sophisticated biotech beauty layout featuring deep rose hues and elegant cell-radiance styling.',
        primaryColor: '#831843',
        secondaryColor: '#D97706',
        backgroundColor: '#FDF8F7',
        fontFamily: 'Lora, serif',
      },
      {
        id: 'glam',
        name: 'Pro Glam Makeup',
        tagline: 'High-Pigment Glam Palette',
        description: 'Vibrant hot pink performance palettes made for professional studio artists and camera-ready glam.',
        primaryColor: '#BE185D',
        secondaryColor: '#EC4899',
        backgroundColor: '#FFF5F7',
        fontFamily: 'Outfit, sans-serif',
      },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Health & Pharmacy',
    icon: '💊',
    description: 'Clinical trust layouts for OTC diagnostics, daily wellness vitamins, and express family care.',
    themes: [
      {
        id: 'clinical',
        name: 'Clinical Care',
        tagline: 'Trusted OTC Meds & Diagnostics',
        description: 'Professional medical cyan layouts showcasing absolute trust and certified warehouse storage.',
        primaryColor: '#0891B2',
        secondaryColor: '#059669',
        backgroundColor: '#F0FDFA',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'wellness',
        name: 'Daily Wellness',
        tagline: 'Daily Vitamins & Dietary Supplements',
        description: 'Bright energizing teal colorways designed around active lifestyles and clean dietary supplements.',
        primaryColor: '#0D9488',
        secondaryColor: '#EAB308',
        backgroundColor: '#F0FDF4',
        fontFamily: 'Outfit, sans-serif',
      },
      {
        id: 'express',
        name: 'First Aid Express',
        tagline: 'First Aid & Family Relief Express',
        description: 'High contrast safety-blue and emergency-red layouts for rapid delivery and first aid kits.',
        primaryColor: '#2563EB',
        secondaryColor: '#EF4444',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      },
    ],
  },
  {
    id: 'petstore',
    name: 'Pet Supplies',
    icon: '🐾',
    description: 'Friendly, playful designs for interactive toys, vet-certified nutrition, and compostable accessories.',
    themes: [
      {
        id: 'playful',
        name: 'Playful Pets',
        tagline: 'Interactive Toys & Tasty Chews',
        description: 'Vibrant amber and royal blue colors with friendly rounded typography for happy tail-waggers.',
        primaryColor: '#D97706',
        secondaryColor: '#2563EB',
        backgroundColor: '#FEF3C7',
        fontFamily: 'Quicksand, sans-serif',
      },
      {
        id: 'premium',
        name: 'Premium Vet Nutrition',
        tagline: 'Premium Grain-Free Pet Nutrition',
        description: 'Deep navy palettes denoting premium nutritional value and vet-formulated kibbles.',
        primaryColor: '#1E293B',
        secondaryColor: '#D97706',
        backgroundColor: '#FAFAF7',
        fontFamily: 'Inter, sans-serif',
      },
      {
        id: 'nature',
        name: 'Eco Nature Pets',
        tagline: 'Biodegradable Pet Accessories',
        description: 'Forest greens and wood tones presenting sustainable hemp collars and organic pet accessories.',
        primaryColor: '#16A34A',
        secondaryColor: '#D97706',
        backgroundColor: '#F0FDF4',
        fontFamily: 'Outfit, sans-serif',
      },
    ],
  },
];

export const ThemesPage: React.FC<ThemesPageProps> = ({ shopInfo, onThemeChange }) => {
  const currentIndustry = shopInfo?.theme_industry || 'fashion';
  const currentStyle = shopInfo?.theme_style || 'classic';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [switchingTheme, setSwitchingTheme] = useState<{ industry: string; theme: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ industry: string; theme: string; name: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleActivateTheme = async (industry: string, theme: string, themeName: string) => {
    setSwitchingTheme({ industry, theme });
    setSuccessMessage(null);
    try {
      await catalogApi.switchMerchantTheme({ industry, theme });
      await onThemeChange();
      setSuccessMessage(`Theme "${themeName}" activated successfully! Your storefront is now updated.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Failed to switch store theme. Please try again.');
    } finally {
      setSwitchingTheme(null);
      setShowConfirmModal(null);
    }
  };

  const filteredIndustries = activeCategory === 'all' 
    ? INDUSTRIES 
    : INDUSTRIES.filter(ind => ind.id === activeCategory);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Dynamic font loading */}
      <link 
        rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;600;700&family=Lora:ital,wght@0,500;0,700;1,400&family=Merriweather:wght@400;700&family=Orbitron:wght@700&family=Outfit:wght@600;800&family=Playfair+Display:ital,wght@0,600;1,500&family=Quicksand:wght@600;700&display=swap" 
      />

      <style>{`
        .themes-header {
          margin-bottom: 28px;
        }
        .themes-category-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 30px;
          padding: 8px;
          background: var(--m-card);
          border: 1px solid var(--m-border);
          border-radius: 12px;
        }
        .themes-category-btn {
          padding: 8px 16px;
          border: none;
          background: none;
          border-radius: 8px;
          color: var(--m-text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .themes-category-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--m-text-main);
        }
        .themes-category-btn.active {
          background: var(--m-primary-light);
          color: var(--m-primary);
        }
        .industry-section {
          margin-bottom: 45px;
        }
        .industry-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--m-text-main);
          margin: 0 0 8px 0;
        }
        .industry-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--m-border);
          border-radius: 8px;
          font-size: 1.1rem;
        }
        .industry-desc {
          font-size: 0.88rem;
          color: var(--m-text-muted);
          margin: 0 0 20px 0;
          max-width: 800px;
        }
        .themes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .theme-card {
          background: var(--m-card);
          border: 1px solid var(--m-border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          position: relative;
        }
        .theme-card:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .theme-card.active {
          border-color: var(--m-primary);
          box-shadow: 0 0 0 1px var(--m-primary);
        }
        .active-tag {
          position: absolute;
          top: 14px;
          right: 14px;
          background: var(--m-primary);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
          z-index: 2;
        }
        .theme-preview-box {
          height: 150px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
          overflow: hidden;
          border-bottom: 1px solid var(--m-border);
        }
        .theme-preview-bg {
          position: absolute;
          inset: 0;
          opacity: 0.9;
          transition: all 0.3s ease;
        }
        .theme-card:hover .theme-preview-bg {
          transform: scale(1.03);
        }
        .theme-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.85) 100%);
          z-index: 1;
        }
        .theme-preview-title {
          position: relative;
          z-index: 2;
          color: #fff;
          font-weight: 800;
          font-size: 1.15rem;
          margin-bottom: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .theme-preview-tagline {
          position: relative;
          z-index: 2;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.78rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .theme-details {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }
        .theme-description {
          font-size: 0.82rem;
          color: var(--m-text-muted);
          line-height: 1.5;
        }
        .theme-metadata-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px dashed var(--m-border);
        }
        .swatch-label {
          font-size: 0.72rem;
          color: var(--m-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .color-swatches {
          display: flex;
          gap: 6px;
        }
        .color-swatch-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        .font-badge {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--m-border);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          color: var(--m-text-main);
          font-weight: 500;
        }
        .theme-action-btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .theme-action-btn.active-btn {
          background: transparent;
          border: 1px solid #10B981;
          color: #10B981;
          cursor: default;
        }
        .theme-action-btn.activate-btn {
          background: var(--m-primary-light);
          border: 1px solid transparent;
          color: var(--m-primary);
        }
        .theme-action-btn.activate-btn:hover {
          background: var(--m-primary);
          color: #fff;
          transform: translateY(-1px);
        }
        .success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          border-radius: 10px;
          color: #15803D;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 24px;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        /* Custom modal styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .modal-content {
          background: #111827;
          border: 1px solid var(--m-border);
          border-radius: 16px;
          padding: 24px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px 0;
        }
        .modal-desc {
          font-size: 0.85rem;
          color: var(--m-text-muted);
          line-height: 1.5;
          margin: 0 0 20px 0;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-cancel {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--m-border);
          color: var(--m-text-main);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-cancel:hover {
          background: rgba(255,255,255,0.06);
        }
        .btn-confirm {
          background: #3B82F6;
          border: 1px solid transparent;
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-confirm:hover {
          background: #2563EB;
        }
      `}</style>

      {/* Page Header */}
      <header className="themes-header">
        <h2>Store Themes Gallery</h2>
        <p className="header-sub">
          Select an industry layout preset to apply coordinated styles, color palettes, default typography, and homepage layouts.
        </p>
      </header>

      {/* Success banner */}
      {successMessage && (
        <div className="success-banner">
          <span style={{ fontSize: '1.2rem' }}>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Category selector */}
      <div className="themes-category-bar">
        <button 
          className={`themes-category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Industries
        </button>
        {INDUSTRIES.map(ind => (
          <button
            key={ind.id}
            className={`themes-category-btn ${activeCategory === ind.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(ind.id)}
          >
            {ind.icon} {ind.name}
          </button>
        ))}
      </div>

      {/* Industries list */}
      {filteredIndustries.map(ind => (
        <div key={ind.id} className="industry-section">
          <h3 className="industry-title">
            <span className="industry-icon">{ind.icon}</span>
            <span>{ind.name}</span>
          </h3>
          <p className="industry-desc">{ind.description}</p>

          <div className="themes-grid">
            {ind.themes.map(theme => {
              const isActive = currentIndustry === ind.id && currentStyle === theme.id;
              const isSwitching = switchingTheme?.industry === ind.id && switchingTheme?.theme === theme.id;

              return (
                <div key={theme.id} className={`theme-card ${isActive ? 'active' : ''}`}>
                  {isActive && <span className="active-tag">ACTIVE THEME</span>}
                  
                  {/* Visual Swatch Preview Box */}
                  <div className="theme-preview-box">
                    <div 
                      className="theme-preview-bg" 
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.backgroundColor} 100%)` 
                      }} 
                    />
                    <div className="theme-preview-overlay" />
                    <span className="theme-preview-title" style={{ fontFamily: theme.fontFamily }}>
                      {theme.name}
                    </span>
                    <span className="theme-preview-tagline">
                      "{theme.tagline}"
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="theme-details">
                    <p className="theme-description">
                      {theme.description}
                    </p>

                    {/* Details and Palette dots */}
                    <div className="theme-metadata-row">
                      <div>
                        <div className="swatch-label">Color Swatches</div>
                        <div className="color-swatches">
                          <span 
                            className="color-swatch-dot" 
                            style={{ backgroundColor: theme.primaryColor }}
                            title={`Primary: ${theme.primaryColor}`}
                          />
                          <span 
                            className="color-swatch-dot" 
                            style={{ backgroundColor: theme.secondaryColor }}
                            title={`Secondary: ${theme.secondaryColor}`}
                          />
                          <span 
                            className="color-swatch-dot" 
                            style={{ backgroundColor: theme.backgroundColor }}
                            title={`Background: ${theme.backgroundColor}`}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="swatch-label">Typography</div>
                        <span className="font-badge" style={{ fontFamily: theme.fontFamily }}>
                          {theme.fontFamily.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Button trigger */}
                    {isActive ? (
                      <button className="theme-action-btn active-btn" disabled>
                        <span>✓ Active &amp; Live</span>
                      </button>
                    ) : (
                      <button 
                        className="theme-action-btn activate-btn"
                        onClick={() => setShowConfirmModal({
                          industry: ind.id,
                          theme: theme.id,
                          name: theme.name
                        })}
                        disabled={switchingTheme !== null}
                      >
                        {isSwitching ? 'Activating Theme…' : 'Activate Theme'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-title">Switch to {showConfirmModal.name}?</h4>
            <p className="modal-desc">
              Are you sure you want to activate this layout? Switching themes will apply the new styling palette, global fonts, and **reset your homepage layout widgets** to their default theme configurations.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowConfirmModal(null)}
                disabled={switchingTheme !== null}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => handleActivateTheme(showConfirmModal.industry, showConfirmModal.theme, showConfirmModal.name)}
                disabled={switchingTheme !== null}
              >
                {switchingTheme ? 'Switching…' : 'Yes, Switch Theme'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
