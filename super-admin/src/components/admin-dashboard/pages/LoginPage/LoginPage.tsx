import React from 'react';
import { Icons } from '../../icons';
import { catalogApi } from '@oaksol/api-client';

interface LoginPageProps {
  onLogin: (token: string, admin: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = React.useState('admin@oaksol.in');
  const [password, setPassword] = React.useState('1234');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await catalogApi.adminLogin({ email, password });
      onLogin(res.token, res.admin);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><Icons.Logo /></div>
          <h2>OakSol Platform</h2>
          <p>Super Admin — Platform Registry</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@oaksol.in"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : <><Icons.Lock /> Login as Super Admin</>}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#94A3B8',
          lineHeight: '1.4'
        }}>
          <strong style={{ color: '#F1F5F9', display: 'block', marginBottom: '4px' }}>🔑 Developer Sandbox Credentials</strong>
          <div style={{ marginBottom: '2px' }}>Email: <code style={{ color: '#38BDF8', userSelect: 'all', fontFamily: 'monospace' }}>admin@oaksol.in</code></div>
          <div>Password: <code style={{ color: '#38BDF8', userSelect: 'all', fontFamily: 'monospace' }}>1234</code></div>
        </div>
      </div>
    </div>
  );
};
