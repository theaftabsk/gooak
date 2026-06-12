import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi, pageBuilderApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { WidgetRenderer } from '../../WidgetRenderer';
import { useCart } from '../../context/CartContext';

export const Product: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme, cssVariables } = usePageTheme('product');
  const { addToCart } = useCart();
  
  const [pageData, setPageData] = useState<any | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // 1. Fetch layout config (to check for Hero banner)
    pageBuilderApi.getPageBySlug('product').then(setPageData).catch(() => {});

    // 2. Fetch product details
    const loadDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const prod = await catalogApi.getProduct(slug);
        setProduct(prod || null);
        
        // Setup initial image
        const cover = prod?.gallery?.find((g: any) => g.is_cover)?.url || prod?.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
        setActiveImage(cover);

        // Setup variants
        if (prod?.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
          if (prod.variants[0].image_url) {
            setActiveImage(prod.variants[0].image_url);
          }
        }
      } catch (err) {
        console.error('Error fetching storefront product:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [slug]);

  const handleVariantSelect = (v: any) => {
    setSelectedVariant(v);
    if (v.image_url) {
      setActiveImage(v.image_url);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Fallback if no variants
    const itemId = product.id;
    const variantId = selectedVariant ? selectedVariant.id : `default-${product.id}`;
    const variantLabel = selectedVariant ? selectedVariant.label || '' : '';
    const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const imageUrl = selectedVariant?.image_url || product.gallery?.find((g: any) => g.is_cover)?.url || product.gallery?.[0]?.url || '';

    addToCart({
      id: itemId,
      variantId,
      name: product.name,
      variantLabel,
      price,
      imageUrl,
    }, qty);

    setSuccessMsg('🛒 Added to cart!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 border-gray-200" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-slate-50">
        <span className="text-4xl mb-4">🔍</span>
        <h1 className="text-xl font-bold text-slate-800">Product Not Found</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm">Back to Shop</Link>
      </div>
    );
  }

  const heroWidgets = pageData?.widgets?.filter((w: any) => w.type === 'HERO_BANNER') || [];
  
  // Calculate pricing coordinates
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const comparePrice = selectedVariant ? selectedVariant.compare_price : product.compare_price;
  const inStock = selectedVariant ? selectedVariant.stock_qty > 0 : true;

  return (
    <div style={cssVariables} className="min-h-screen pb-20">
      {/* 1. Editable Hero Banner */}
      {heroWidgets.length > 0 && <WidgetRenderer widgets={heroWidgets} theme={theme} />}

      {/* 2. Product Information Panel */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Images Section */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {product.gallery.map((img: any) => (
                  <button 
                    key={img.id} 
                    onClick={() => setActiveImage(img.url)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-50 flex-shrink-0 transition ${activeImage === img.url ? 'border-emerald-600' : 'border-slate-100'}`}
                  >
                    <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="text-left flex flex-col gap-6">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                {product.category?.name || 'Skincare Collection'}
              </span>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-1 mb-2">
                {product.name}
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">{product.short_desc}</p>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 border-y border-slate-100 py-4">
              <span className="text-3xl font-black text-slate-900">₹{displayPrice}</span>
              {comparePrice && Number(comparePrice) > Number(displayPrice) && (
                <>
                  <span className="text-base text-slate-400 line-through">₹{comparePrice}</span>
                  <span className="bg-red-50 text-red-600 font-bold text-xxs px-2 py-0.5 rounded-md uppercase">
                    Save {Math.round(((Number(comparePrice) - Number(displayPrice)) / Number(comparePrice)) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Variation Selection (if any) */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Variant</span>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className={`px-4 py-2 border rounded-xl font-bold text-xs transition ${selectedVariant?.id === v.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:border-slate-400'}`}
                    >
                      {v.label || v.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector and CTA Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3.5 py-2 hover:bg-slate-50 font-bold text-slate-500 transition"
                >
                  -
                </button>
                <span className="px-4 py-2 font-bold text-slate-800 text-sm w-12 text-center">{qty}</span>
                <button 
                  onClick={() => setQty(q => q + 1)}
                  className="px-3.5 py-2 hover:bg-slate-50 font-bold text-slate-500 transition"
                >
                  +
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {successMsg && (
              <div className="text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                {successMsg}
              </div>
            )}

            {/* Long Description */}
            <div className="mt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              <div 
                className="text-slate-600 text-sm leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: product.description || 'No description coordinates provided.' }}
              />
            </div>

            {/* Product Details Table */}
            {product.master_sku && (
              <div className="border-t border-slate-100 pt-6 mt-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Specifications</span>
                <table className="w-full text-xs text-slate-600">
                  <tbody>
                    <tr className="border-b border-slate-100 pb-2">
                      <td className="py-2 text-slate-400 font-medium">Master SKU</td>
                      <td className="py-2 font-bold text-right">{product.master_sku}</td>
                    </tr>
                    {selectedVariant && (
                      <tr className="border-b border-slate-100 pb-2">
                        <td className="py-2 text-slate-400 font-medium">Selected SKU</td>
                        <td className="py-2 font-bold text-right">{selectedVariant.sku}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 text-slate-400 font-medium">Availability</td>
                      <td className="py-2 font-bold text-right text-emerald-600">{inStock ? 'In Stock' : 'Out of Stock'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
