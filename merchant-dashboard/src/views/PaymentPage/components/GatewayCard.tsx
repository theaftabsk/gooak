import React from 'react';
import { PaymentGateway, ActiveView } from '../types';
import { LogoCOD, LogoRazorpay, LogoPhonePe } from './Logos';
import { StatusBadge } from './StatusBadge';

interface GatewayCardProps {
  gateway: PaymentGateway;
  onSelect: (view: ActiveView) => void;
}

export const GatewayCard: React.FC<GatewayCardProps> = ({ gateway, onSelect }) => {
  const getLogo = () => {
    switch (gateway.slug) {
      case 'cod': return <LogoCOD />;
      case 'razorpay': return <LogoRazorpay />;
      case 'phonepe': return <LogoPhonePe />;
      default: return null;
    }
  };

  const getSubtitle = () => {
    switch (gateway.slug) {
      case 'cod': return 'Accept cash or card upon delivery';
      case 'razorpay': return 'Accept credit/debit cards, UPI, and netbanking';
      case 'phonepe': return 'Instant checkout via PhonePe UPI & wallets';
      default: return 'Configure gateway settings';
    }
  };

  return (
    <div className="pay-method-box" onClick={() => onSelect(gateway.slug as ActiveView)}>
      <div className="pay-method-logo">
        {getLogo()}
      </div>
      <h3 className="pay-method-title">{gateway.name}</h3>
      <p className="pay-method-desc">{getSubtitle()}</p>
      
      <div style={{ marginBottom: 15 }}>
        <StatusBadge gateway={gateway} />
      </div>

      <span className="pay-action-link">
        Configure Settings &rarr;
      </span>
    </div>
  );
};
