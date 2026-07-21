import React from 'react';
import { IconShieldCheck, IconUserCog, IconUsers } from './Icons';

export const RoleCards: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', width: '100%' }}>
      {/* Owner Card */}
      <div 
        className="perm-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          padding: '20px 24px', 
          borderRadius: 12, 
          border: '1.5px solid #F3E8FF',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)',
          boxShadow: '0 4px 18px rgba(126, 34, 206, 0.03)',
          flex: 1, 
          minWidth: 260,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#F3E8FF', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconShieldCheck size={18} style={{ color: '#7E22CE' }} />
          </div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 750, color: '#7E22CE' }}>Owner</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
          Full administrative access to billing configs, store setups, staff registrations, and custom domain mapping overrides.
        </p>
      </div>

      {/* Admin Card */}
      <div 
        className="perm-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          padding: '20px 24px', 
          borderRadius: 12, 
          border: '1.5px solid #DBEAFE',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          boxShadow: '0 4px 18px rgba(29, 78, 216, 0.03)',
          flex: 1, 
          minWidth: 260,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#DBEAFE', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconUserCog size={18} style={{ color: '#1D4ED8' }} />
          </div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 750, color: '#1D4ED8' }}>Administrator</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
          Access to product catalogs, collection lists, inventory levels, order routing processing, and fulfillment logs.
        </p>
      </div>

      {/* Staff Card */}
      <div 
        className="perm-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12, 
          padding: '20px 24px', 
          borderRadius: 12, 
          border: '1.5px solid #D1FAE5',
          background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)',
          boxShadow: '0 4px 18px rgba(4, 120, 87, 0.03)',
          flex: 1, 
          minWidth: 260,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#D1FAE5', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconUsers size={18} style={{ color: '#047857' }} />
          </div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 750, color: '#047857' }}>Store Staff</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>
          Limited read-only dashboard visibility access to monitor storefront sales orders and view product collections lists.
        </p>
      </div>
    </div>
  );
};
