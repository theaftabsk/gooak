'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { merchantApi } from '@/lib/api-client';
import { Select } from '@/components/ui/Shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionType = 'hero' | 'rich_text' | 'image_text' | 'cards' | 'cta' | 'contact_form' | 'announcement_bar' | 'banner_slider' | 'products_grid' | 'features_strip' | 'about_section';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; desc: string }> = {
  hero:               { label: 'Hero Banner',         icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, desc: 'Full-width banner with headline & CTA' },
  rich_text:          { label: 'Rich Text',           icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, desc: 'Freeform HTML text block' },
  image_text:         { label: 'Image + Text',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><line x1="13" y1="14" x2="21" y2="14"/><line x1="13" y1="18" x2="19" y2="18"/></svg>, desc: 'Side-by-side image and text' },
  cards:              { label: 'Cards',               icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="6" height="14" rx="1"/><rect x="9" y="5" width="6" height="14" rx="1"/><rect x="16" y="5" width="6" height="14" rx="1"/></svg>, desc: 'Grid of icon + title + text cards' },
  cta:                { label: 'Call to Action',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, desc: 'Bold CTA section with buttons' },
  contact_form:       { label: 'Contact Form',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, desc: 'Customer inquiry form' },
  announcement_bar:   { label: 'Announcement',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, desc: 'Top-of-page notice strip' },
  banner_slider:      { label: 'Banner Slider',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="5" width="22" height="14" rx="2"/><polyline points="8 5 1 12 8 19"/><polyline points="16 5 23 12 16 19"/></svg>, desc: 'Auto-playing image carousel' },
  products_grid:      { label: 'Products Grid',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>, desc: 'Showcase your top products' },
  features_strip:     { label: 'Features Strip',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, desc: 'Trust badges & USP highlights' },
  about_section:      { label: 'About Section',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, desc: 'Brand story & values' },
};

const DEFAULT_SECTION_DATA: Record<SectionType, Record<string, any>> = {
  hero:               { title: 'New Section', subtitle: '', bg_image: '', bg_color: '', title_font: '', subtitle_font: '', button_label: '', button_url: '' },
  rich_text:          { title: '', html: '<p>Your content here…</p>' },
  image_text:         { title: '', text: '', image_url: '', image_side: 'right' },
  cards:              { title: '', items: [{ icon: '⭐', title: 'Card Title', text: 'Card description.' }] },
  cta:                { title: 'Take Action', subtitle: '', button_label: 'Get Started', button_url: '/products', bg_color: '', button2_label: '', button2_url: '' },
  contact_form:       { title: 'Contact Us', subtitle: '' },
  announcement_bar:   { text: '🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500', active: true },
  banner_slider:      { banners: [] },
  products_grid:      { badge: '', title: 'Products', subtitle: '', limit: 8, view_all_url: '/products', view_all_label: 'VIEW ALL →', columns: 4 },
  features_strip:     { items: [] },
  about_section:      { title: 'About Us', content: '', tagline: '', title_font: '', button_label: 'Learn More', button_url: '/about', values: [] },
};

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
const FONT_DEFAULT_SENTINEL = '__default__';

const DEFAULT_THEME = {
  font_heading: '', font_body: '',
  color_bg: '#FAF7F2', color_surface: '#FFFFFF', color_text: '#1F2937',
  color_muted: '#6B7280', color_primary: '#111827', color_accent: '#15803D',
  color_accent_hover: '#166534', color_border: '#E5E7EB',
  color_footer_bg: '#111827',
};

const THEME_PRESETS = [
  { label: 'Linen',   colors: { color_bg: '#FAF7F2', color_surface: '#FFFFFF', color_text: '#1F2937', color_muted: '#6B7280', color_primary: '#111827', color_accent: '#15803D', color_accent_hover: '#166534', color_border: '#E5E7EB', color_footer_bg: '#111827' }, fonts: { font_heading: 'Playfair Display', font_body: 'Inter' } },
  { label: 'Dark',    colors: { color_bg: '#18181B', color_surface: '#27272A', color_text: '#FAFAFA', color_muted: '#A1A1AA', color_primary: '#FAFAFA', color_accent: '#F59E0B', color_accent_hover: '#D97706', color_border: '#3F3F46', color_footer_bg: '#09090B' }, fonts: { font_heading: 'Cormorant Garamond', font_body: 'Inter' } },
  { label: 'Minimal', colors: { color_bg: '#FFFFFF', color_surface: '#F9FAFB', color_text: '#111827', color_muted: '#6B7280', color_primary: '#111827', color_accent: '#2563EB', color_accent_hover: '#1D4ED8', color_border: '#E5E7EB', color_footer_bg: '#111827' }, fonts: { font_heading: 'Inter', font_body: 'Inter' } },
  { label: 'Earth',   colors: { color_bg: '#FEF3C7', color_surface: '#FFFBEB', color_text: '#78350F', color_muted: '#92400E', color_primary: '#78350F', color_accent: '#D97706', color_accent_hover: '#B45309', color_border: '#FDE68A', color_footer_bg: '#451A03' }, fonts: { font_heading: 'Lora', font_body: 'Open Sans' } },
  { label: 'Slate',   colors: { color_bg: '#F8FAFC', color_surface: '#FFFFFF', color_text: '#0F172A', color_muted: '#64748B', color_primary: '#0F172A', color_accent: '#7C3AED', color_accent_hover: '#6D28D9', color_border: '#E2E8F0', color_footer_bg: '#0F172A' }, fonts: { font_heading: 'Montserrat', font_body: 'DM Sans' } },
];

const PLACEMENT_GRID = [
  ['top-left','↖'],  ['top-center','↑'],  ['top-right','↗'],
  ['mid-left','←'],  ['mid-center','·'],   ['mid-right','→'],
  ['bot-left','↙'],  ['bot-center','↓'],  ['bot-right','↘'],
] as const;

// ─── Design tokens (light sidebar theme) ─────────────────────────────────────

const T = {
  bg:        '#ffffff',
  bg2:       '#f8fafc',
  surface:   '#f1f5f9',
  border:    '#e2e8f0',
  borderSub: '#e9eef5',
  text:      '#0f172a',
  muted:     '#475569',
  dim:       '#94a3b8',
  accent:    '#15803d',
  accentDim: 'rgba(21,128,61,0.08)',
  danger:    '#dc2626',
  dangerDim: 'rgba(220,38,38,0.07)',
  blue:      '#2563eb',
  blueDim:   'rgba(37,99,235,0.08)',
  inputBg:   '#ffffff',
  inputBorder:'#d1d5db',
};

// ─── Primitives ────────────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
    {children}
  </div>
);

const EdInput: React.FC<{ label?: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; mono?: boolean }> = ({
  label, value, onChange, multiline = false, placeholder = '', mono = false,
}) => {
  const shared: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 8, color: T.text, fontSize: mono ? '0.75rem' : '0.82rem',
    fontFamily: mono ? 'monospace' : 'inherit', outline: 'none',
    transition: 'border-color 0.15s',
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <Label>{label}</Label>}
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
            style={{ ...shared, padding: '8px 10px', resize: 'vertical' }}
            onFocus={e => (e.target.style.borderColor = T.accent)}
            onBlur={e => (e.target.style.borderColor = T.inputBorder)} />
        : <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...shared, padding: '8px 10px', display: 'block' }}
            onFocus={e => (e.target.style.borderColor = T.accent)}
            onBlur={e => (e.target.style.borderColor = T.inputBorder)} />}
    </div>
  );
};

