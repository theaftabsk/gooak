import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@/lib/api-client';

interface FaqItem {
  id: string;
  type: string;
  question: string;
  answer: string;
  sort_order: number;
}

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminFaqs();
      setFaqs(data || []);

      // Auto seed defaults if empty
      if (!data || data.length === 0) {
        const defaults = [
          {
            type: 'general',
            question: 'What is the shelf life of your formulations?',
            answer: 'All our organic serums and facial washes have a shelf life of 24 months from the manufacturing date when stored in a cool, dry place.',
            sort_order: 1
          },
          {
            type: 'store',
            question: 'Do you offer free shipping across India?',
            answer: 'Yes! Free shipping is automatically applied to all orders above ₹499.',
            sort_order: 2
          },
          {
            type: 'product',
            question: 'Are these safe for sensitive skin types?',
            answer: 'Our formulations are dermatologist tested and free from synthetic fragrances or parabens, making them safe for sensitive skin. However, we always recommend a patch test first.',
            sort_order: 3
          }
        ];
        for (const item of defaults) {
          await catalogApi.createAdminFaq(item);
        }
        const updated = await catalogApi.getAdminFaqs();
        setFaqs(updated || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQ items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
  };

  const handleCreateNew = () => {
    setEditingFaq({
      type: 'general',
      question: '',
      answer: '',
      sort_order: 1
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ permanently?')) return;
    try {
      await catalogApi.deleteAdminFaq(id);
      fetchFaqs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) {
      alert('Question and Answer are required fields.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      ...editingFaq,
      sort_order: editingFaq.sort_order !== undefined ? parseInt(String(editingFaq.sort_order)) : 0
    };

    try {
      if (editingFaq.id) {
        await catalogApi.updateAdminFaq(editingFaq.id, payload);
      } else {
        await catalogApi.createAdminFaq(payload);
      }
      setSaveSuccess(true);
      fetchFaqs();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingFaq(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Frequently Asked Questions</h2>
          <p className="header-sub">Configure and prioritize FAQ registries for store shoppers</p>
        </div>
        {!editingFaq && (
          <button className="btn-primary" onClick={handleCreateNew}>
            + Add FAQ
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingFaq ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {editingFaq.id ? 'Edit FAQ Item' : 'Create FAQ Item'}
            </h3>
            <button className="btn-ghost-sm" onClick={() => setEditingFaq(null)}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>FAQ Category / Type</label>
                <select
                  value={editingFaq.type || 'general'}
                  onChange={e => setEditingFaq({ ...editingFaq, type: e.target.value })}
                >
                  <option value="general">General Queries</option>
                  <option value="store">Store Policy & Shipping</option>
                  <option value="product">Product Formulations</option>
                </select>
              </div>
              <div className="field-group">
                <label>Sort Order Priority</label>
                <input
                  type="number"
                  required
                  value={editingFaq.sort_order !== undefined ? editingFaq.sort_order : 1}
                  onChange={e => setEditingFaq({ ...editingFaq, sort_order: parseInt(e.target.value) || 1 })}
                  placeholder="Lower numbers display first"
                />
              </div>
            </div>

            <div className="field-group">
              <label>Question *</label>
              <input
                required
                value={editingFaq.question || ''}
                onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                placeholder="Write the FAQ question..."
              />
            </div>

            <div className="field-group">
              <label>Answer *</label>
              <textarea
                required
                value={editingFaq.answer || ''}
                onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                rows={6}
                placeholder="Write the detailed answers..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving FAQ…' : saveSuccess ? '✓ FAQ Saved' : 'Save FAQ'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => setEditingFaq(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading FAQs registry...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Question</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Order Priority</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map(faq => (
                <tr key={faq.id} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', maxWidth: '400px' }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
                      {faq.answer}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge" style={{
                      display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', textTransform: 'uppercase'
                    }}>
                      {faq.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <code>#{faq.sort_order}</code>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-ghost-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(faq)}>
                      Edit
                    </button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(faq.id)}>
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
