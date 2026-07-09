import React from 'react';

const Heatmap = ({ data = [] }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>30-Day Activity Heatmap</h3>
        
        {/* Heatmap Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Low</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#81c784' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ffd54f' }}></div>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#e57373' }}></div>
          <span>High</span>
        </div>
      </div>
      
      {/* 30-Day Grid */}
      <div className="heatmap-grid">
        {data.map((day, idx) => {
          const formattedDate = new Date(day.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          });
          const emissionText = day.emissions > 0 
            ? `${day.emissions.toFixed(1)} kg CO₂` 
            : 'No logs';
            
          return (
            <div
              key={day.date || idx}
              className={`heatmap-cell level-${day.level || 'none'}`}
              title={`${formattedDate}: ${emissionText}`}
              style={{
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Optional: Show day number inside the grid box lightly */}
              <span style={{ fontSize: '0.65rem', opacity: 0.3, userSelect: 'none' }}>
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
        
        {data.length === 0 && (
          Array.from({ length: 30 }).map((_, idx) => (
            <div 
              key={idx} 
              className="heatmap-cell level-none skeleton"
              style={{ borderRadius: '6px' }}
            ></div>
          ))
        )}
      </div>
    </div>
  );
};

export default Heatmap;
