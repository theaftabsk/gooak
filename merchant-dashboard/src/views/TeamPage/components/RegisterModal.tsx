import React, { useState } from 'react';
import { RolePermissionConfig } from '../types';
import { IconEye } from './Icons';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  adding: boolean;
  permissions: Record<'admin' | 'staff', RolePermissionConfig>;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  adding,
  permissions,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { label: '', score: 0, colorClass: '' };
    const len = password.length;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    if (len >= 8 && hasLetters && hasNumbers && hasSymbols) {
      return { label: 'Strong', score: 3, colorClass: 'strong' };
    }
    if (len >= 6 && hasLetters && hasNumbers) {
      return { label: 'Medium', score: 2, colorClass: 'medium' };
    }
    return { label: 'Weak', score: 1, colorClass: 'weak' };
  };

  const strength = getPasswordStrength();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('All fields are required.');
      return;
    }
    await onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });
    // Reset form
    setName('');
    setEmail('');
    setPassword('');
    setRole('staff');
  };

  const getPreviewText = () => {
    const isSpecialAdmin = role === 'admin' || role === 'administrator';
    const roleKey = isSpecialAdmin ? 'admin' : 'staff';
    const config = permissions[roleKey];
    
    const labelMap = {
      write: 'Full Access',
      read: 'Read-Only',
      none: 'No Access',
    };

    return `Products: ${labelMap[config.products]} | Orders: ${labelMap[config.orders]} | Payments: ${labelMap[config.payments]} | Staff: ${labelMap[config.staff]}`;
  };

  return (
    <div className="saas-modal-overlay">
      <div className="saas-modal-container">
        <div className="saas-modal-header">
          <h3>Register Team Member</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748B' }}>&times;</button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="saas-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="team-field" style={{ margin: 0 }}>
              <label>Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Aftab Ahmed"
              />
            </div>

            <div className="team-field" style={{ margin: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="aftab@gmail.com"
              />
            </div>

            <div className="team-field" style={{ margin: 0 }}>
              <label>Password</label>
              <div className="inp-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="team-eye-btn"
                >
                  <IconEye size={16} />
                </button>
              </div>

              {password && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, marginTop: 6, color: '#64748B' }}>
                    <span>Password Strength:</span>
                    <span style={{
                      color: strength.score === 3 ? '#10B981' : strength.score === 2 ? '#F59E0B' : '#EF4444'
                    }}>{strength.label}</span>
                  </div>
                  <div className="strength-meter-bar">
                    <div className={`strength-chunk ${strength.score >= 1 ? strength.colorClass : ''}`} />
                    <div className={`strength-chunk ${strength.score >= 2 ? strength.colorClass : ''}`} />
                    <div className={`strength-chunk ${strength.score >= 3 ? strength.colorClass : ''}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="team-field" style={{ margin: 0 }}>
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Permissions Preview Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <h5 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Permissions Preview (Dynamic)
              </h5>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#1E293B', fontWeight: 600, lineHeight: 1.4 }}>
                {getPreviewText()}
              </p>
            </div>
          </div>

          <div className="saas-modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }} disabled={adding}>
              {adding ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
