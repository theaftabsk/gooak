import React from 'react';
import { LivePageData, WidgetLayout, WidgetType } from '@oak-commerce/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface EditorSidebarProps {
  layout: LivePageData;
  onChange: (layout: LivePageData) => void;
  categories: any[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  layout,
  onChange,
  categories,
  selectedWidgetId,
  onSelectWidget,
}) => {
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
    onSelectWidget(id);
  };

  const deleteWidget = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== id),
    });
    if (selectedWidgetId === id) onSelectWidget(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...layout.widgets];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Recalculate order indices
    items.forEach((w, idx) => {
      w.order = idx;
    });

    onChange({
      ...layout,
      widgets: items,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] lg:h-[650px] bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-y-auto">
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

      <hr className="border-slate-100 my-4" />

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
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="widgets-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1"
                >
                  {layout.widgets.map((w, idx) => (
                    <Draggable key={w.id} draggableId={w.id} index={idx}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onSelectWidget(w.id)}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors duration-150 ${
                            selectedWidgetId === w.id 
                              ? 'border-emerald-500 bg-emerald-50/20' 
                              : 'border-slate-200 hover:bg-slate-50'
                          } ${snapshot.isDragging ? 'shadow-md border-emerald-300 bg-emerald-50/10' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 select-none text-xs">☰</span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-700">
                                {w.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">Order #{idx + 1}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => deleteWidget(w.id, e)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded"
                              title="Remove Widget"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};
