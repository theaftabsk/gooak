import React from 'react';
import { PaymentGateway } from '../types';
import { LogoCOD } from './Logos';

interface CodConfigProps {
  gateway: PaymentGateway;
  onBack: () => void;
  onToggleStatus: (g: PaymentGateway) => void;
  togglingId: string | null;
}

export const CodConfig: React.FC<CodConfigProps> = ({
  gateway,
  onBack,
  onToggleStatus,
  togglingId,
}) => {
  const isToggling = togglingId === gateway.id;

  return (
    <div>
      <div className="pay-header">
        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--m-text-normal)' }}>
          &larr; Back to Gateways
        </button>
      </div>

      <div className="pay-sub-grid">
        <div className="card" style={{ padding: '30px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ padding: 10, background: '#ECFDF5', borderRadius: 12 }}>
              <LogoCOD />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Cash on Delivery (COD)</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>Allow customers to pay in cash when the package is delivered.</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 20, marginTop: 20 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 600 }}>Activation State</h4>
            <button
              onClick={() => onToggleStatus(gateway)}
              disabled={isToggling}
              className={`pay-toggle-btn ${gateway.is_active ? 'on' : 'off'}`}
            >
              {isToggling ? 'Updating Status...' : gateway.is_active ? 'Disable Payment Method' : 'Enable Payment Method'}
            </button>
          </div>
        </div>

        <div className="pay-info-card">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            About Cash on Delivery
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>Cash on Delivery requires <strong>no credentials setup</strong>. You can toggle it active instantly.</li>
            <li>Recommended to establish terms for COD verification (e.g. phone call validation) to avoid return-to-origin (RTO) charges from shipping partners.</li>
            <li>Orders placed via COD will start in <strong>Pending / Awaiting Payment</strong> status in your orders manager.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
