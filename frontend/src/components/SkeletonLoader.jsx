import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card" style={{ height: '180px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div className="skeleton" style={{ width: '40%', height: '24px' }}></div>
    <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
    <div className="skeleton" style={{ width: '60%', height: '16px' }}></div>
    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
      <div className="skeleton" style={{ width: '30%', height: '32px', borderRadius: '6px' }}></div>
      <div className="skeleton" style={{ width: '30%', height: '32px', borderRadius: '6px' }}></div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '320px', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: '130px', height: '130px', borderRadius: '50%' }}></div>
      <div className="skeleton" style={{ width: '80px', height: '24px', marginTop: '1.5rem' }}></div>
      <div className="skeleton" style={{ width: '120px', height: '16px', marginTop: '0.5rem' }}></div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ height: '150px' }}>
        <div className="skeleton" style={{ width: '30%', height: '20px', marginBottom: '1rem' }}></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="skeleton" style={{ flex: 1, height: '60px' }}></div>
          <div className="skeleton" style={{ flex: 1, height: '60px' }}></div>
        </div>
      </div>
      
      <div className="glass-card" style={{ height: '150px' }}>
        <div className="skeleton" style={{ width: '35%', height: '20px', marginBottom: '1rem' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '0.5rem' }}></div>
        <div className="skeleton" style={{ width: '85%', height: '16px' }}></div>
      </div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div className="skeleton" style={{ width: '25%', height: '24px' }}></div>
    <div className="skeleton" style={{ width: '100%', flex: 1, borderRadius: '8px' }}></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div className="skeleton" style={{ width: '20%', height: '20px', marginBottom: '0.5rem' }}></div>
    <div className="skeleton" style={{ width: '100%', height: '40px' }}></div>
    <div className="skeleton" style={{ width: '100%', height: '40px' }}></div>
    <div className="skeleton" style={{ width: '100%', height: '40px' }}></div>
  </div>
);
