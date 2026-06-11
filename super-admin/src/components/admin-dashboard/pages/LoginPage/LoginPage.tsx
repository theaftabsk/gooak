import React from 'react';
import { Icons } from '../../icons';
import { catalogApi } from '@oaksol/api-client';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await catalogApi.adminLogin({ email, password });
      onLogin(res.token);
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
      </div>
    </div>
  );
};
