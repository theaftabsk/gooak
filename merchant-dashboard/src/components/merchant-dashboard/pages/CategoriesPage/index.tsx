import React, { useState } from 'react';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner, EmptyState } from '../../shared';

interface CategoriesPageProps {
  categories: any[];
  loading: boolean;
  onCreateCategory: (data: any) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onUpdateCategory: (id: string, data: any) => Promise<void>;
  creating: boolean;
  deleting: boolean;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories, loading, onCreateCategory, onDeleteCategory, onUpdateCategory, creating, deleting
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [parentId, setParentId] = useState('');

  // Flatten categories for full list table and parent dropdown selection
  const flattenCategories = (list: any[]): any[] => {
    return list.flatMap(c => [c, ...flattenCategories(c.children || [])]);
  };
  const allCategoriesFlat = flattenCategories(categories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await onCreateCategory({
      name,
      slug,
      sort_order: parseInt(sortOrder) || 0,
      is_active: true,
      show_in_menu: true,
      parent_id: parentId || null
    });

    setName('');
    setSortOrder('0');
    setParentId('');
    setShowAddForm(false);
  };

  const handleDelete = async (cat: any) => {
    if (confirm(`Are you sure you want to delete category "${cat.name}"? products linked to this category will become uncategorized.`)) {
      await onDeleteCategory(cat.id);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Categories Management</h2>
          <p className="header-sub">{allCategoriesFlat.length} categories configured for store navigation</p>
        </div>
        {!showAddForm && (
          <button className="btn-primary" onClick={() => { setShowAddForm(true); setParentId(''); }}>
            <Icons.Plus /> Add Category
          </button>
        )}
      </header>

      {showAddForm && (
        <div className="card" style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Create New Category</h3>
            <button className="btn-ghost-sm" onClick={() => setShowAddForm(false)}><Icons.X /> Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Category Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Herbal Oils" />
              </div>
              <div className="field-group">
                <label>Sort Order</label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="0" />
              </div>
              <div className="field-group">
                <label>Parent Category (Optional)</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)}>
                  <option value="">None (Root Category)</option>
                  {allCategoriesFlat.filter(c => !c.parent_id).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={creating}>
              {creating ? 'Creating…' : 'Create Category'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">All Categories</h3>
        {loading ? <LoadingSpinner message="Fetching categories..." /> : allCategoriesFlat.length === 0 ? (
          <EmptyState message="No categories defined. Create one to organize your catalog products." />
        ) : (
          <div className="db-table-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Parent Category</th>
                  <th>URL Slug</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCategoriesFlat.map(c => {
                  const parentCategory = c.parent_id ? allCategoriesFlat.find(p => p.id === c.parent_id) : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span style={{ paddingLeft: c.parent_id ? '20px' : '0px', display: 'inline-block', fontWeight: c.parent_id ? 'normal' : 'bold' }}>
                          {c.parent_id ? `↳ ${c.name}` : c.name}
                        </span>
                      </td>
                      <td>
                        {parentCategory ? (
                          <Badge type="info">{parentCategory.name}</Badge>
                        ) : (
                          <span style={{ color: 'var(--m-text-muted)', fontSize: '0.8rem' }}>None (Root)</span>
                        )}
                      </td>
                      <td><code>/{c.slug}</code></td>
                      <td>{c.sort_order}</td>

                      <td>
                        <Badge type={c.is_active ? 'success' : 'warn'}>
                          {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-danger-sm" onClick={() => handleDelete(c)} disabled={deleting}>
                          <Icons.Trash /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

