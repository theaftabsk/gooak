'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search, X, Tag } from 'lucide-react';
import { TAXONOMY, FLAT_TAXONOMY, type TaxonomyNode, type FlatCategory } from '@/lib/taxonomy';
import { merchantApi } from '@/lib/api-client';

interface CategoryPickerProps {
  value?: string | null;       // category_id from DB
  valuePath?: string | null;   // full path string e.g. "Health & Beauty > Skin Care"
  onChange: (categoryId: string | null, pathLabel: string | null) => void;
}

// ── Tree node renderer ──────────────────────────────────────────────────────

function TreeNode({
  node,
  path,
  pathSlugs,
  selectedSlug,
  onSelect,
  depth = 0,
}: {
  node: TaxonomyNode;
  path: string[];
  pathSlugs: string[];
  selectedSlug: string | null;
  onSelect: (cat: FlatCategory) => void;
  depth?: number;
}) {
  const hasChildren = !!node.children?.length;
  const [open, setOpen] = useState(false);
  const currentPath = [...path, node.name];
  const currentSlugs = [...pathSlugs, node.slug];
  const flat: FlatCategory = {
    slug: node.slug,
    name: node.name,
    path: currentPath,
    pathSlugs: currentSlugs,
    label: currentPath.join(' > '),
    depth,
    parentSlug: pathSlugs[pathSlugs.length - 1],
  };
  const isSelected = selectedSlug === node.slug;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `6px 12px 6px ${12 + depth * 16}px`,
          cursor: 'pointer',
          borderRadius: 6,
          background: isSelected ? '#EEF2FF' : undefined,
          color: isSelected ? '#4F46E5' : '#111827',
          fontWeight: isSelected ? 600 : 400,
          fontSize: '0.875rem',
        }}
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ''; }}
        onClick={() => {
          if (hasChildren) setOpen(o => !o);
          onSelect(flat);
        }}
      >
        {hasChildren ? (
          <span style={{ width: 16, display: 'flex', alignItems: 'center', color: '#9CA3AF', flexShrink: 0 }}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}
        <span>{node.name}</span>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.slug}
              node={child}
              path={currentPath}
              pathSlugs={currentSlugs}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function CategoryPicker({ value, valuePath, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive selectedSlug from valuePath on mount / prop change
  useEffect(() => {
    if (!valuePath) { setSelectedSlug(null); return; }
    const match = FLAT_TAXONOMY.find(f => f.label === valuePath);
    if (match) setSelectedSlug(match.slug);
  }, [valuePath]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback(async (cat: FlatCategory) => {
    setSelectedSlug(cat.slug);
    setOpen(false);
    setQuery('');
    setSaving(true);
    try {
      // Build the items to bulk-ensure (all ancestors + the node itself)
      const items = cat.pathSlugs.map((slug, i) => ({
        name: cat.path[i],
        slug,
        parent_slug: i > 0 ? cat.pathSlugs[i - 1] : undefined,
      }));
      const result = await merchantApi.bulkEnsureCategories(items);
      const categoryId = result[cat.slug] ?? null;
      onChange(categoryId, cat.label);
    } catch {
      onChange(null, cat.label);
    } finally {
      setSaving(false);
    }
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlug(null);
    onChange(null, null);
  };

  const filtered = query.trim()
    ? FLAT_TAXONOMY.filter(f => f.label.toLowerCase().includes(query.toLowerCase()))
    : null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 40,
          padding: '0 12px',
          border: `1px solid ${open ? '#6366F1' : '#E5E7EB'}`,
          borderRadius: 6,
          background: '#fff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: valuePath ? '#111827' : '#9CA3AF',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.12)' : undefined,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          boxSizing: 'border-box',
        }}
      >
        <Tag size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {saving ? 'Saving…' : (valuePath || 'Search or browse categories…')}
        </span>
        {valuePath && (
          <span onClick={handleClear} style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
            <X size={14} />
          </span>
        )}
        <ChevronDown size={15} style={{ color: '#9CA3AF', flexShrink: 0, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 360,
          overflow: 'hidden',
        }}>
          {/* Search bar */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search categories…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', color: '#111827', background: 'transparent' }}
            />
            {query && (
              <span onClick={() => setQuery('')} style={{ cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                <X size={14} />
              </span>
            )}
          </div>

          {/* Results */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered ? (
              filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
                  No categories match "{query}"
                </div>
              ) : (
                filtered.map(cat => (
                  <div
                    key={cat.slug}
                    onClick={() => handleSelect(cat)}
                    style={{
                      padding: '8px 14px',
                      cursor: 'pointer',
                      background: selectedSlug === cat.slug ? '#EEF2FF' : undefined,
                      borderRadius: 6,
                      margin: '2px 6px',
                    }}
                    onMouseEnter={e => { if (selectedSlug !== cat.slug) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { if (selectedSlug !== cat.slug) (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 1 }}>
                      {cat.path.slice(0, -1).join(' > ')}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: selectedSlug === cat.slug ? '#4F46E5' : '#111827', fontWeight: selectedSlug === cat.slug ? 600 : 400 }}>
                      {cat.name}
                    </div>
                  </div>
                ))
              )
            ) : (
              // Browse tree
              TAXONOMY.map(node => (
                <TreeNode
                  key={node.slug}
                  node={node}
                  path={[]}
                  pathSlugs={[]}
                  selectedSlug={selectedSlug}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          {/* Footer hint */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #F3F4F6', fontSize: '0.72rem', color: '#9CA3AF' }}>
            Browse the hierarchy or type to search
          </div>
        </div>
      )}
    </div>
  );
}