const EdSelect: React.FC<{ label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({
  label, value, onChange, options,
}) => (
  <div style={{ marginBottom: 12 }}>
    {label && <Label>{label}</Label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 8, color: T.text, fontSize: '0.82rem', padding: '8px 10px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const FontPicker: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <EdSelect
    label={label}
    value={value || FONT_DEFAULT_SENTINEL}
    onChange={v => onChange(v === FONT_DEFAULT_SENTINEL ? '' : v)}
    options={[{ value: FONT_DEFAULT_SENTINEL, label: 'Default (global)' }, ...FONTS]}
  />
);

const ColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 32, padding: 2, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', background: 'none' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: T.muted, marginBottom: 3 }}>{label}</div>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 6, color: T.text, fontSize: '0.72rem', fontFamily: 'monospace', padding: '3px 7px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  </div>
);

const PlacementPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const active = value || 'mid-center';
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>Text Position</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, background: T.inputBg, borderRadius: 8, padding: 4, border: `1px solid ${T.inputBorder}` }}>
        {PLACEMENT_GRID.map(([pos, icon]) => (
          <button key={pos} onClick={() => onChange(pos)} title={pos.replace('-', ' ')}
            style={{ border: `1px solid ${active === pos ? T.accent : 'transparent'}`, background: active === pos ? T.accentDim : 'transparent', borderRadius: 5, padding: '6px 0', cursor: 'pointer', fontSize: '1rem', color: active === pos ? T.accent : T.dim, fontWeight: active === pos ? 700 : 400, lineHeight: 1, transition: 'all 0.12s' }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Field group card ─────────────────────────────────────────────────────────

const FieldGroup: React.FC<{ label?: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, paddingLeft: 2 }}>
        {label}
      </div>
    )}
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
      {children}
    </div>
  </div>
);

// ─── Draggable item list ──────────────────────────────────────────────────────

function DraggableItemList({ items, onChange, renderItem }: {
  items: any[];
  onChange: (items: any[]) => void;
  renderItem: (item: any, update: (u: any) => void, remove: () => void, index: number, isExpanded: boolean, toggle: () => void) => React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            dragRef.current = null; setDragOver(null); setExpandedIdx(null);
          }}
          onDragEnd={() => { dragRef.current = null; setDragOver(null); }}
          style={{ border: `1px solid ${dragOver === i ? T.accent : T.border}`, borderRadius: 8, background: T.surface, overflow: 'hidden', transition: 'border-color 0.15s' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Drag handle */}
            <div style={{ padding: '10px 6px 10px 8px', cursor: 'grab', color: T.dim, flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 1 }} title="Drag to reorder">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
                <circle cx="2" cy="2.5" r="1.2"/><circle cx="6" cy="2.5" r="1.2"/>
                <circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>
                <circle cx="2" cy="11.5" r="1.2"/><circle cx="6" cy="11.5" r="1.2"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '8px 8px 8px 2px' }}>
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
        </div>
      ))}
    </div>
  );
}

// ─── Compact item row ─────────────────────────────────────────────────────────

