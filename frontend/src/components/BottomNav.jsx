import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Leaf, 
  Sparkles
} from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/log', label: 'Log', icon: Leaf },
    { to: '/history', label: 'History', icon: CalendarRange },
    { to: '/suggestions', label: 'AI Tips', icon: Sparkles }
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'var(--font-family-title)',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              borderTop: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              paddingTop: isActive ? '0px' : '3px',
              transition: 'all 0.15s ease'
            })}
          >
            <Icon size={18} style={{ marginBottom: '2px' }} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
