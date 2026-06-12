import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi, pageBuilderApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { WidgetRenderer } from '../../WidgetRenderer';

export const Categories: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const { theme, cssVariables } = usePageTheme('category');
  const [pageData, setPageData] = useState<any | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch layout config (to check for Hero banner)
    pageBuilderApi.getPageBySlug('category').then(setPageData).catch(() => {});

    // 2. Fetch categories tree
    const loadCategories = async () => {
      setLoading(true);
      try {
        const cats = await catalogApi.getCategories();
        setCategories(cats || []);

        if (categorySlug) {
          const active = cats.find((c: any) => c.slug === categorySlug);
          setActiveCategory(active || null);

          // Fetch products under active category
          const prodRes = await catalogApi.getProducts({
            category_slug: categorySlug,
          });
          setProducts(prodRes?.products || []);
        } else {
          setActiveCategory(null);
          // Fetch all products if no category slug specified
          const prodRes = await catalogApi.getProducts();
          setProducts(prodRes?.products || []);
        }
      } catch (err) {
        console.error('Error fetching categories page details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [categorySlug]);

  const heroWidgets = pageData?.widgets?.filter((w: any) => w.type === 'HERO_BANNER') || [];

  return (
    <div style={cssVariables} className="min-h-screen pb-16">
      {/* 1. Editable Hero Banner */}
      {heroWidgets.length > 0 ? (
        <WidgetRenderer widgets={heroWidgets} theme={theme} />
      ) : (
        <div className="bg-slate-50 border-b border-slate-100 py-16 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
              {activeCategory ? activeCategory.name : 'Collections'}
            </h1>
            <p className="text-slate-500 text-sm">
              {activeCategory ? `Browse products under the ${activeCategory.name} category.` : 'Explore our collection groups by category.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Collection Layout Workspace */}
      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        
        {/* Left Side: Category Navigator */}
        <aside className="flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">All Collections</h3>
            <div className="flex flex-col gap-1.5 font-semibold text-slate-600 text-sm">
              <Link 
                to="/categories" 
                className={`p-2.5 rounded-xl transition ${!activeCategory ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'}`}
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className={`p-2.5 rounded-xl transition ${activeCategory?.id === cat.id ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Products Grid */}
        <main>
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 border-gray-200" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <span className="text-3xl mb-3 block">🛍️</span>
              <h3 className="font-bold text-slate-700">No Products Found</h3>
              <p className="text-slate-400 text-xs mt-1">We couldn't find any products in this collection.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{products.length} Products Found</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => {
                  const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
                  return (
                    <div 
                      key={p.id}
                      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                    >
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

                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{p.category?.name || 'Category'}</span>
                        <h3 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-slate-900 text-sm">₹{p.price}</span>
                            {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                              <span className="text-xxs text-slate-400 line-through">₹{p.compare_price}</span>
                            )}
                          </div>
                          <a 
                            href={`/products/${p.slug}`}
                            className="text-[10px] font-black uppercase tracking-wider transition-colors duration-150 hover:underline"
                            style={{ color: theme.primaryColor }}
                          >
                            View Details →
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
