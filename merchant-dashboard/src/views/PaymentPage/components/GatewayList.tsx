import React from 'react';
import { PaymentGateway, ActiveView } from '../types';
import { GatewayCard } from './GatewayCard';

interface GatewayListProps {
  gateways: PaymentGateway[];
  onSelect: (view: ActiveView) => void;
}

export const GatewayList: React.FC<GatewayListProps> = ({ gateways, onSelect }) => {
  return (
    <>
      <header className="page-header" style={{ marginBottom: 25 }}>
        <div>
          <h2>Payment Configurations</h2>
          <p className="header-sub">Configure and activate customer payment choices for checkouts</p>
        </div>
      </header>

      <div className="pay-box-grid">
        {gateways.map(g => (
          <GatewayCard key={g.id} gateway={g} onSelect={onSelect} />
        ))}
      </div>
    </>
  );
};
