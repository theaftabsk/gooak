import React from 'react';
import { LivePageData, WidgetLayout } from '@oak-commerce/types';
import { Input } from 'shared-ui';

interface SettingsPanelProps {
  layout: LivePageData;
  onChange: (layout: LivePageData) => void;
  categories: any[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  layout,
  onChange,
  categories,
  selectedWidgetId,
  onSelectWidget,
}) => {
  const selectedWidget = layout.widgets.find(w => w.id === selectedWidgetId);

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

  const deleteWidget = (id: string) => {
    onChange({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== id),
    });
    onSelectWidget(null);
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] lg:h-[650px] bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-y-auto">
      {selectedWidget ? (
        <div className="flex flex-col gap-5 h-full">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Widget</span>
              <h4 className="text-sm font-black text-slate-800">
                {selectedWidget.type.replace('_', ' ')}
              </h4>
            </div>
            <button 
              onClick={() => onSelectWidget(null)}
              className="text-slate-400 hover:text-slate-600 font-semibold text-sm"
              title="Close Settings"
            >
              ✕
            </button>
          </div>

          {/* Form Configuration Inputs */}
          <div className="flex-1 flex flex-col gap-4">
            {selectedWidget.type === 'HERO_BANNER' && (
              <div className="flex flex-col gap-3">
                <Input 
                  label="Heading Title"
                  value={(selectedWidget.content as any).title || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'title', e.target.value)}
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
                <Input 
                  label="Subtitle"
                  value={(selectedWidget.content as any).subtitle || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'subtitle', e.target.value)}
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
                <Input 
                  label="Background Image URL"
                  value={(selectedWidget.content as any).backgroundImageUrl || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'backgroundImageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
                <Input 
                  label="Button CTA Label"
                  value={(selectedWidget.content as any).buttonText || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'buttonText', e.target.value)}
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
                <Input 
                  label="Button link"
                  value={(selectedWidget.content as any).buttonLink || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'buttonLink', e.target.value)}
                  placeholder="/products or /about"
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
              </div>
            )}

            {selectedWidget.type === 'PRODUCT_GRID' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category Filter</label>
                  <select 
                    value={(selectedWidget.content as any).collectionId || ''}
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'collectionId', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
                  >
                    <option value="">-- All Categories --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Input 
                  label="Items Limit Count"
                  type="number"
                  value={(selectedWidget.content as any).itemsPerPage || 4} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'itemsPerPage', parseInt(e.target.value) || 4)}
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
              </div>
            )}

            {selectedWidget.type === 'TEXT_BLOCK' && (
              <div className="flex flex-col gap-3">
                <Input 
                  label="Block Header Title"
                  value={(selectedWidget.content as any).title || ''} 
                  onChange={(e) => updateWidgetContent(selectedWidget.id, 'title', e.target.value)}
                  className="!border-slate-200 focus:!ring-emerald-500"
                />
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Paragraph Content (HTML allowed)</label>
                  <textarea 
                    value={(selectedWidget.content as any).body || ''} 
                    onChange={(e) => updateWidgetContent(selectedWidget.id, 'body', e.target.value)}
                    rows={8}
                    className="flex w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delete Action (Footer) */}
          <div className="pt-4 border-t border-slate-100 mt-auto">
            <button 
              onClick={() => deleteWidget(selectedWidget.id)}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors border border-red-100"
            >
              🗑️ Remove Section
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-full py-16 text-slate-400">
          <span className="text-3xl mb-3">⚙️</span>
          <h4 className="font-bold text-slate-700 text-sm mb-1">No Section Selected</h4>
          <p className="text-xxs leading-relaxed max-w-[200px]">
            Select a widget in the left sections tree to configure its settings.
          </p>
        </div>
      )}
    </div>
  );
};
