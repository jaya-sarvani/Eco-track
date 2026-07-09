import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Leaf, 
  Sparkles, 
  LogOut, 
  Sun, 
  Moon,
  UserCheck
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Habit Logger', icon: Leaf },
    { to: '/history', label: 'History & Charts', icon: CalendarRange },
    { to: '/suggestions', label: 'AI Suggestions', icon: Sparkles }
  ];

  return (
    <div className="sidebar" style={{ justifyContent: 'space-between' }}>
      <div>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 4px 10px rgba(44,107,79,0.3)'
          }}>
            🌱
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', letterSpacing: '-0.5px' }}>EcoTrack</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sustainability Tracker</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-family-title)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                  paddingLeft: isActive ? 'calc(1.25rem - 4px)' : '1.25rem',
                  transition: 'all 0.2s ease'
                })}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Theme Toggler */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--primary-light)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family-title)',
            fontWeight: 500,
            fontSize: '0.9rem',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div style={{
            width: '36px',
            height: '20px',
            borderRadius: '10px',
            background: 'var(--text-secondary)',
            position: 'relative',
            padding: '2px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: theme === 'light' ? '2px' : '18px',
              transition: 'left 0.2s ease'
            }}></div>
          </div>
        </button>

        {/* User Stats Card */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--primary-light)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <UserCheck size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Streak: {currentUser.streak} days 🔥
              </span>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '6px'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
