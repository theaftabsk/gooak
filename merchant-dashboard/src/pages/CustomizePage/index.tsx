'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { merchantApi, storefrontApi } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionType = 'hero' | 'rich_text' | 'image_text' | 'cards' | 'cta' | 'contact_form' | 'announcement_bar' | 'banner_slider' | 'categories_carousel' | 'products_grid' | 'features_strip' | 'about_section';

interface Section {
  type: SectionType;
  data: Record<string, any>;
}

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  sections: Section[] | null;
  draft_sections: Section[] | null;
}

const SECTION_LABELS: Record<SectionType, string> = {
  hero: '🖼 Hero Banner',
  rich_text: '📝 Rich Text',
  image_text: '🖼 Image + Text',
  cards: '🃏 Cards',
  cta: '📣 Call to Action',
  contact_form: '📬 Contact Form',
  announcement_bar: '📢 Announcement Bar',
  banner_slider: '🎠 Banner Slider',
  categories_carousel: '🗂 Categories Carousel',
  products_grid: '🛍 Products Grid',
  features_strip: '⭐ Features Strip',
  about_section: '🏢 About Section',
};

const DEFAULT_SECTION_DATA: Record<SectionType, Record<string, any>> = {
  hero: { title: 'New Section', subtitle: '', bg_image: '', button_label: '', button_url: '' },
  rich_text: { title: '', html: '<p>Your content here…</p>' },
  image_text: { title: '', text: '', image_url: '', image_side: 'right' },
  cards: { title: '', items: [{ icon: '⭐', title: 'Card Title', text: 'Card description.' }] },
  cta: { title: 'Take Action', subtitle: '', button_label: 'Get Started', button_url: '/products', bg_color: '', button2_label: '', button2_url: '' },
  contact_form: { title: 'Contact Us', subtitle: '' },
  announcement_bar: { text: '🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500', active: true },
  banner_slider: { banners: [] },
  categories_carousel: { badge: 'Collections', title: 'Product Categories' },
  products_grid: { badge: '', title: 'Products', subtitle: '', limit: 8, view_all_url: '/products', view_all_label: 'VIEW ALL →', columns: 4 },
  features_strip: { items: [] },
  about_section: { title: 'About Us', content: '', tagline: '', button_label: 'Learn More', button_url: '/about', values: [] },
};

// ── Draggable item list ────────────────────────────────────────────────────────

function DraggableItemList({ items, onChange, renderItem }: {
  items: any[];
  onChange: (items: any[]) => void;
  renderItem: (item: any, update: (u: any) => void, remove: () => void, index: number, isExpanded: boolean, toggle: () => void) => React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  return (
    <>
      {items.map((item, i) => (
        <div key={i}
          draggable
          onDragStart={() => { dragRef.current = i; }}
          onDragOver={e => { e.preventDefault(); setDragOver(i); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => {
            const from = dragRef.current;
            if (from === null || from === i) { setDragOver(null); return; }
            const next = [...items];
            const [moved] = next.splice(from, 1);
            next.splice(i, 0, moved);
            onChange(next);
            dragRef.current = null;
            setDragOver(null);
            setExpandedIdx(null);
          }}
          onDragEnd={() => { dragRef.current = null; setDragOver(null); }}
          style={{ border: `1px solid ${dragOver === i ? '#15803d' : '#E5E7EB'}`, borderRadius: 7, marginBottom: 5, display: 'flex', alignItems: 'flex-start', background: '#fff' }}>
          <div style={{ padding: '8px 3px 8px 6px', cursor: 'grab', color: '#D1D5DB', flexShrink: 0, display: 'flex', alignItems: 'center' }} title="Drag to reorder">
            <svg width="9" height="12" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
              <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
              <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: '6px 8px 6px 4px' }}>
            {renderItem(
              item,
              (updated) => { const arr = [...items]; arr[i] = updated; onChange(arr); },
              () => { onChange(items.filter((_, j) => j !== i)); if (expandedIdx === i) setExpandedIdx(null); },
              i,
              expandedIdx === i,
              () => setExpandedIdx(expandedIdx === i ? null : i),
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Field input ────────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder}
          style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem', boxSizing: 'border-box' }} />
      )}
    </div>
  );
}


// ── Fonts ─────────────────────────────────────────────────────────────────────

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Merriweather', value: 'Merriweather' },
];

function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 7, fontSize: '0.82rem', fontFamily: value || 'inherit', background: '#fff' }}>
        {FONTS.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>{f.label}</option>)}
      </select>
    </div>
  );
}

// ── Text placement picker (3×3 grid) ──────────────────────────────────────────

const PLACEMENT_GRID = [
  ['top-left','↖'],    ['top-center','↑'],    ['top-right','↗'],
  ['mid-left','←'],    ['mid-center','·'],     ['mid-right','→'],
  ['bot-left','↙'],    ['bot-center','↓'],     ['bot-right','↘'],
] as const;

function PlacementPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const active = value || 'mid-center';
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Text Position</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 4 }}>
        {PLACEMENT_GRID.map(([pos, icon]) => (
          <button key={pos} onClick={() => onChange(pos)} title={pos.replace('-', ' ')}
            style={{ border: `1.5px solid ${active === pos ? '#15803d' : 'transparent'}`, background: active === pos ? '#F0FDF4' : 'transparent', borderRadius: 5, padding: '5px 0', cursor: 'pointer', fontSize: '0.95rem', color: active === pos ? '#15803d' : '#9CA3AF', fontWeight: active === pos ? 700 : 400, lineHeight: 1 }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Theme presets + color picker ──────────────────────────────────────────────

const DEFAULT_THEME = {
  font_heading: '',
  font_body: '',
  color_bg: '#FAF7F2',
  color_surface: '#FFFFFF',
  color_text: '#1F2937',
  color_muted: '#6B7280',
  color_primary: '#111827',
  color_accent: '#15803D',
  color_accent_hover: '#166534',
  color_border: '#E5E7EB',
};

const THEME_PRESETS = [
  { label: 'Linen', colors: { color_bg: '#FAF7F2', color_surface: '#FFFFFF', color_text: '#1F2937', color_muted: '#6B7280', color_primary: '#111827', color_accent: '#15803D', color_accent_hover: '#166534', color_border: '#E5E7EB' }, fonts: { font_heading: 'Playfair Display', font_body: 'Inter' } },
  { label: 'Dark', colors: { color_bg: '#0F172A', color_surface: '#1E293B', color_text: '#F8FAFC', color_muted: '#94A3B8', color_primary: '#F8FAFC', color_accent: '#4ADE80', color_accent_hover: '#22C55E', color_border: '#334155' }, fonts: { font_heading: 'Cormorant Garamond', font_body: 'Inter' } },
  { label: 'Minimal', colors: { color_bg: '#FFFFFF', color_surface: '#F9FAFB', color_text: '#111827', color_muted: '#6B7280', color_primary: '#111827', color_accent: '#2563EB', color_accent_hover: '#1D4ED8', color_border: '#E5E7EB' }, fonts: { font_heading: 'Inter', font_body: 'Inter' } },
  { label: 'Earth', colors: { color_bg: '#FEF3C7', color_surface: '#FFFBEB', color_text: '#78350F', color_muted: '#92400E', color_primary: '#78350F', color_accent: '#D97706', color_accent_hover: '#B45309', color_border: '#FDE68A' }, fonts: { font_heading: 'Lora', font_body: 'Open Sans' } },
  { label: 'Slate', colors: { color_bg: '#F8FAFC', color_surface: '#FFFFFF', color_text: '#0F172A', color_muted: '#64748B', color_primary: '#0F172A', color_accent: '#7C3AED', color_accent_hover: '#6D28D9', color_border: '#E2E8F0' }, fonts: { font_heading: 'Montserrat', font_body: 'DM Sans' } },
];

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        style={{ width: 30, height: 30, padding: 2, border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.67rem', fontWeight: 600, color: '#374151', marginBottom: 2 }}>{label}</div>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '2px 6px', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: '0.72rem', fontFamily: 'monospace', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

// ── Compact item row ──────────────────────────────────────────────────────────

function CompactItemRow({ label, sub, isExpanded, toggle, remove, children }: {
  label: string; sub?: string; isExpanded: boolean; toggle: () => void; remove: () => void; children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Untitled</span>}
          </div>
          {sub && <div style={{ fontSize: '0.67rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        <button onClick={toggle} title="Edit"
          style={{ flexShrink: 0, background: isExpanded ? '#EFF6FF' : '#F3F4F6', border: `1px solid ${isExpanded ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem', color: isExpanded ? '#2563EB' : '#6B7280', lineHeight: 1 }}>
          ✏
        </button>
        <button onClick={remove} title="Remove"
          style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem', color: '#EF4444', lineHeight: 1 }}>
          ✕
        </button>
      </div>
      {isExpanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
          {children}
        </div>
      )}
    </>
  );
}

// ── Section editor ─────────────────────────────────────────────────────────────

function SectionEditor({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const set = (key: string, val: any) => onChange({ ...section, data: { ...section.data, [key]: val } });

  switch (section.type) {
    case 'hero':
      return (<>
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
        <FieldInput label="Background Image URL" value={section.data.bg_image} onChange={v => set('bg_image', v)} />
        <FieldInput label="Button Label" value={section.data.button_label} onChange={v => set('button_label', v)} />
        <FieldInput label="Button URL" value={section.data.button_url} onChange={v => set('button_url', v)} />
      </>);
    case 'rich_text':
      return (<>
        <FieldInput label="Section Title (optional)" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="HTML Content" value={section.data.html} onChange={v => set('html', v)} multiline placeholder="<p>Your content here…</p>" />
      </>);
    case 'image_text':
      return (<>
        <FieldInput label="Section Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Body Text" value={section.data.text} onChange={v => set('text', v)} multiline />
        <FieldInput label="Image URL" value={section.data.image_url} onChange={v => set('image_url', v)} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Image Side</label>
          <select value={section.data.image_side || 'right'} onChange={e => set('image_side', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem' }}>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </>);
    case 'cards':
      return (<>
        <FieldInput label="Section Title" value={section.data.title} onChange={v => set('title', v)} />
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Cards</label>
          <DraggableItemList
            items={section.data.items || []}
            onChange={items => set('items', items)}
            renderItem={(item, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow label={`${item.icon || ''} ${item.title || 'Card'}`.trim()} sub={item.text?.substring(0, 40)} isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <FieldInput label="Icon / Emoji" value={item.icon} onChange={v => update({ ...item, icon: v })} placeholder="🌟" />
                <FieldInput label="Title" value={item.title} onChange={v => update({ ...item, title: v })} />
                <FieldInput label="Text" value={item.text} onChange={v => update({ ...item, text: v })} multiline />
                <FontPicker label="Title Font" value={item.title_font || ''} onChange={v => update({ ...item, title_font: v })} />
              </CompactItemRow>
            )}
          />
          <button onClick={() => set('items', [...(section.data.items || []), { icon: '⭐', title: 'New Card', text: '' }])}
            style={{ fontSize: '0.78rem', color: '#15803d', background: 'none', border: '1px dashed #15803d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', marginTop: 2 }}>
            + Add Card
          </button>
        </div>
      </>);
    case 'cta':
      return (<>
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
        <FieldInput label="Button Label" value={section.data.button_label} onChange={v => set('button_label', v)} />
        <FieldInput label="Button URL" value={section.data.button_url} onChange={v => set('button_url', v)} />
        <FieldInput label="Secondary Button Label" value={section.data.button2_label} onChange={v => set('button2_label', v)} placeholder="Optional" />
        <FieldInput label="Secondary Button URL" value={section.data.button2_url} onChange={v => set('button2_url', v)} />
        <FieldInput label="Background Color" value={section.data.bg_color} onChange={v => set('bg_color', v)} placeholder="#F0FDF4" />
      </>);
    case 'contact_form':
      return (<>
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
      </>);
    case 'announcement_bar':
      return (<>
        <FieldInput label="Announcement Text" value={section.data.text} onChange={v => set('text', v)} placeholder="🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Active</label>
          <select value={section.data.active === false ? 'false' : 'true'} onChange={e => set('active', e.target.value === 'true')}
            style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem' }}>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </div>
      </>);
    case 'banner_slider': {
      const banners: any[] = section.data.banners || [];
      return (
        <div>
          <DraggableItemList
            items={banners}
            onChange={items => set('banners', items)}
            renderItem={(b, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow
                label={b.title || 'Banner'}
                sub={b.image_url ? '🖼 Image set' : 'No image'}
                isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <FieldInput label="Image URL" value={b.image_url} onChange={v => update({ ...b, image_url: v })} placeholder="https://..." />
                {b.image_url && (
                  <div style={{ marginBottom: 10, borderRadius: 6, overflow: 'hidden', maxHeight: 80, background: '#F3F4F6' }}>
                    <img src={b.image_url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <FieldInput label="Link URL" value={b.link_url} onChange={v => update({ ...b, link_url: v })} placeholder="/products" />
                <PlacementPicker value={b.text_position || 'mid-center'} onChange={v => update({ ...b, text_position: v })} />
                <FieldInput label="Heading" value={b.title} onChange={v => update({ ...b, title: v })} />
                <FontPicker label="Heading Font" value={b.title_font || ''} onChange={v => update({ ...b, title_font: v })} />
                <FieldInput label="Subtext" value={b.subtitle || ''} onChange={v => update({ ...b, subtitle: v })} />
                <FontPicker label="Subtext Font" value={b.subtitle_font || ''} onChange={v => update({ ...b, subtitle_font: v })} />
                <FieldInput label="Button Label" value={b.button_label || ''} onChange={v => update({ ...b, button_label: v })} placeholder="Shop Now" />
              </CompactItemRow>
            )}
          />
          <button onClick={() => set('banners', [...banners, { title: '', subtitle: '', image_url: '', link_url: '', text_position: 'mid-center' }])}
            style={{ fontSize: '0.78rem', color: '#15803d', background: 'none', border: '1px dashed #15803d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', marginTop: 2 }}>
            + Add Banner
          </button>
        </div>
      );
    }
    case 'categories_carousel':
      return (<>
        <FieldInput label="Badge Text" value={section.data.badge} onChange={v => set('badge', v)} placeholder="Collections" />
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} placeholder="Product Categories" />
      </>);
    case 'products_grid':
      return (<>
        <FieldInput label="Badge Text" value={section.data.badge} onChange={v => set('badge', v)} placeholder="Trending" />
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Number of Products</label>
          <select value={section.data.limit || 8} onChange={e => set('limit', Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.85rem' }}>
            {[4, 6, 8, 12, 16].map(n => <option key={n} value={n}>{n} products</option>)}
          </select>
        </div>
        <FieldInput label="View All URL" value={section.data.view_all_url} onChange={v => set('view_all_url', v)} placeholder="/products" />
        <FieldInput label="View All Label" value={section.data.view_all_label} onChange={v => set('view_all_label', v)} placeholder="VIEW ALL →" />
      </>);
    case 'features_strip': {
      const defaultItems = [
        { emoji: '🚚', title: 'Free & Fast Shipping', desc: 'Ships all over India at no additional costs.' },
        { emoji: '💵', title: 'Free COD Available', desc: 'Cash on Delivery available without any minimum order.' },
        { emoji: '↩️', title: 'Free & Easy Return', desc: 'Easy 7-day return policy for hassle-free experience.' },
        { emoji: '🎧', title: 'Expert Help & Support', desc: 'Monday – Friday (10:00 AM – 07:00 PM)' },
        { emoji: '🔒', title: '100% Payment Protection', desc: 'Secure checkout with easy return policy.' },
      ];
      const items: any[] = section.data.items?.length ? section.data.items : defaultItems;
      return (
        <div>
          <DraggableItemList
            items={items}
            onChange={newItems => set('items', newItems)}
            renderItem={(f, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow label={`${f.emoji || ''} ${f.title || 'Feature'}`.trim()} sub={f.desc?.substring(0, 40)} isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <FieldInput label="Icon / Emoji" value={f.emoji} onChange={v => update({ ...f, emoji: v })} placeholder="🚚" />
                <FieldInput label="Title" value={f.title} onChange={v => update({ ...f, title: v })} />
                <FieldInput label="Description" value={f.desc} onChange={v => update({ ...f, desc: v })} />
                <FontPicker label="Title Font" value={f.title_font || ''} onChange={v => update({ ...f, title_font: v })} />
              </CompactItemRow>
            )}
          />
          <button onClick={() => set('items', [...items, { emoji: '⭐', title: 'Feature', desc: '' }])}
            style={{ fontSize: '0.78rem', color: '#15803d', background: 'none', border: '1px dashed #15803d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', marginTop: 2 }}>
            + Add Feature
          </button>
        </div>
      );
    }
    case 'about_section':
      return (<>
        <FieldInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <FieldInput label="Content" value={section.data.content} onChange={v => set('content', v)} multiline />
        <FieldInput label="Tagline" value={section.data.tagline} onChange={v => set('tagline', v)} placeholder='"Live Healthy. Stay Beautiful."' />
        <FieldInput label="Button Label" value={section.data.button_label} onChange={v => set('button_label', v)} placeholder="Learn More About Us" />
        <FieldInput label="Button URL" value={section.data.button_url} onChange={v => set('button_url', v)} placeholder="/about" />
      </>);
    default:
      return <div style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>No editable fields for this section type.</div>;
  }
}

// ── Add Section Modal ──────────────────────────────────────────────────────────

function AddSectionModal({ onAdd, onClose }: { onAdd: (t: SectionType) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, width: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Add Section</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>Choose a section type to add to this page</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(Object.keys(SECTION_LABELS) as SectionType[]).map(type => {
            const parts = SECTION_LABELS[type].split(' ');
            const icon = parts[0];
            const label = parts.slice(1).join(' ');
            return (
              <button key={type} onClick={() => { onAdd(type); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FAFAFA', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#15803d'; (e.currentTarget as HTMLElement).style.background = '#F0FDF4'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Header nav item type ────────────────────────────────────────────────────────

interface HeaderNavChild { title: string; url: string; }
interface HeaderNavItem { title: string; url: string; children?: HeaderNavChild[]; }

const DEFAULT_NAV_ITEMS: HeaderNavItem[] = [
  { title: 'Home', url: '/' },
  { title: 'Products', url: '/products' },
  { title: 'Categories', url: '/categories' },
  { title: 'Collections', url: '/collections' },
  { title: 'About Us', url: '/about' },
  { title: 'Contact Us', url: '/contact' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export const CustomizePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSlug = searchParams?.get('page') ?? 'home';

  const [pages, setPages] = useState<PageItem[]>([]);
  const [activePage, setActivePage] = useState<PageItem | null>(null);
  const [draftSections, setDraftSections] = useState<Section[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'publishing' | 'published'>('idle');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  // Header mode
  const [headerMode, setHeaderMode] = useState(false);
  const [headerNavItems, setHeaderNavItems] = useState<HeaderNavItem[]>(DEFAULT_NAV_ITEMS);
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [headerSaveStatus, setHeaderSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const headerSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [themeMode, setThemeMode] = useState(false);
  const [themeSettings, setThemeSettings] = useState<typeof DEFAULT_THEME>({ ...DEFAULT_THEME });
  const themeSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [expandedChildIdx, setExpandedChildIdx] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const shopSlug = typeof window !== 'undefined' ? (localStorage.getItem('oaksol_active_shop_slug') || 'testShop') : 'testShop';

  // ── Load all pages, select default ──────────────────────────────────────────

  useEffect(() => {
    merchantApi.getPages().then((data: PageItem[]) => {
      setPages(data || []);
      const target = data?.find((p: PageItem) => p.slug === defaultSlug) ?? data?.[0];
      if (target) loadPage(target);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      merchantApi.getPageContent(),
      merchantApi.getCollections().catch(() => [] as any[]),
      storefrontApi.getCategories().catch(() => [] as any[]),
    ]).then(([pageData, collections, categories]: [any, any[], any[]]) => {
      let navItems: HeaderNavItem[] = DEFAULT_NAV_ITEMS;
      if (pageData?.content?.navbar_menu) {
        try { navItems = JSON.parse(pageData.content.navbar_menu); } catch {}
      }
      navItems = navItems.map((item: HeaderNavItem) => {
        if (item.children !== undefined) return item;
        if (item.url === '/collections' && collections.length > 0) {
          return { ...item, children: collections.map((c: any) => ({ title: c.name, url: `/collections/${c.slug}` })) };
        }
        if (item.url === '/categories' && categories.length > 0) {
          return { ...item, children: categories.map((c: any) => ({ title: c.name, url: `/categories/${c.slug}` })) };
        }
        return item;
      });
      setHeaderNavItems(navItems);
      if (pageData?.content?.logo_url) setHeaderLogoUrl(pageData.content.logo_url);
      const tc = pageData?.content;
      if (tc) {
        setThemeSettings({
          font_heading: tc.font_heading || tc.global_font || '',
          font_body: tc.font_body || tc.global_font || '',
          color_bg: tc.color_bg || DEFAULT_THEME.color_bg,
          color_surface: tc.color_surface || DEFAULT_THEME.color_surface,
          color_text: tc.color_text || DEFAULT_THEME.color_text,
          color_muted: tc.color_muted || DEFAULT_THEME.color_muted,
          color_primary: tc.color_primary || DEFAULT_THEME.color_primary,
          color_accent: tc.color_accent || DEFAULT_THEME.color_accent,
          color_accent_hover: tc.color_accent_hover || DEFAULT_THEME.color_accent_hover,
          color_border: tc.color_border || DEFAULT_THEME.color_border,
        });
      }
    }).catch(() => {});
  }, []);

  const loadPage = (page: PageItem) => {
    setActivePage(page);
    setDraftSections((page.draft_sections ?? page.sections ?? []) as Section[]);
    setSelectedIdx(null);
    setShowAddPicker(false);
    setSaveStatus('idle');
    setIsDirty(false);
  };

  // ── postMessage preview ───────────────────────────────────────────────────────

  const sendPreview = useCallback((sections: Section[]) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'page_preview', sections }, '*');
  }, []);

  const sendHeaderPreview = useCallback((items: HeaderNavItem[], logo: string) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'SETTINGS_UPDATE',
      payload: { logo_url: logo, navbar_menu: JSON.stringify(items) },
    }, '*');
  }, []);

  const sendThemePreview = useCallback((theme: typeof DEFAULT_THEME) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', payload: theme }, '*');
  }, []);

  // Keep a stable ref so the event handler always reads the latest values without changing deps size
  const latestPreviewRef = useRef({ sections: draftSections, theme: themeSettings });
  latestPreviewRef.current = { sections: draftSections, theme: themeSettings };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview_ready') {
        sendThemePreview(latestPreviewRef.current.theme);
        sendPreview(latestPreviewRef.current.sections);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // sendPreview and sendThemePreview are stable useCallback refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendPreview, sendThemePreview]);

  // When header mode is active, send header settings when iframe is ready
  useEffect(() => {
    if (!headerMode) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview_ready') sendHeaderPreview(headerNavItems, headerLogoUrl);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [headerMode, headerNavItems, headerLogoUrl, sendHeaderPreview]);

  const updateHeader = (items: HeaderNavItem[], logo: string) => {
    setHeaderNavItems(items);
    setHeaderLogoUrl(logo);
    setIsDirty(true);
    sendHeaderPreview(items, logo);
    if (headerSaveTimer.current) clearTimeout(headerSaveTimer.current);
    headerSaveTimer.current = setTimeout(async () => {
      setHeaderSaveStatus('saving');
      try {
        await merchantApi.savePageContent({ logo_url: logo, navbar_menu: JSON.stringify(items) });
        setIsDirty(false);
        setHeaderSaveStatus('saved');
        setTimeout(() => setHeaderSaveStatus('idle'), 2000);
      } catch { setHeaderSaveStatus('idle'); }
    }, 1500);
  };

  const updateTheme = (theme: typeof DEFAULT_THEME) => {
    setThemeSettings(theme);
    setIsDirty(true);
    sendThemePreview(theme);
    if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    themeSaveTimer.current = setTimeout(async () => {
      setHeaderSaveStatus('saving');
      try {
        await merchantApi.savePageContent({ ...theme });
        setIsDirty(false);
        setHeaderSaveStatus('saved');
        setTimeout(() => setHeaderSaveStatus('idle'), 2000);
      } catch { setHeaderSaveStatus('idle'); }
    }, 1500);
  };

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const updateSections = (sections: Section[]) => {
    setDraftSections(sections);
    setIsDirty(true);
    sendPreview(sections);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!activePage) return;
      setSaveStatus('saving');
      try {
        await merchantApi.saveDraft(activePage.id, sections);
        setIsDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 2000);
  };

  // ── Section ops ────────────────────────────────────────────────────────────

  const addSection = (type: SectionType) => {
    const next = [...draftSections, { type, data: { ...DEFAULT_SECTION_DATA[type] } }];
    updateSections(next);
    setSelectedIdx(next.length - 1);
  };

  const updateSection = (idx: number, section: Section) => {
    updateSections(draftSections.map((s, i) => i === idx ? section : s));
  };

  const removeSection = (idx: number) => {
    updateSections(draftSections.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...draftSections];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    updateSections(next);
    setSelectedIdx(t);
  };

  // ── Switch page in dropdown ──────────────────────────────────────────────────

  const switchPage = async (pageId: string) => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      if (activePage) await merchantApi.saveDraft(activePage.id, draftSections).catch(() => {});
    }
    const page = pages.find(p => p.id === pageId);
    if (page) loadPage(page);
  };

  // ── Publish ───────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!activePage) return;
    setSaveStatus('publishing');
    try {
      await merchantApi.saveDraft(activePage.id, draftSections);
      await merchantApi.publishPage(activePage.id);
      setIsDirty(false);
      setSaveStatus('published');
      setActivePage(prev => prev ? { ...prev, status: 'published' } : null);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch { setSaveStatus('idle'); }
  };

  const handleExit = () => {
    if (isDirty) { setShowExitModal(true); return; }
    router.push('/pages');
  };

  const handleSaveAndExit = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (headerSaveTimer.current) clearTimeout(headerSaveTimer.current);
    if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    try {
      if (activePage) await merchantApi.saveDraft(activePage.id, draftSections);
      await merchantApi.savePageContent({ logo_url: headerLogoUrl, navbar_menu: JSON.stringify(headerNavItems), ...themeSettings });
    } catch {}
    router.push('/pages');
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF' }}>Loading editor…</div>;
  }

  // home page lives at / not /home on the storefront
  const iframeSlug = (activePage?.slug === 'home' || activePage?.slug === 'index') ? '' : (activePage?.slug ?? '');
  const iframeUrl = (headerMode || themeMode)
    ? `http://${shopSlug}.localhost:3001/?preview=1`
    : `http://${shopSlug}.localhost:3001/${iframeSlug}?preview=1`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F3F4F6', display: 'flex', flexDirection: 'column', zIndex: 100 }}>

      {/* ── Unsaved changes exit modal ── */}
      {showExitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 5 }}>Unsaved changes</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5 }}>You have unsaved changes. Save a draft to keep them, or exit without saving to discard.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExitModal(false)}
                style={{ padding: '7px 14px', borderRadius: 8, background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button onClick={() => { setShowExitModal(false); router.push('/pages'); }}
                style={{ padding: '7px 14px', borderRadius: 8, background: '#fff', color: '#EF4444', border: '1px solid #FECACA', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Exit without saving
              </button>
              <button onClick={handleSaveAndExit}
                style={{ padding: '7px 16px', borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                Save draft & exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ height: 52, background: '#1F2937', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, borderBottom: '1px solid #374151' }}>
        <button onClick={handleExit} title="Exit editor"
          style={{ background: 'none', border: '1px solid #4B5563', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLElement).style.borderColor = '#9CA3AF'; (e.currentTarget as HTMLElement).style.background = '#374151'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.borderColor = '#4B5563'; (e.currentTarget as HTMLElement).style.background = 'none'; }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>

        <div style={{ width: 1, height: 24, background: '#374151' }} />

        <select value={activePage?.id ?? ''} onChange={e => { setHeaderMode(false); setThemeMode(false); switchPage(e.target.value); }}
          style={{ background: '#374151', color: '#F9FAFB', border: '1px solid #4B5563', borderRadius: 6, padding: '5px 10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
          {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        {activePage && (
          <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
            background: activePage.status === 'published' ? 'rgba(16,185,129,0.2)' : 'rgba(217,119,6,0.2)',
            color: activePage.status === 'published' ? '#34D399' : '#FCD34D' }}>
            {activePage.status === 'published' ? 'Published' : 'Draft'}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', minWidth: 90, textAlign: 'center' }}>
          {headerMode
            ? (headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : '')
            : (saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Draft saved' : saveStatus === 'publishing' ? 'Publishing…' : saveStatus === 'published' ? '✓ Published!' : '')}
        </span>

        {/* Viewport toggle — icons only */}
        <div style={{ display: 'flex', background: '#374151', borderRadius: 8, padding: 2 }}>
          <button onClick={() => setViewMode('desktop')} title="Desktop"
            style={{ padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: viewMode === 'desktop' ? '#4B5563' : 'transparent', color: viewMode === 'desktop' ? '#F9FAFB' : '#9CA3AF' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </button>
          <button onClick={() => setViewMode('mobile')} title="Mobile"
            style={{ padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: viewMode === 'mobile' ? '#4B5563' : 'transparent', color: viewMode === 'mobile' ? '#F9FAFB' : '#9CA3AF' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>

        <button
          onClick={async () => {
            if (!activePage) return;
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            setSaveStatus('saving');
            try {
              await merchantApi.saveDraft(activePage.id, draftSections);
              setIsDirty(false);
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
            } catch { setSaveStatus('idle'); }
          }}
          style={{ padding: '6px 14px', borderRadius: 8, background: '#374151', color: '#D1D5DB', border: '1px solid #4B5563', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
          Save Draft
        </button>
        <button onClick={handlePublish} disabled={saveStatus === 'publishing'}
          style={{ padding: '6px 18px', borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
          {saveStatus === 'publishing' ? 'Publishing…' : '▶ Publish'}
        </button>

      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Add Section Modal ── */}
        {showAddPicker && <AddSectionModal onAdd={addSection} onClose={() => setShowAddPicker(false)} />}

        {/* ── Left sidebar ── */}
        <div style={{ width: 320, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {themeMode ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setThemeMode(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ← Sections
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 16 }}>Theme Settings</div>

                {/* Presets */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick Presets</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {THEME_PRESETS.map(p => (
                      <button key={p.label}
                        onClick={() => updateTheme({ ...themeSettings, ...p.colors, ...p.fonts })}
                        style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#374151', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#15803d'; (e.currentTarget as HTMLElement).style.color = '#15803d'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}>
                        {p.label}
                      </button>
                    ))}
                    <button
                      onClick={() => updateTheme({ ...DEFAULT_THEME })}
                      style={{ padding: '4px 10px', borderRadius: 20, border: '1px dashed #D1D5DB', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 500, color: '#9CA3AF' }}>
                      Reset
                    </button>
                  </div>
                </div>

                {/* Typography */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Typography</div>
                  <FontPicker label="Heading Font (h1–h6)" value={themeSettings.font_heading} onChange={v => updateTheme({ ...themeSettings, font_heading: v })} />
                  <FontPicker label="Body Font (paragraphs)" value={themeSettings.font_body} onChange={v => updateTheme({ ...themeSettings, font_body: v })} />
                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: -4, marginBottom: 4 }}>Banner & card text items can override fonts individually.</div>
                </div>

                {/* Colors */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Colors</div>
                  <ColorRow label="Page Background" value={themeSettings.color_bg} onChange={v => updateTheme({ ...themeSettings, color_bg: v })} />
                  <ColorRow label="Card / Surface" value={themeSettings.color_surface} onChange={v => updateTheme({ ...themeSettings, color_surface: v })} />
                  <ColorRow label="Main Text" value={themeSettings.color_text} onChange={v => updateTheme({ ...themeSettings, color_text: v })} />
                  <ColorRow label="Muted Text" value={themeSettings.color_muted} onChange={v => updateTheme({ ...themeSettings, color_muted: v })} />
                  <ColorRow label="Button / Primary" value={themeSettings.color_primary} onChange={v => updateTheme({ ...themeSettings, color_primary: v })} />
                  <ColorRow label="Accent / Highlight" value={themeSettings.color_accent} onChange={v => updateTheme({ ...themeSettings, color_accent: v })} />
                  <ColorRow label="Accent Hover" value={themeSettings.color_accent_hover} onChange={v => updateTheme({ ...themeSettings, color_accent_hover: v })} />
                  <ColorRow label="Border" value={themeSettings.color_border} onChange={v => updateTheme({ ...themeSettings, color_border: v })} />
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E7EB', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center' }}>
                {headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : 'Changes auto-save'}
              </div>
            </div>
          ) : headerMode ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setHeaderMode(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ← Sections
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 16 }}>Header Settings</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Logo</div>
                  <FieldInput label="Logo Image URL" value={headerLogoUrl} onChange={url => updateHeader(headerNavItems, url)} placeholder="https://cdn.example.com/logo.png" />
                  {headerLogoUrl && (
                    <div style={{ marginTop: -8, marginBottom: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={headerLogoUrl} alt="Logo preview" style={{ maxHeight: 36, maxWidth: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Navigation Links</div>
                  <DraggableItemList
                    items={headerNavItems}
                    onChange={items => { updateHeader(items, headerLogoUrl); setExpandedChildIdx(null); }}
                    renderItem={(item, update, remove, _navIdx, isExpanded, toggle) => {
                      const children: HeaderNavChild[] = item.children || [];
                      return (
                        <>
                          {/* Compact row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Untitled</span>}
                                {children.length > 0 && <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 500, marginLeft: 5 }}>▾ {children.length}</span>}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
                            </div>
                            <button onClick={() => { toggle(); setExpandedChildIdx(null); }} title="Edit"
                              style={{ flexShrink: 0, background: isExpanded ? '#EFF6FF' : '#F3F4F6', border: `1px solid ${isExpanded ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem', color: isExpanded ? '#2563EB' : '#6B7280', lineHeight: 1 }}>
                              ✏
                            </button>
                            <button onClick={remove} title="Remove"
                              style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem', color: '#EF4444', lineHeight: 1 }}>
                              ✕
                            </button>
                          </div>

                          {/* Expanded editor */}
                          {isExpanded && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                              <FieldInput label="Label" value={item.title} onChange={v => update({ ...item, title: v })} placeholder="Products" />
                              <FieldInput label="URL" value={item.url} onChange={v => update({ ...item, url: v })} placeholder="/products" />

                              {/* Dropdown sub-items */}
                              <div style={{ marginTop: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Dropdown Items {children.length > 0 && <span style={{ color: '#15803d' }}>({children.length})</span>}
                                  </span>
                                  <button
                                    onClick={() => { update({ ...item, children: [...children, { title: '', url: '' }] }); setExpandedChildIdx(children.length); }}
                                    style={{ fontSize: '0.65rem', color: '#15803d', background: 'none', border: '1px solid #15803d', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', lineHeight: 1.4 }}>
                                    + Add
                                  </button>
                                </div>
                                {children.length === 0 && (
                                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontStyle: 'italic' }}>No sub-items — opens as direct link</div>
                                )}
                                {children.map((child, ci) => {
                                  const isChildOpen = expandedChildIdx === ci;
                                  return (
                                    <div key={ci} style={{ border: `1px solid ${isChildOpen ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 6, marginBottom: 4, background: isChildOpen ? '#F0F7FF' : '#F9FAFB' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 7px', minWidth: 0 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {child.title || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Untitled</span>}
                                          </div>
                                          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.url}</div>
                                        </div>
                                        <button
                                          onClick={() => setExpandedChildIdx(isChildOpen ? null : ci)}
                                          title="Edit"
                                          style={{ flexShrink: 0, background: isChildOpen ? '#DBEAFE' : '#F3F4F6', border: `1px solid ${isChildOpen ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: '0.65rem', color: isChildOpen ? '#2563EB' : '#6B7280', lineHeight: 1 }}>
                                          ✏
                                        </button>
                                        <button
                                          onClick={() => { update({ ...item, children: children.filter((_, j) => j !== ci) }); if (expandedChildIdx === ci) setExpandedChildIdx(null); }}
                                          title="Remove"
                                          style={{ flexShrink: 0, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: '0.65rem', color: '#EF4444', lineHeight: 1 }}>
                                          ✕
                                        </button>
                                      </div>
                                      {isChildOpen && (
                                        <div style={{ padding: '0 7px 7px', borderTop: '1px solid #BFDBFE' }}>
                                          <div style={{ paddingTop: 6 }}>
                                            <FieldInput label="Label" value={child.title} onChange={v => {
                                              const ch = [...children]; ch[ci] = { ...ch[ci], title: v }; update({ ...item, children: ch });
                                            }} placeholder="Sub Page" />
                                            <FieldInput label="URL" value={child.url} onChange={v => {
                                              const ch = [...children]; ch[ci] = { ...ch[ci], url: v }; update({ ...item, children: ch });
                                            }} placeholder="/sub-page" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }}
                  />
                  <button
                    onClick={() => updateHeader([...headerNavItems, { title: 'New Link', url: '/' }], headerLogoUrl)}
                    style={{ fontSize: '0.8rem', color: '#15803d', background: 'none', border: '1px dashed #15803d', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', width: '100%', marginTop: 8 }}>
                    + Add Link
                  </button>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid #E5E7EB', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center' }}>
                {headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : 'Changes auto-save'}
              </div>
            </div>
          ) : selectedIdx !== null ? (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setSelectedIdx(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ← Sections
                </button>
                <button onClick={() => removeSection(selectedIdx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '0.75rem' }}>
                  Remove
                </button>
              </div>
              <div style={{ padding: 12, flex: 1, overflow: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                  {SECTION_LABELS[draftSections[selectedIdx]?.type]}
                </div>
                {draftSections[selectedIdx] && (
                  <SectionEditor section={draftSections[selectedIdx]} onChange={s => updateSection(selectedIdx, s)} />
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sections</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                  <div style={{ padding: '10px 10px 10px 14px', fontSize: '1rem', flexShrink: 0 }}>🏠</div>
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#374151', padding: '10px 0' }}>Header</span>
                  <button onClick={() => setHeaderMode(true)}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                    title="Edit header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                {/* Theme Settings row */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                  <div style={{ padding: '10px 10px 10px 14px', fontSize: '1rem', flexShrink: 0 }}>🎨</div>
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#374151', padding: '10px 0' }}>Theme Settings</span>
                  <button onClick={() => setThemeMode(true)}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                    title="Edit theme">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                {/* Sections label */}
                <div style={{ padding: '6px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  Sections
                </div>
                {draftSections.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: '0.82rem' }}>No sections yet.<br />Add one below.</div>
                )}
                {draftSections.map((s, i) => (
                  <div key={i}
                    draggable
                    onDragStart={() => { dragIdx.current = i; }}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={() => {
                      const from = dragIdx.current;
                      if (from === null || from === i) { setDragOverIdx(null); return; }
                      const next = [...draftSections];
                      const [moved] = next.splice(from, 1);
                      next.splice(i, 0, moved);
                      updateSections(next);
                      if (selectedIdx === from) setSelectedIdx(i);
                      else if (selectedIdx !== null && selectedIdx > from && selectedIdx <= i) setSelectedIdx(selectedIdx - 1);
                      else if (selectedIdx !== null && selectedIdx < from && selectedIdx >= i) setSelectedIdx(selectedIdx + 1);
                      dragIdx.current = null;
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => { dragIdx.current = null; setDragOverIdx(null); }}
                    style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: dragOverIdx === i ? '2px solid #15803d' : '1px solid #F3F4F6', background: selectedIdx === i ? '#F0FDF4' : 'transparent' }}>
                    {/* Drag handle */}
                    <div style={{ padding: '10px 6px 10px 10px', cursor: 'grab', color: '#D1D5DB', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      title="Drag to reorder">
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
                        <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                        <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
                      </svg>
                    </div>
                    <button onClick={() => setSelectedIdx(i)}
                      style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '10px 10px 10px 0', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{SECTION_LABELS[s.type]?.split(' ')[0]}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.data.title || SECTION_LABELS[s.type]?.split(' ').slice(1).join(' ')}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: '0.75rem', flexShrink: 0 }}>›</span>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #E5E7EB' }}>
                <button onClick={() => setShowAddPicker(true)}
                  style={{ width: '100%', padding: 9, borderRadius: 8, background: '#F0FDF4', color: '#15803d', border: '1px dashed #15803d', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                  + Add Section
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#E5E7EB', overflow: 'auto', padding: 20 }}>
          <div style={{ width: viewMode === 'mobile' ? 390 : '100%', maxWidth: viewMode === 'mobile' ? 390 : 1200, height: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <iframe ref={iframeRef} src={iframeUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Page Preview"
              onLoad={() => setTimeout(() => {
                sendThemePreview(themeSettings);
                if (headerMode) sendHeaderPreview(headerNavItems, headerLogoUrl);
                else if (!themeMode) sendPreview(draftSections);
              }, 300)} />
          </div>
        </div>
      </div>
    </div>
  );
};
