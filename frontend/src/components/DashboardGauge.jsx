import React, { useEffect, useState } from 'react';

const DashboardGauge = ({ totalEmission = 0, budget = 15 }) => {
  const [offset, setOffset] = useState(330); // Start empty
  const percentage = Math.min((totalEmission / budget) * 100, 100);
  
  // Custom Gauge Ring Parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // 439.8
  const maxArcLength = circumference * 0.75; // 330 (3/4 of a circle)
  
  useEffect(() => {
    // Animate sweep on mount / data change
    const targetOffset = maxArcLength - (maxArcLength * percentage) / 100;
    const timer = setTimeout(() => {
      setOffset(targetOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, maxArcLength]);

  // Determine status color
  let color = 'var(--success)'; // Green
  let label = 'Below Budget';
  let badgeClass = 'success';
  
  if (totalEmission > budget * 0.7 && totalEmission <= budget) {
    color = 'var(--warning)'; // Yellow
    label = 'Near Budget';
    badgeClass = 'warning';
  } else if (totalEmission > budget) {
    color = 'var(--danger)'; // Red
    label = 'Above Budget';
    badgeClass = 'danger';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative'
    }}>
      <svg width="220" height="180" viewBox="0 0 200 200" style={{ transform: 'rotate(-45deg)' }}>
        {/* Background Arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="14"
          strokeDasharray={`${maxArcLength} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
        />
        
        {/* Foreground Colored Arc representing emissions */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${maxArcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 100 100)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
        />
      </svg>
      
      {/* Central Metrics Card (Positioned absolutely over the gauge center) */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{ 
          fontSize: '2.25rem', 
          fontWeight: 800, 
          fontFamily: 'var(--font-family-title)',
          color: 'var(--text-primary)',
          lineHeight: '1'
        }}>
          {totalEmission.toFixed(1)}
        </span>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginTop: '2px'
        }}>
          kg CO₂
        </span>
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          marginTop: '4px'
        }}>
          Limit: {budget} kg
        </span>
      </div>
      
      {/* Status Badge */}
      <div style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color: color,
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 600,
        fontFamily: 'var(--font-family-title)',
        marginTop: '-10px',
        animation: 'pulse 2.5s infinite ease-in-out'
      }}>
        {label}
      </div>
    </div>
  );
};

export default DashboardGauge;
