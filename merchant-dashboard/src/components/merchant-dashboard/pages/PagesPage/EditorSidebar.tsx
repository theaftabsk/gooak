import React, { useState } from 'react';
import { LivePageData, WidgetLayout, WidgetType } from '../../../../lib/types/page-builder';

interface EditorSidebarProps {
  layout: LivePageData;
  onChange: (layout: LivePageData) => void;
  categories: any[];
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ layout, onChange, categories }) => {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const updateTheme = (key: string, value: string) => {
    onChange({
      ...layout,
      theme: {
        ...layout.theme,
        [key]: value,
      },
    });
  };

  const addWidget = (type: WidgetType) => {
    const id = `widget-${Date.now()}`;
    const newWidget: WidgetLayout = {
      id,
      type,
      order: layout.widgets.length,
      styles: {
        paddingTop: '2rem',
        paddingBottom: '2rem',
      },
      content: type === 'HERO_BANNER' ? {
        title: 'New Hero Campaign',
        subtitle: 'Add subtitle here',
        backgroundImageUrl: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
      } : type === 'PRODUCT_GRID' ? {
        collectionId: categories?.[0]?.id || '',
        itemsPerPage: 4,
        showPrice: true,
      } : {
        title: 'Title of section',
        body: '<p>Edit paragraph text here...</p>',
      },
    } as any;

    onChange({
      ...layout,
      widgets: [...layout.widgets, newWidget],
    });
    setSelectedWidgetId(id);
  };

  const deleteWidget = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== id),
    });
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const moveWidget = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newWidgets = [...layout.widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    // Swap widgets
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    // Recalculate order indices
    newWidgets.forEach((w, idx) => {
      w.order = idx;
    });

    onChange({
      ...layout,
      widgets: newWidgets,
    });
  };

  const updateWidgetContent = (id: string, key: string, value: any) => {
    onChange({
      ...layout,
      widgets: layout.widgets.map(w => {
        if (w.id === id) {
          return {
            ...w,
            content: {
              ...(w.content as any),
              [key]: value,
            },
          };
        }
        return w;
      }) as any,
    });
  };

  const selectedWidget = layout.widgets.find(w => w.id === selectedWidgetId);

  return (
    <div className="flex flex-col gap-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      {/* 1. Global Themes Customizer */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Theme Overrides</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 text-center">
            <span className="text-xxs font-medium text-slate-500">Primary</span>
            <input 
              type="color" 
              value={layout.theme.primaryColor} 
              onChange={(e) => updateTheme('primaryColor', e.target.value)} 
              className="w-full h-8 cursor-pointer rounded border border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <span className="text-xxs font-medium text-slate-500">Secondary</span>
            <input 
              type="color" 
              value={layout.theme.secondaryColor} 
              onChange={(e) => updateTheme('secondaryColor', e.target.value)} 
              className="w-full h-8 cursor-pointer rounded border border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <span className="text-xxs font-medium text-slate-500">Background</span>
            <input 
              type="color" 
              value={layout.theme.backgroundColor} 
              onChange={(e) => updateTheme('backgroundColor', e.target.value)} 
              className="w-full h-8 cursor-pointer rounded border border-slate-200"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. Widgets Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Page Widgets</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => addWidget('HERO_BANNER')}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xxs font-semibold text-slate-600 rounded"
              title="Add Hero Banner"
            >
              + Hero
            </button>
            <button 
              onClick={() => addWidget('PRODUCT_GRID')}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xxs font-semibold text-slate-600 rounded"
              title="Add Product Grid"
            >
              + Products
            </button>
            <button 
              onClick={() => addWidget('TEXT_BLOCK')}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xxs font-semibold text-slate-600 rounded"
              title="Add Text Block"
            >
              + Text
            </button>
          </div>
        </div>

        {layout.widgets.length === 0 ? (
          <div className="text-center py-6 text-xxs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No widgets added to page layouts yet. Click buttons above to add.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {layout.widgets.map((w, idx) => (
              <div 
                key={w.id} 
                onClick={() => setSelectedWidgetId(w.id)}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors duration-150 ${selectedWidgetId === w.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-700">
                    {w.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">Order #{idx + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={idx === 0}
                    onClick={(e) => moveWidget(idx, 'up', e)}
                    className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-500"
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button 
                    disabled={idx === layout.widgets.length - 1}
                    onClick={(e) => moveWidget(idx, 'down', e)}
                    className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-500"
                    title="Move Down"
                  >
                    ▼
                  </button>
                  <button 
                    onClick={(e) => deleteWidget(w.id, e)}
                    className="p-1 hover:bg-red-50 text-red-500 rounded"
                    title="Remove Widget"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Selected Widget Field Configuration */}
      {selectedWidget && (
        <>
          <hr className="border-slate-100" />
          <div className="flex flex-col gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-1">
              Configure {selectedWidget.type.replace('_', ' ')} Settings
            </h4>

            {selectedWidget.type === 'HERO_BANNER' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Heading Title</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).title || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'title', e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Subtitle</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).subtitle || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'subtitle', e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Background Image URL</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).backgroundImageUrl || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'backgroundImageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Button CTA Label</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).buttonText || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'buttonText', e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Button link</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).buttonLink || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'buttonLink', e.target.value)}
                    placeholder="/products or /about"
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {selectedWidget.type === 'PRODUCT_GRID' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Category Filter</label>
                  <select 
                    value={(selectedWidget.content as any).collectionId || ''}
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'collectionId', e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- All Categories --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Items Limit Count</label>
                  <input 
                    type="number" 
                    value={(selectedWidget.content as any).itemsPerPage || 4} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'itemsPerPage', parseInt(e.target.value) || 4)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {selectedWidget.type === 'TEXT_BLOCK' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Block Header Title</label>
                  <input 
                    type="text" 
                    value={(selectedWidget.content as any).title || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'title', e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-600">Paragraph Content (HTML allowed)</label>
                  <textarea 
                    value={(selectedWidget.content as any).body || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'body', e.target.value)}
                    rows={4}
                    className="p-2 border border-slate-200 rounded outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