function CompactItemRow({ label, sub, isExpanded, toggle, remove, children }: {
  label: string; sub?: string; isExpanded: boolean; toggle: () => void; remove: () => void; children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label || <span style={{ color: T.dim, fontStyle: 'italic' }}>Untitled</span>}
          </div>
          {sub && <div style={{ fontSize: '0.67rem', color: T.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{sub}</div>}
        </div>
        <button onClick={toggle} title={isExpanded ? 'Collapse' : 'Edit'}
          style={{ flexShrink: 0, background: isExpanded ? T.blueDim : 'transparent', border: `1px solid ${isExpanded ? T.blue : T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: isExpanded ? T.blue : T.muted, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button onClick={remove} title="Remove"
          style={{ flexShrink: 0, background: T.dangerDim, border: `1px solid rgba(248,113,113,0.25)`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: T.danger, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {isExpanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          {children}
        </div>
      )}
    </>
  );
}

const AddItemBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick} style={{
    width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 8,
    border: `1px dashed ${T.accent}`, background: T.accentDim, color: T.accent,
    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
  }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    {label}
  </button>
);

// ─── Section editor ────────────────────────────────────────────────────────────

function SectionEditor({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  if (section && !section.data) {
    section.data = {};
  }
  const set = (key: string, val: any) => onChange({ ...section, data: { ...section.data, [key]: val } });

  switch (section.type) {
    case 'hero': return (
      <>
        <FieldGroup label="Content">
          <EdInput label="Headline" value={section.data.title} onChange={v => set('title', v)} placeholder="Your Headline Here" />
          <FontPicker label="Headline Font" value={section.data.title_font || ''} onChange={v => set('title_font', v)} />
          <EdInput label="Subtext" value={section.data.subtitle} onChange={v => set('subtitle', v)} placeholder="Supporting description…" />
          <FontPicker label="Subtext Font" value={section.data.subtitle_font || ''} onChange={v => set('subtitle_font', v)} />
        </FieldGroup>
        <FieldGroup label="Background">
          <EdInput label="Image URL" value={section.data.bg_image} onChange={v => set('bg_image', v)} placeholder="https://…" />
          {section.data.bg_image && (
            <div style={{ borderRadius: 7, overflow: 'hidden', height: 64, background: T.inputBg, marginTop: -4, marginBottom: 8 }}>
              <img src={section.data.bg_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <EdInput label="Fallback Color" value={section.data.bg_color || ''} onChange={v => set('bg_color', v)} placeholder="#F0FDF4" mono />
        </FieldGroup>
        <FieldGroup label="Button">
          <EdInput label="Label" value={section.data.button_label} onChange={v => set('button_label', v)} placeholder="Shop Now" />
          <EdInput label="URL" value={section.data.button_url} onChange={v => set('button_url', v)} placeholder="/products" />
        </FieldGroup>
      </>
    );

    case 'rich_text': return (
      <FieldGroup>
        <EdInput label="Section Title (optional)" value={section.data.title} onChange={v => set('title', v)} />
        <EdInput label="HTML Content" value={section.data.html} onChange={v => set('html', v)} multiline placeholder="<p>Your content here…</p>" mono />
      </FieldGroup>
    );

    case 'image_text': return (
      <>
        <FieldGroup label="Text">
          <EdInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
          <EdInput label="Body" value={section.data.text} onChange={v => set('text', v)} multiline />
        </FieldGroup>
        <FieldGroup label="Image">
          <EdInput label="Image URL" value={section.data.image_url} onChange={v => set('image_url', v)} placeholder="https://…" />
          {section.data.image_url && (
            <div style={{ borderRadius: 7, overflow: 'hidden', height: 64, background: T.inputBg, marginTop: -4, marginBottom: 8 }}>
              <img src={section.data.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <EdSelect label="Position" value={section.data.image_side || 'right'} onChange={v => set('image_side', v)}
            options={[{ value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }]} />
        </FieldGroup>
      </>
    );

    case 'cards': return (
      <>
        <FieldGroup>
          <EdInput label="Section Title" value={section.data.title} onChange={v => set('title', v)} />
        </FieldGroup>
        <Label>Cards</Label>
        <DraggableItemList
          items={section.data.items || []}
          onChange={items => set('items', items)}
          renderItem={(item, update, remove, _i, isExpanded, toggle) => (
            <CompactItemRow label={`${item.icon || ''} ${item.title || 'Card'}`.trim()} sub={item.text?.substring(0, 40)} isExpanded={isExpanded} toggle={toggle} remove={remove}>
              <EdInput label="Icon / Emoji" value={item.icon} onChange={v => update({ ...item, icon: v })} placeholder="🌟" />
              <EdInput label="Title" value={item.title} onChange={v => update({ ...item, title: v })} />
              <EdInput label="Body Text" value={item.text} onChange={v => update({ ...item, text: v })} multiline />
              <FontPicker label="Font Override" value={item.title_font || ''} onChange={v => update({ ...item, title_font: v })} />
            </CompactItemRow>
          )}
        />
        <AddItemBtn onClick={() => set('items', [...(section.data.items || []), { icon: '⭐', title: 'New Card', text: '' }])} label="Add Card" />
      </>
    );

    case 'cta': return (
      <>
        <FieldGroup label="Copy">
          <EdInput label="Headline" value={section.data.title} onChange={v => set('title', v)} />
          <EdInput label="Subtext" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
        </FieldGroup>
        <FieldGroup label="Primary Button">
          <EdInput label="Label" value={section.data.button_label} onChange={v => set('button_label', v)} />
          <EdInput label="URL" value={section.data.button_url} onChange={v => set('button_url', v)} />
        </FieldGroup>
        <FieldGroup label="Secondary Button (optional)">
          <EdInput label="Label" value={section.data.button2_label} onChange={v => set('button2_label', v)} placeholder="Optional" />
          <EdInput label="URL" value={section.data.button2_url} onChange={v => set('button2_url', v)} />
        </FieldGroup>
        <FieldGroup label="Background">
          <EdInput label="Color" value={section.data.bg_color} onChange={v => set('bg_color', v)} placeholder="#F0FDF4" mono />
        </FieldGroup>
      </>
    );

    case 'contact_form': return (
      <FieldGroup>
        <EdInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
        <EdInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
      </FieldGroup>
    );

    case 'announcement_bar': return (
      <FieldGroup>
        <EdInput label="Message" value={section.data.text} onChange={v => set('text', v)} placeholder="🌿 FREE SHIPPING ABOVE ₹500" />
        <EdSelect label="Visibility" value={section.data.active === false ? 'false' : 'true'} onChange={v => set('active', v === 'true')}
          options={[{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }]} />
      </FieldGroup>
    );

    case 'banner_slider': {
      const banners: any[] = section.data.banners || [];
      return (
        <>
          <DraggableItemList
            items={banners}
            onChange={items => set('banners', items)}
            renderItem={(b, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow label={b.title || 'Untitled Banner'} sub={b.image_url ? 'Image set' : 'No image'} isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <FieldGroup label="Image">
                  <EdInput label="URL" value={b.image_url} onChange={v => update({ ...b, image_url: v })} placeholder="https://…" />
                  {b.image_url && (
                    <div style={{ borderRadius: 7, overflow: 'hidden', height: 64, background: T.inputBg, marginTop: -4, marginBottom: 8 }}>
                      <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <EdInput label="Click URL" value={b.link_url} onChange={v => update({ ...b, link_url: v })} placeholder="/products" />
                </FieldGroup>
                <PlacementPicker value={b.text_position || 'mid-center'} onChange={v => update({ ...b, text_position: v })} />
                <FieldGroup label="Overlay Text">
                  <EdInput label="Heading" value={b.title} onChange={v => update({ ...b, title: v })} />
                  <FontPicker label="Heading Font" value={b.title_font || ''} onChange={v => update({ ...b, title_font: v })} />
                  <EdInput label="Subtext" value={b.subtitle || ''} onChange={v => update({ ...b, subtitle: v })} />
                  <FontPicker label="Subtext Font" value={b.subtitle_font || ''} onChange={v => update({ ...b, subtitle_font: v })} />
                  <EdInput label="Button Label" value={b.button_label || ''} onChange={v => update({ ...b, button_label: v })} placeholder="Shop Now" />
                </FieldGroup>
              </CompactItemRow>
            )}
          />
          <AddItemBtn onClick={() => set('banners', [...banners, { title: '', subtitle: '', image_url: '', link_url: '', text_position: 'mid-center' }])} label="Add Banner" />
        </>
      );
    }

    case 'products_grid': return (
      <>
        <FieldGroup label="Labels">
          <EdInput label="Badge" value={section.data.badge} onChange={v => set('badge', v)} placeholder="Trending" />
          <EdInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
          <EdInput label="Subtitle" value={section.data.subtitle} onChange={v => set('subtitle', v)} />
        </FieldGroup>
        <FieldGroup label="Layout">
          <EdSelect label="Products to show" value={String(section.data.limit || 8)} onChange={v => set('limit', Number(v))}
            options={[4, 6, 8, 12, 16].map(n => ({ value: String(n), label: `${n} products` }))} />
          <EdSelect label="Columns" value={String(section.data.columns || 4)} onChange={v => set('columns', Number(v))}
            options={[{ value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }]} />
        </FieldGroup>
        <FieldGroup label="View All Link">
          <EdInput label="URL" value={section.data.view_all_url} onChange={v => set('view_all_url', v)} placeholder="/products" />
          <EdInput label="Label" value={section.data.view_all_label} onChange={v => set('view_all_label', v)} placeholder="VIEW ALL →" />
        </FieldGroup>
      </>
    );

    case 'features_strip': {
      const defaults = [
        { emoji: '🚚', title: 'Free & Fast Shipping', desc: 'Ships all over India at no additional costs.' },
        { emoji: '💵', title: 'Free COD Available', desc: 'Cash on Delivery available without any minimum order.' },
        { emoji: '↩️', title: 'Free & Easy Return', desc: 'Easy 7-day return policy for hassle-free experience.' },
        { emoji: '🎧', title: 'Expert Help & Support', desc: 'Monday – Friday (10:00 AM – 07:00 PM)' },
        { emoji: '🔒', title: '100% Payment Protection', desc: 'Secure checkout with easy return policy.' },
      ];
      const items: any[] = section.data.items?.length ? section.data.items : defaults;
      return (
        <>
          <DraggableItemList
            items={items}
            onChange={newItems => set('items', newItems)}
            renderItem={(f, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow label={`${f.emoji || ''} ${f.title || 'Feature'}`.trim()} sub={f.desc?.substring(0, 40)} isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <EdInput label="Icon / Emoji" value={f.emoji} onChange={v => update({ ...f, emoji: v })} placeholder="🚚" />
                <EdInput label="Title" value={f.title} onChange={v => update({ ...f, title: v })} />
                <EdInput label="Description" value={f.desc} onChange={v => update({ ...f, desc: v })} />
                <FontPicker label="Font Override" value={f.title_font || ''} onChange={v => update({ ...f, title_font: v })} />
              </CompactItemRow>
            )}
          />
          <AddItemBtn onClick={() => set('items', [...items, { emoji: '⭐', title: 'Feature', desc: '' }])} label="Add Feature" />
        </>
      );
    }

    case 'about_section': {
      const vals: any[] = section.data.values || [];
      return (
        <>
          <FieldGroup label="Content">
            <EdInput label="Title" value={section.data.title} onChange={v => set('title', v)} />
            <FontPicker label="Heading Font" value={section.data.title_font || ''} onChange={v => set('title_font', v)} />
            <EdInput label="Story / Content" value={section.data.content} onChange={v => set('content', v)} multiline />
            <EdInput label="Tagline" value={section.data.tagline} onChange={v => set('tagline', v)} placeholder='"Live Healthy. Stay Beautiful."' />
          </FieldGroup>
          <FieldGroup label="Button">
            <EdInput label="Label" value={section.data.button_label} onChange={v => set('button_label', v)} placeholder="Learn More About Us" />
            <EdInput label="URL" value={section.data.button_url} onChange={v => set('button_url', v)} placeholder="/about" />
          </FieldGroup>
          <Label>Value Cards</Label>
          <DraggableItemList
            items={vals}
            onChange={items => set('values', items)}
            renderItem={(v, update, remove, _i, isExpanded, toggle) => (
              <CompactItemRow label={`${v.icon || ''} ${v.label || 'Value'}`.trim()} sub={v.desc?.substring(0, 40)} isExpanded={isExpanded} toggle={toggle} remove={remove}>
                <EdInput label="Icon / Emoji" value={v.icon} onChange={val => update({ ...v, icon: val })} placeholder="🌱" />
                <EdInput label="Label" value={v.label} onChange={val => update({ ...v, label: val })} />
                <EdInput label="Description" value={v.desc} onChange={val => update({ ...v, desc: val })} />
              </CompactItemRow>
            )}
          />
          <AddItemBtn onClick={() => set('values', [...vals, { icon: '⭐', label: 'New Value', desc: '' }])} label="Add Value Card" />
        </>
      );
    }

    default:
      return <div style={{ fontSize: '0.82rem', color: T.dim }}>No editable fields for this section type.</div>;
  }
}

// ─── Add Section Modal ────────────────────────────────────────────────────────

function AddSectionModal({ onAdd, onClose }: { onAdd: (t: SectionType) => void; onClose: () => void }) {
  const [hover, setHover] = useState<SectionType | null>(null);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, width: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Add Section</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Choose a block to insert into this page</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#64748b', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ overflow: 'auto', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(Object.keys(SECTION_META) as SectionType[]).map(type => {
            const meta = SECTION_META[type];
            const isHov = hover === type;
            return (
              <button key={type} onClick={() => { onAdd(type); onClose(); }}
                onMouseEnter={() => setHover(type)}
                onMouseLeave={() => setHover(null)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 14px', borderRadius: 11, border: `1px solid ${isHov ? T.accent : T.border}`, background: isHov ? T.accentDim : T.surface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: isHov ? 'rgba(21,128,61,0.1)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHov ? T.accent : T.muted, flexShrink: 0, transition: 'all 0.15s', border: `1px solid ${isHov ? T.accent : T.border}` }}>
                  {meta.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 700, color: isHov ? T.accent : T.text, transition: 'color 0.15s' }}>{meta.label}</div>
                  <div style={{ fontSize: '0.71rem', color: T.dim, marginTop: 2, lineHeight: 1.4 }}>{meta.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Nav item types ───────────────────────────────────────────────────────────

interface HeaderNavChild { title: string; url: string; }
interface HeaderNavItem { title: string; url: string; children?: HeaderNavChild[]; }

const DEFAULT_NAV_ITEMS: HeaderNavItem[] = [
  { title: 'Home', url: '/' },
  { title: 'Products', url: '/products' },
  { title: 'Collections', url: '/collections' },
  { title: 'About Us', url: '/about' },
  { title: 'Contact Us', url: '/contact' },
];

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [headerMode, setHeaderMode] = useState(false);
  const [headerNavItems, setHeaderNavItems] = useState<HeaderNavItem[]>(DEFAULT_NAV_ITEMS);
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [headerSaveStatus, setHeaderSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const headerSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [themeMode, setThemeMode] = useState(false);
  const [themeSettings, setThemeSettings] = useState<typeof DEFAULT_THEME>({ ...DEFAULT_THEME });
  const themeSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [footerMode, setFooterMode] = useState(false);
  const [footerSettings, setFooterSettings] = useState({
    footer_tagline: 'Quality products, delivered with care.',
    footer_copyright: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_instagram: '',
    social_facebook: '',
    social_twitter: '',
    social_youtube: '',
    social_linkedin: '',
    social_pinterest: '',
    footer_newsletter: 'true',
    footer_newsletter_heading: 'Stay in the loop',
    footer_newsletter_placeholder: 'Enter your email',
    footer_col1_title: 'Shop',
    footer_col1_links: JSON.stringify([{ title: 'Home', url: '/' }, { title: 'All Products', url: '/products' }, { title: 'Collections', url: '/collections' }, { title: 'Search', url: '/search' }]),
    footer_col2_title: 'Account',
    footer_col2_links: JSON.stringify([{ title: 'Sign In', url: '/login' }, { title: 'Create Account', url: '/register' }, { title: 'My Orders', url: '/account/orders' }, { title: 'Wishlist', url: '/wishlist' }, { title: 'Track Order', url: '/track-order' }]),
    footer_col3_title: 'Information',
    footer_menu: JSON.stringify([{ title: 'About Us', url: '/about' }, { title: 'Contact Us', url: '/contact' }, { title: 'Privacy Policy', url: '/privacy' }, { title: 'Terms & Conditions', url: '/terms' }, { title: 'Refund Policy', url: '/refund' }]),
    footer_bottom_links: JSON.stringify([{ title: 'Privacy', url: '/privacy' }, { title: 'Terms', url: '/terms' }, { title: 'Sitemap', url: '/sitemap' }]),
  });
  const footerSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [expandedChildIdx, setExpandedChildIdx] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const shopSlug = typeof window !== 'undefined' ? (localStorage.getItem('oaksol_active_shop_slug') || 'testShop') : 'testShop';

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
    ]).then(([pageData, collections]: [any, any[]]) => {
      let navItems: HeaderNavItem[] = DEFAULT_NAV_ITEMS;
      if (pageData?.content?.navbar_menu) {
        try {
          const parsed: HeaderNavItem[] = JSON.parse(pageData.content.navbar_menu);
          navItems = parsed.filter(item => !item.url?.startsWith('/categories'));
        } catch {}
      }
      navItems = navItems.map((item: HeaderNavItem) => {
        if (item.children !== undefined) return item;
        if (item.url === '/collections' && collections.length > 0) return { ...item, children: collections.map((c: any) => ({ title: c.name, url: `/collections/${c.slug}` })) };
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
          color_footer_bg: tc.color_footer_bg || DEFAULT_THEME.color_footer_bg,
        });
        setFooterSettings(prev => {
          const n = { ...prev };
          const keys = Object.keys(prev) as (keyof typeof prev)[];
          keys.forEach(k => { if (tc[k] !== undefined && tc[k] !== null) (n as any)[k] = tc[k]; });
          if (n.footer_col1_links) {
            try {
              const links = JSON.parse(n.footer_col1_links).filter((l: any) => !l.url?.startsWith('/categories'));
              n.footer_col1_links = JSON.stringify(links);
            } catch {}
          }
          return n;
        });
      }
    }).catch(() => {});
  }, []);

  const loadPage = (page: PageItem) => {
    setActivePage(page);
    setDraftSections((page.draft_sections ?? page.sections ?? []) as Section[]);
    setSelectedIdx(null); setShowAddPicker(false); setSaveStatus('idle'); setIsDirty(false);
  };

  const sendPreview = useCallback((sections: Section[]) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'page_preview', sections }, '*');
  }, []);
  const sendHeaderPreview = useCallback((items: HeaderNavItem[], logo: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SETTINGS_UPDATE', payload: { logo_url: logo, navbar_menu: JSON.stringify(items) } }, '*');
  }, []);
  const sendThemePreview = useCallback((theme: typeof DEFAULT_THEME) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'THEME_UPDATE', payload: theme }, '*');
  }, []);

  const latestRef = useRef({ sections: draftSections, theme: themeSettings });
  latestRef.current = { sections: draftSections, theme: themeSettings };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview_ready') {
        sendThemePreview(latestRef.current.theme);
        sendPreview(latestRef.current.sections);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendPreview, sendThemePreview]);

  useEffect(() => {
    if (!headerMode) return;
    const handler = (e: MessageEvent) => { if (e.data?.type === 'preview_ready') sendHeaderPreview(headerNavItems, headerLogoUrl); };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [headerMode, headerNavItems, headerLogoUrl, sendHeaderPreview]);

  const updateHeader = (items: HeaderNavItem[], logo: string) => {
    setHeaderNavItems(items); setHeaderLogoUrl(logo); setIsDirty(true); sendHeaderPreview(items, logo);
    if (headerSaveTimer.current) clearTimeout(headerSaveTimer.current);
    headerSaveTimer.current = setTimeout(async () => {
      setHeaderSaveStatus('saving');
      try { await merchantApi.savePageContent({ logo_url: logo, navbar_menu: JSON.stringify(items) }); setIsDirty(false); setHeaderSaveStatus('saved'); setTimeout(() => setHeaderSaveStatus('idle'), 2000); }
      catch { setHeaderSaveStatus('idle'); }
    }, 1500);
  };

  const updateTheme = (theme: typeof DEFAULT_THEME) => {
    setThemeSettings(theme); setIsDirty(true); sendThemePreview(theme);
    if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    themeSaveTimer.current = setTimeout(async () => {
      setHeaderSaveStatus('saving');
      try { await merchantApi.savePageContent({ ...theme }); setIsDirty(false); setHeaderSaveStatus('saved'); setTimeout(() => setHeaderSaveStatus('idle'), 2000); }
      catch { setHeaderSaveStatus('idle'); }
    }, 1500);
  };

  const sendFooterPreview = (settings: typeof footerSettings) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SETTINGS_UPDATE', payload: settings }, '*');
  };

  const updateFooter = (settings: typeof footerSettings) => {
    setFooterSettings(settings); setIsDirty(true); sendFooterPreview(settings);
    if (footerSaveTimer.current) clearTimeout(footerSaveTimer.current);
    footerSaveTimer.current = setTimeout(async () => {
      setHeaderSaveStatus('saving');
      try { await merchantApi.savePageContent({ ...settings }); setIsDirty(false); setHeaderSaveStatus('saved'); setTimeout(() => setHeaderSaveStatus('idle'), 2000); }
      catch { setHeaderSaveStatus('idle'); }
    }, 1500);
  };

  const updateSections = (sections: Section[]) => {
    setDraftSections(sections); setIsDirty(true); sendPreview(sections);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!activePage) return;
      setSaveStatus('saving');
      try {
        await merchantApi.saveDraft(activePage.id, sections);
        await merchantApi.publishPage(activePage.id);
        setIsDirty(false); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 2000);
  };

  const addSection = (type: SectionType) => {
    const next = [...draftSections, { type, data: { ...DEFAULT_SECTION_DATA[type] } }];
    updateSections(next); setSelectedIdx(next.length - 1);
  };
  const updateSection = (idx: number, section: Section) => updateSections(draftSections.map((s, i) => i === idx ? section : s));
  const removeSection = (idx: number) => { updateSections(draftSections.filter((_, i) => i !== idx)); setSelectedIdx(null); };
  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...draftSections]; const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]]; updateSections(next); setSelectedIdx(t);
  };

  const switchPage = async (pageId: string) => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); if (activePage) { await merchantApi.saveDraft(activePage.id, draftSections).catch(() => {}); await merchantApi.publishPage(activePage.id).catch(() => {}); } }
    const page = pages.find(p => p.id === pageId); if (page) loadPage(page);
  };

  const handlePublish = async () => {
    if (!activePage) return; setSaveStatus('publishing');
    try { await merchantApi.saveDraft(activePage.id, draftSections); await merchantApi.publishPage(activePage.id); setIsDirty(false); setSaveStatus('published'); setActivePage(prev => prev ? { ...prev, status: 'published' } : null); setTimeout(() => setSaveStatus('idle'), 3000); }
    catch { setSaveStatus('idle'); }
  };
  const handleExit = () => { if (isDirty) { setShowExitModal(true); return; } router.push('/'); };
  const handleSaveAndExit = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (headerSaveTimer.current) clearTimeout(headerSaveTimer.current);
    if (themeSaveTimer.current) clearTimeout(themeSaveTimer.current);
    try { if (activePage) { await merchantApi.saveDraft(activePage.id, draftSections); await merchantApi.publishPage(activePage.id); } await merchantApi.savePageContent({ logo_url: headerLogoUrl, navbar_menu: JSON.stringify(headerNavItems), ...themeSettings }); } catch {}
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem', gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        Loading editor…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const iframeSlug = (activePage?.slug === 'home' || activePage?.slug === 'index') ? '' : (activePage?.slug ?? '');
  const iframeUrl = (headerMode || themeMode) ? `http://${shopSlug}.localhost:3001/?preview=1` : `http://${shopSlug}.localhost:3001/${iframeSlug}?preview=1`;

  // Sidebar panel type
  type SidePanel = 'sections' | 'header' | 'theme' | 'footer' | 'section-edit';
  const sidePanel: SidePanel = themeMode ? 'theme' : headerMode ? 'header' : footerMode ? 'footer' : selectedIdx !== null ? 'section-edit' : 'sections';

  const statusLabel = headerMode
    ? (headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : '')
    : (saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'publishing' ? 'Publishing…' : saveStatus === 'published' ? '✓ Published!' : '');

  const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', color: T.muted, fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.borderColor = T.muted; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Go back
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#e8edf2', display: 'flex', flexDirection: 'column', zIndex: 100, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        textarea::placeholder, input::placeholder { color: #94a3b8; }
        select option { background: #ffffff; color: #0f172a; }
      `}</style>

      {/* ── Exit modal ── */}
      {showExitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text, marginBottom: 5 }}>Unsaved changes</div>
                <div style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.6 }}>You have unsaved changes. Save a draft to keep them, or exit to discard.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExitModal(false)}
                style={{ padding: '7px 14px', borderRadius: 8, background: T.surface, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button onClick={() => { setShowExitModal(false); router.push('/'); }}
                style={{ padding: '7px 14px', borderRadius: 8, background: T.dangerDim, color: T.danger, border: `1px solid rgba(248,113,113,0.3)`, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Exit without saving
              </button>
              <button onClick={handleSaveAndExit}
                style={{ padding: '7px 16px', borderRadius: 8, background: '#15803d', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                Save & exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ height: 50, background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0 }}>
        {/* Left: Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleExit}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 32, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer', fontWeight: 600, fontSize: '0.76rem', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.muted; (e.currentTarget as HTMLElement).style.color = T.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.muted; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Exit
          </button>
        </div>

        {/* Center: Page selector + status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Select
            value={activePage?.id ?? ''}
            onChange={v => { setHeaderMode(false); setThemeMode(false); switchPage(v); }}
            options={(pages || []).filter(Boolean).map(p => ({ value: p.id, label: p.title || 'Untitled Page' }))}
            style={{ minWidth: 120, maxWidth: 200, width: 'auto' }}
          />
          {activePage && (
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
              background: activePage.status === 'published' ? 'rgba(21,128,61,0.1)' : 'rgba(217,119,6,0.1)',
              color: activePage.status === 'published' ? T.accent : '#b45309',
              border: `1px solid ${activePage.status === 'published' ? 'rgba(21,128,61,0.25)' : 'rgba(217,119,6,0.25)'}` }}>
              {activePage.status === 'published' ? 'Live' : 'Draft'}
            </span>
          )}
        </div>

        {/* Right: status + viewport + save + publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          {statusLabel && (
            <span style={{ fontSize: '0.72rem', color: statusLabel.includes('✓') ? T.accent : T.muted }}>
              {statusLabel}
            </span>
          )}

          <div style={{ display: 'flex', background: T.surface, borderRadius: 8, padding: 2, border: `1px solid ${T.border}` }}>
            {(['desktop', 'mobile'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                style={{ width: 30, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  background: viewMode === mode ? '#ffffff' : 'transparent', color: viewMode === mode ? T.text : T.dim,
                  boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {mode === 'desktop'
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>}
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              if (!activePage) return;
              if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
              setSaveStatus('saving');
              try { await merchantApi.saveDraft(activePage.id, draftSections); await merchantApi.publishPage(activePage.id); setIsDirty(false); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }
              catch { setSaveStatus('idle'); }
            }}
            style={{ padding: '0 14px', height: 32, borderRadius: 8, background: T.surface, color: T.text, border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', transition: 'all 0.15s' }}>
            Save
          </button>

          <button onClick={handlePublish} disabled={saveStatus === 'publishing'}
            style={{ padding: '0 16px', height: 32, borderRadius: 8, background: '#15803d', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', transition: 'opacity 0.15s',
              opacity: saveStatus === 'publishing' ? 0.7 : 1 }}>
            {saveStatus === 'publishing' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {showAddPicker && <AddSectionModal onAdd={addSection} onClose={() => setShowAddPicker(false)} />}

        {/* ── Sidebar ── */}
        <div style={{ width: 360, background: T.bg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

          {/* Theme panel */}
          {sidePanel === 'theme' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <BackBtn onClick={() => setThemeMode(false)} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Theme</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
                {/* Presets */}
                <div style={{ marginBottom: 18 }}>
                  <Label>Quick Presets</Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {THEME_PRESETS.map(p => (
                      <button key={p.label} onClick={() => updateTheme({ ...themeSettings, ...p.colors, ...p.fonts })}
                        style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, color: T.muted, transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.accent; (e.currentTarget as HTMLElement).style.color = T.accent; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.muted; }}>
                        {p.label}
                      </button>
                    ))}
                    <button onClick={() => updateTheme({ ...DEFAULT_THEME })}
                      style={{ padding: '4px 12px', borderRadius: 99, border: `1px dashed ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 500, color: T.dim }}>
                      Reset
                    </button>
                  </div>
                </div>

                {/* Typography */}
                <div style={{ marginBottom: 16 }}>
                  <Label>Typography</Label>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <FontPicker label="Heading Font" value={themeSettings.font_heading} onChange={v => updateTheme({ ...themeSettings, font_heading: v })} />
                    <FontPicker label="Body Font" value={themeSettings.font_body} onChange={v => updateTheme({ ...themeSettings, font_body: v })} />
                    <div style={{ fontSize: '0.66rem', color: T.dim, marginTop: -4 }}>Individual widgets can override per-item.</div>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <Label>Colors</Label>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <ColorRow label="Page Background" value={themeSettings.color_bg} onChange={v => updateTheme({ ...themeSettings, color_bg: v })} />
                    <ColorRow label="Card / Surface" value={themeSettings.color_surface} onChange={v => updateTheme({ ...themeSettings, color_surface: v })} />
                    <ColorRow label="Main Text" value={themeSettings.color_text} onChange={v => updateTheme({ ...themeSettings, color_text: v })} />
                    <ColorRow label="Muted Text" value={themeSettings.color_muted} onChange={v => updateTheme({ ...themeSettings, color_muted: v })} />
                    <ColorRow label="Button / Primary" value={themeSettings.color_primary} onChange={v => updateTheme({ ...themeSettings, color_primary: v })} />
                    <ColorRow label="Accent / Highlight" value={themeSettings.color_accent} onChange={v => updateTheme({ ...themeSettings, color_accent: v })} />
                    <ColorRow label="Accent Hover" value={themeSettings.color_accent_hover} onChange={v => updateTheme({ ...themeSettings, color_accent_hover: v })} />
                    <ColorRow label="Border" value={themeSettings.color_border} onChange={v => updateTheme({ ...themeSettings, color_border: v })} />
                    <ColorRow label="Footer Background" value={themeSettings.color_footer_bg} onChange={v => updateTheme({ ...themeSettings, color_footer_bg: v })} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: `1px solid ${T.border}`, fontSize: '0.68rem', color: T.dim, textAlign: 'center' }}>
                {headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : 'Changes auto-save in 1.5s'}
              </div>
            </div>
          )}

          {/* Header panel */}
          {sidePanel === 'header' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <BackBtn onClick={() => setHeaderMode(false)} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Header</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
                {/* Logo */}
                <div style={{ marginBottom: 16 }}>
                  <Label>Logo</Label>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <EdInput label="Image URL" value={headerLogoUrl} onChange={url => updateHeader(headerNavItems, url)} placeholder="https://cdn.example.com/logo.png" />
                    {headerLogoUrl && (
                      <div style={{ marginTop: -4, marginBottom: 4, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
                        <img src={headerLogoUrl} alt="Logo" style={{ maxHeight: 36, maxWidth: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
                {/* Nav links */}
                <div>
                  <Label>Navigation Links</Label>
                  <DraggableItemList
                    items={headerNavItems}
                    onChange={items => { updateHeader(items, headerLogoUrl); setExpandedChildIdx(null); }}
                    renderItem={(item, update, remove, _navIdx, isExpanded, toggle) => {
                      const children: HeaderNavChild[] = item.children || [];
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title || <span style={{ color: T.dim, fontStyle: 'italic' }}>Untitled</span>}
                                {children.length > 0 && <span style={{ fontSize: '0.65rem', color: T.accent, fontWeight: 500, marginLeft: 6 }}>▾ {children.length}</span>}
                              </div>
                              <div style={{ fontSize: '0.67rem', color: T.dim }}>{item.url}</div>
                            </div>
                            <button onClick={() => { toggle(); setExpandedChildIdx(null); }}
                              style={{ background: isExpanded ? T.blueDim : 'transparent', border: `1px solid ${isExpanded ? T.blue : T.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: isExpanded ? T.blue : T.muted, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            <button onClick={remove}
                              style={{ background: T.dangerDim, border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                          {isExpanded && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                              <EdInput label="Label" value={item.title} onChange={v => update({ ...item, title: v })} placeholder="Products" />
                              <EdInput label="URL" value={item.url} onChange={v => update({ ...item, url: v })} placeholder="/products" />
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <Label>Dropdown {children.filter(Boolean).length > 0 && `(${children.filter(Boolean).length})`}</Label>
                                  <button onClick={() => { update({ ...item, children: [...children, { title: '', url: '' }] }); setExpandedChildIdx(children.length); }}
                                    style={{ fontSize: '0.68rem', color: T.accent, background: T.accentDim, border: `1px solid ${T.accent}`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontWeight: 600 }}>
                                    + Add
                                    </button>
                                </div>
                                {children.filter(Boolean).length === 0 && <div style={{ fontSize: '0.68rem', color: T.dim, fontStyle: 'italic', marginBottom: 6 }}>No sub-items — opens as direct link</div>}
                                {children.filter(Boolean).map((child, ci) => {
                                  const isChildOpen = expandedChildIdx === ci;
                                  return (
                                    <div key={ci} style={{ border: `1px solid ${isChildOpen ? T.blue : T.border}`, borderRadius: 8, marginBottom: 4, background: isChildOpen ? T.blueDim : T.inputBg, overflow: 'hidden' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {child.title || <span style={{ color: T.dim, fontStyle: 'italic' }}>Untitled</span>}
                                          </div>
                                          <div style={{ fontSize: '0.65rem', color: T.dim }}>{child.url}</div>
                                        </div>
                                        <button onClick={() => setExpandedChildIdx(isChildOpen ? null : ci)}
                                          style={{ background: isChildOpen ? T.blueDim : 'transparent', border: `1px solid ${isChildOpen ? T.blue : T.border}`, borderRadius: 5, padding: '2px 6px', cursor: 'pointer', color: isChildOpen ? T.blue : T.muted, display: 'flex', alignItems: 'center' }}>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isChildOpen ? 'rotate(180deg)' : undefined }}><polyline points="6 9 12 15 18 9"/></svg>
                                        </button>
                                        <button onClick={() => { update({ ...item, children: children.filter((_, j) => j !== ci) }); if (expandedChildIdx === ci) setExpandedChildIdx(null); }}
                                          style={{ background: T.dangerDim, border: '1px solid rgba(248,113,113,0.25)', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center' }}>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                      </div>
                                      {isChildOpen && (
                                        <div style={{ padding: '0 8px 8px', borderTop: `1px solid ${T.border}` }}>
                                          <div style={{ paddingTop: 8 }}>
                                            <EdInput label="Label" value={child.title} onChange={v => { const ch = [...children]; ch[ci] = { ...ch[ci], title: v }; update({ ...item, children: ch }); }} placeholder="Sub Page" />
                                            <EdInput label="URL" value={child.url} onChange={v => { const ch = [...children]; ch[ci] = { ...ch[ci], url: v }; update({ ...item, children: ch }); }} placeholder="/sub-page" />
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
                  <AddItemBtn onClick={() => updateHeader([...headerNavItems, { title: 'New Link', url: '/' }], headerLogoUrl)} label="Add Link" />
                </div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: `1px solid ${T.border}`, fontSize: '0.68rem', color: T.dim, textAlign: 'center' }}>
                {headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : 'Changes auto-save in 1.5s'}
              </div>
            </div>
          )}

          {/* Footer panel */}
          {sidePanel === 'footer' && (() => {
            const fs = footerSettings;
            const upd = (patch: Partial<typeof fs>) => updateFooter({ ...fs, ...patch });
            const tog = (key: 'footer_newsletter') => upd({ [key]: fs[key] === 'true' ? 'false' : 'true' } as any);
            const parseLinks = (json: string) => { try { return JSON.parse(json); } catch { return []; } };
            const saveLinks = (key: keyof typeof fs, arr: any[]) => upd({ [key]: JSON.stringify(arr) } as any);

            const Toggle = ({ label, k }: { label: string; k: 'footer_newsletter' }) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: '0.78rem', color: T.text, fontWeight: 500 }}>{label}</span>
                <button onClick={() => tog(k)}
                  style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: fs[k] === 'true' ? T.accent : T.surface, flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, transition: 'left 0.2s', left: fs[k] === 'true' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            );

            const ColEditor = ({ titleKey, linksKey }: { titleKey: 'footer_col1_title' | 'footer_col2_title' | 'footer_col3_title'; linksKey: 'footer_col1_links' | 'footer_col2_links' | 'footer_menu' }) => {
              const links = parseLinks(fs[linksKey]);
              return (
                <FieldGroup label={fs[titleKey]}>
                  <EdInput label="Column Heading" value={fs[titleKey]} onChange={v => upd({ [titleKey]: v } as any)} placeholder="e.g. Shop" />
                  <div style={{ marginTop: 4 }}>
                    <Label>Links</Label>
                    <DraggableItemList
                      items={links}
                      onChange={arr => saveLinks(linksKey, arr)}
                      renderItem={(item, update, remove, _i, expanded, toggle) => (
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                            <span style={{ flex: 1, fontSize: '0.78rem', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled'}</span>
                            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '0.7rem', padding: '2px 4px' }}>{expanded ? '▲' : '▼'}</button>
                            <button onClick={remove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, fontSize: '0.7rem', padding: '2px 4px' }}>✕</button>
                          </div>
                          {expanded && (
                            <div style={{ padding: '6px 8px 8px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <EdInput label="Label" value={item.title} onChange={v => update({ ...item, title: v })} placeholder="Link label" />
                              <EdInput label="URL" value={item.url} onChange={v => update({ ...item, url: v })} placeholder="/page-slug" />
                            </div>
                          )}
                        </div>
                      )}
                    />
                    <AddItemBtn onClick={() => saveLinks(linksKey, [...links, { title: 'New Link', url: '/' }])} label="Add Link" />
                  </div>
                </FieldGroup>
              );
            };

            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <BackBtn onClick={() => setFooterMode(false)} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Footer Settings</span>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Store Info */}
                  <FieldGroup label="Store Info">
                    <EdInput label="Tagline" value={fs.footer_tagline} onChange={v => upd({ footer_tagline: v })} placeholder="Quality products, delivered with care." />
                    <EdInput label="Copyright" value={fs.footer_copyright} onChange={v => upd({ footer_copyright: v })} placeholder={`© ${new Date().getFullYear()} My Store. All rights reserved.`} />
                  </FieldGroup>

                  {/* Newsletter */}
                  <FieldGroup label="Newsletter">
                    <Toggle label="Show Newsletter Bar" k="footer_newsletter" />
                    {fs.footer_newsletter === 'true' && (
                      <>
                        <EdInput label="Heading" value={fs.footer_newsletter_heading} onChange={v => upd({ footer_newsletter_heading: v })} placeholder="Stay in the loop" />
                        <EdInput label="Input Placeholder" value={fs.footer_newsletter_placeholder} onChange={v => upd({ footer_newsletter_placeholder: v })} placeholder="Enter your email" />
                      </>
                    )}
                  </FieldGroup>

                  {/* Contact */}
                  <FieldGroup label="Contact Info">
                    <EdInput label="Email" value={fs.contact_email} onChange={v => upd({ contact_email: v })} placeholder="hello@mystore.com" />
                    <EdInput label="Phone" value={fs.contact_phone} onChange={v => upd({ contact_phone: v })} placeholder="+91 99999 99999" />
                    <EdInput label="Address" value={fs.contact_address} onChange={v => upd({ contact_address: v })} placeholder="123 Main St, Mumbai" multiline />
                  </FieldGroup>

                  {/* Social */}
                  <FieldGroup label="Social Links">
                    <EdInput label="Instagram" value={fs.social_instagram} onChange={v => upd({ social_instagram: v })} placeholder="https://instagram.com/yourstore" />
                    <EdInput label="Facebook" value={fs.social_facebook} onChange={v => upd({ social_facebook: v })} placeholder="https://facebook.com/yourstore" />
                    <EdInput label="Twitter / X" value={fs.social_twitter} onChange={v => upd({ social_twitter: v })} placeholder="https://x.com/yourstore" />
                    <EdInput label="YouTube" value={fs.social_youtube} onChange={v => upd({ social_youtube: v })} placeholder="https://youtube.com/@yourstore" />
                    <EdInput label="LinkedIn" value={fs.social_linkedin} onChange={v => upd({ social_linkedin: v })} placeholder="https://linkedin.com/company/yourstore" />
                    <EdInput label="Pinterest" value={fs.social_pinterest} onChange={v => upd({ social_pinterest: v })} placeholder="https://pinterest.com/yourstore" />
                  </FieldGroup>

                  {/* Columns */}
                  <ColEditor titleKey="footer_col1_title" linksKey="footer_col1_links" />
                  <ColEditor titleKey="footer_col2_title" linksKey="footer_col2_links" />
                  <ColEditor titleKey="footer_col3_title" linksKey="footer_menu" />

                  {/* Bottom bar links */}
                  <FieldGroup label="Bottom Bar Links">
                    {(() => {
                      const links = parseLinks(fs.footer_bottom_links);
                      return (
                        <>
                          <DraggableItemList
                            items={links}
                            onChange={arr => saveLinks('footer_bottom_links', arr)}
                            renderItem={(item, update, remove, _i, expanded, toggle) => (
                              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                                  <span style={{ flex: 1, fontSize: '0.78rem', color: T.text }}>{item.title || 'Untitled'}</span>
                                  <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '0.7rem', padding: '2px 4px' }}>{expanded ? '▲' : '▼'}</button>
                                  <button onClick={remove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, fontSize: '0.7rem', padding: '2px 4px' }}>✕</button>
                                </div>
                                {expanded && (
                                  <div style={{ padding: '6px 8px 8px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <EdInput label="Label" value={item.title} onChange={v => update({ ...item, title: v })} placeholder="Privacy" />
                                    <EdInput label="URL" value={item.url} onChange={v => update({ ...item, url: v })} placeholder="/privacy" />
                                  </div>
                                )}
                              </div>
                            )}
                          />
                          <AddItemBtn onClick={() => saveLinks('footer_bottom_links', [...links, { title: 'New Link', url: '/' }])} label="Add Link" />
                        </>
                      );
                    })()}
                  </FieldGroup>

                </div>
                <div style={{ padding: '8px 12px', borderTop: `1px solid ${T.border}`, fontSize: '0.68rem', color: T.dim, textAlign: 'center' }}>
                  {headerSaveStatus === 'saving' ? 'Saving…' : headerSaveStatus === 'saved' ? '✓ Saved' : 'Changes auto-save in 1.5s'}
                </div>
              </div>
            );
          })()}

          {/* Section editor panel */}
          {sidePanel === 'section-edit' && selectedIdx !== null && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                {/* Row 1: Back + Remove */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px 6px' }}>
                  <BackBtn onClick={() => setSelectedIdx(null)} />
                  <button onClick={() => removeSection(selectedIdx)}
                    style={{ background: T.dangerDim, border: `1px solid rgba(220,38,38,0.2)`, color: T.danger, borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    Remove
                  </button>
                </div>
                {/* Row 2: Section icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentDim, border: `1px solid ${T.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, flexShrink: 0 }}>
                    {SECTION_META[draftSections[selectedIdx]?.type]?.icon}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text }}>
                    {SECTION_META[draftSections[selectedIdx]?.type]?.label}
                  </span>
                </div>
              </div>
              {/* Move up/down */}
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                <button onClick={() => moveSection(selectedIdx, -1)} disabled={selectedIdx === 0}
                  style={{ flex: 1, padding: '5px 0', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: selectedIdx === 0 ? T.dim : T.muted, cursor: selectedIdx === 0 ? 'default' : 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: selectedIdx === 0 ? 0.4 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                  Move Up
                </button>
                <button onClick={() => moveSection(selectedIdx, 1)} disabled={selectedIdx === draftSections.length - 1}
                  style={{ flex: 1, padding: '5px 0', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: selectedIdx === draftSections.length - 1 ? T.dim : T.muted, cursor: selectedIdx === draftSections.length - 1 ? 'default' : 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: selectedIdx === draftSections.length - 1 ? 0.4 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  Move Down
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
                {draftSections[selectedIdx] && (
                  <SectionEditor section={draftSections[selectedIdx]} onChange={s => updateSection(selectedIdx, s)} />
                )}
              </div>
            </div>
          )}

          {/* Sections list panel */}
          {sidePanel === 'sections' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header + Theme entry rows */}
              <div style={{ flexShrink: 0 }}>
                {[
                  { key: 'header', label: 'Header', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="5" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>, onClick: () => setHeaderMode(true) },
                  { key: 'theme', label: 'Theme & Colors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>, onClick: () => setThemeMode(true) },
                  { key: 'footer', label: 'Footer', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="16" width="18" height="5" rx="1"/><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/></svg>, onClick: () => setFooterMode(true) },
                ].map(item => (
                  <button key={item.key} onClick={item.onClick}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.surface}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{item.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
                <div style={{ padding: '6px 14px 4px', fontSize: '0.62rem', fontWeight: 700, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${T.border}` }}>
                  Page Sections
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                {draftSections.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: '0.82rem', color: T.dim, lineHeight: 1.6 }}>No sections yet.<br />Add one to get started.</div>
                  </div>
                )}
                {draftSections.map((s, i) => {
                  const meta = SECTION_META[s.type];
                  const isSelected = selectedIdx === i;
                  return (
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
                        dragIdx.current = null; setDragOverIdx(null);
                      }}
                      onDragEnd={() => { dragIdx.current = null; setDragOverIdx(null); }}
                      style={{ display: 'flex', alignItems: 'center', borderBottom: dragOverIdx === i ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: isSelected ? T.accentDim : 'transparent', transition: 'background 0.15s' }}>
                      {/* Drag handle */}
                      <div style={{ padding: '10px 6px 10px 10px', cursor: 'grab', color: T.dim, flexShrink: 0 }}>
                        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                          <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
                          <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
                          <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
                        </svg>
                      </div>
                      <button onClick={() => setSelectedIdx(i)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px 9px 2px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: isSelected ? T.accentDim : T.surface, border: `1px solid ${isSelected ? T.accent : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? T.accent : T.muted, flexShrink: 0, transition: 'all 0.15s' }}>
                          {meta?.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                            {s.data?.title || (s as any).title || (s as any).content || meta?.label || 'Text Section'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: T.dim, marginTop: 1 }}>{meta?.label}</div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isSelected ? T.accent : T.dim} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: 10, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
                <button onClick={() => setShowAddPicker(true)}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 9, background: T.accentDim, color: T.accent, border: `1px dashed ${T.accent}`, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,212,114,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.accentDim; }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Section
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#dde3ea', overflow: 'auto', padding: viewMode === 'mobile' ? '24px 24px' : '20px' }}>
          <div style={{
            width: viewMode === 'mobile' ? 390 : '100%',
            maxWidth: viewMode === 'mobile' ? 390 : 1280,
            height: viewMode === 'mobile' ? undefined : '100%',
            minHeight: viewMode === 'mobile' ? '80vh' : undefined,
            background: '#fff', borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 2px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
          }}>
            <iframe ref={iframeRef} src={iframeUrl} style={{ width: '100%', height: viewMode === 'mobile' ? '100%' : '100%', minHeight: viewMode === 'mobile' ? '80vh' : undefined, border: 'none', display: 'block' }} title="Preview"
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
