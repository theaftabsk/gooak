import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@/lib/api-client';

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content: string | null;
  author: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [editingPost, setEditingPost] = useState<Partial<BlogPostItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminBlogs();
      setPosts(data || []);

      // Auto seed defaults if empty
      if (!data || data.length === 0) {
        const defaults = [
          {
            title: 'Unlocking Organic Glow',
            slug: 'unlocking-organic-glow',
            content: '<p>Discover the ancient botanicals behind our best-selling Neem Tulsi Cleanser.</p>',
            author: 'Jane Doe',
            status: 'published',
            cover_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
          },
          {
            title: 'Modern Skincare Science',
            slug: 'modern-skincare-science',
            content: '<p>A deep dive into pH balance and lipid barriers for clean formulations.</p>',
            author: 'Dr. Sarah Patel',
            status: 'draft',
            cover_image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80',
          }
        ];
        for (const item of defaults) {
          try {
            await catalogApi.createAdminBlog(item);
          } catch (e: any) {
            // Ignore if already created by a concurrent request
            if (!e.message?.includes('already exists')) {
              throw e;
            }
          }
        }
        const updated = await catalogApi.getAdminBlogs();
        setPosts(updated || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleEdit = (post: BlogPostItem) => {
    setEditingPost({
      ...post,
      published_at: post.published_at ? post.published_at.substring(0, 16) : ''
    });
  };

  const handleCreateNew = () => {
    setEditingPost({
      title: '',
      slug: '',
      cover_image: '',
      content: '',
      author: '',
      status: 'draft',
      published_at: ''
    });
  };

  const handleTitleChange = (titleVal: string) => {
    if (!editingPost) return;
    const generatedSlug = titleVal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setEditingPost({
      ...editingPost,
      title: titleVal,
      slug: editingPost.id ? editingPost.slug : generatedSlug
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post permanently?')) return;
    try {
      await catalogApi.deleteAdminBlog(id);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete blog post.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await catalogApi.uploadFile(file);
      if (res && res.url) {
        setEditingPost(prev => ({ ...prev, cover_image: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload cover image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.slug) {
      alert('Title and Slug are required fields.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      ...editingPost,
      published_at: editingPost.published_at ? new Date(editingPost.published_at).toISOString() : null
    };

    try {
      if (editingPost.id) {
        await catalogApi.updateAdminBlog(editingPost.id, payload);
      } else {
        await catalogApi.createAdminBlog(payload);
      }
      setSaveSuccess(true);
      fetchPosts();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingPost(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Blog Articles</h2>
          <p className="header-sub">Write articles, company updates, and educational formulas</p>
        </div>
        {!editingPost && (
          <button className="btn-primary" onClick={handleCreateNew}>
            + Write Article
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingPost ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {editingPost.id ? 'Edit Article Details' : 'Write New Article'}
            </h3>
            <button className="btn-ghost-sm" onClick={() => setEditingPost(null)}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Article Title *</label>
                <input
                  required
                  value={editingPost.title || ''}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. 5 Benefits of Tulsi in Cleansers"
                />
              </div>
              <div className="field-group">
                <label>URL Slug *</label>
                <input
                  required
                  value={editingPost.slug || ''}
                  onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                  placeholder="e.g. benefits-of-tulsi"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Cover Image URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1 }}
                    value={editingPost.cover_image || ''}
                    onChange={e => setEditingPost({ ...editingPost, cover_image: e.target.value })}
                    placeholder="https://example.com/cover.png"
                  />
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button type="button" className="btn-ghost-sm" disabled={uploadingImage} style={{ height: '100%' }}>
                      {uploadingImage ? 'Uploading...' : 'Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label>Author / Publisher</label>
                <input
                  value={editingPost.author || ''}
                  onChange={e => setEditingPost({ ...editingPost, author: e.target.value })}
                  placeholder="e.g. Editorial Board"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Publishing Status</label>
                <select
                  value={editingPost.status || 'draft'}
                  onChange={e => setEditingPost({ ...editingPost, status: e.target.value })}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
              <div className="field-group">
                <label>Schedule Publish Date</label>
                <input
                  type="datetime-local"
                  value={editingPost.published_at || ''}
                  onChange={e => setEditingPost({ ...editingPost, published_at: e.target.value })}
                />
              </div>
            </div>

            <div className="field-group">
              <label>Article Content (HTML/Plain Text)</label>
              <textarea
                value={editingPost.content || ''}
                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                rows={12}
                placeholder="Write article details here..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving article…' : saveSuccess ? '✓ Article Saved' : 'Save Article'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => setEditingPost(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading blog posts...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Cover</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Author</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', width: '100px' }}>
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--m-border)' }}
                      />
                    ) : (
                      <div style={{ width: '80px', height: '45px', background: '#E2E8F0', borderRadius: '4px' }} />
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{post.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}><code>/{post.slug}</code></div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>{post.author || '—'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge ${post.status === 'published' ? 'badge-success' : 'badge-warn'}`} style={{
                      display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: post.status === 'published' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                      color: post.status === 'published' ? '#10B981' : '#D97706'
                    }}>
                      {post.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-ghost-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(post)}>
                      Edit
                    </button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(post.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
