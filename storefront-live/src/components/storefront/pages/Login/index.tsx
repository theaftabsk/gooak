import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { usePageTheme } from '../../hooks/usePageTheme';

export const Login: React.FC = () => {
  const { customer, login, isLoading } = useCustomer();
  const navigate = useNavigate();
  const { cssVariables } = usePageTheme('login');
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoading && customer) {
      navigate(redirectTo);
    }
  }, [customer, isLoading, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={cssVariables}>
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo-emoji">🌿</span>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your customer account to manage your profile and track orders</p>
        </div>

        {errorMsg && (
          <div className="login-error-alert">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <input 
              type="email" 
              className="login-input" 
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="login-field">
            <div className="login-label-row">
              <label className="login-label">Password</label>
            </div>
            <input 
              type="password" 
              className="login-input" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <Link to={searchParams.has('redirect') ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"} className="login-link">Create Account</Link>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sf-bg, #FAF7F2);
          font-family: 'Inter', sans-serif;
          padding: 60px 20px;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.06);
          text-align: center;
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }
        }
        .login-header {
          margin-bottom: 32px;
        }
        .login-logo-emoji {
          font-size: 2.2rem;
          display: block;
          margin-bottom: 16px;
        }
        .login-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          font-size: 0.88rem;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }
        .login-error-alert {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .login-input {
          padding: 12px 16px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.08);
        }
        .login-submit-btn {
          padding: 14px;
          background: var(--sf-accent, #15803D);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.3);
          transition: all 0.2s ease;
          text-align: center;
        }
        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 25px -4px rgba(21, 128, 61, 0.4);
          filter: brightness(1.05);
        }
        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .login-footer {
          margin-top: 28px;
          font-size: 0.88rem;
          color: #4B5563;
          font-weight: 500;
        }
        .login-link {
          color: var(--sf-accent, #15803D);
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .login-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
