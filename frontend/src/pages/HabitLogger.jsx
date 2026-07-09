import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logTravel, logFood, logEnergy } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Utensils, 
  Zap, 
  Calendar, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const HabitLogger = () => {
  const location = useLocation();
  const { updateProfile } = useAuth();
  
  // State variables
  const [activeTab, setActiveTab] = useState('travel');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Loading & feedback states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  // Travel states
  const [distance, setDistance] = useState(10);
  const [transportMode, setTransportMode] = useState('Petrol Car');
  const [passengerCount, setPassengerCount] = useState(1);

  // Food states
  const [dietType, setDietType] = useState('Omnivore');
  const [foodWasteToggle, setFoodWasteToggle] = useState(false);

  // Energy states
  const [electricity, setElectricity] = useState(5);
  const [gas, setGas] = useState(0);
  const [renewables, setRenewables] = useState(0);

  // Sync tab focus when redirected from dashboard progress card clicks
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state]);

  const clearFeedback = () => {
    setSuccessMsg('');
    setErrorMsg('');
    setUnlockedBadges([]);
  };

  const handleTriggerConfetti = () => {
    // Premium celebration pop
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();
    setSubmitting(true);
    
    try {
      let response;
      if (activeTab === 'travel') {
        if (distance <= 0) throw new Error('Distance must be greater than 0.');
        response = await logTravel(parseFloat(distance), transportMode, parseInt(passengerCount), date);
      } else if (activeTab === 'food') {
        response = await logFood(dietType, foodWasteToggle, date);
      } else if (activeTab === 'energy') {
        if (electricity < 0 || gas < 0) throw new Error('Usage metrics cannot be negative values.');
        response = await logEnergy(parseFloat(electricity), parseFloat(gas), parseFloat(renewables), date);
      }
      
      const { message, log, newlyUnlockedBadges } = response.data;
      setSuccessMsg(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} habit saved successfully! Total emission: ${log.totalEmission} kg CO₂`);
      
      // If badges unlocked, trigger animations and update auth states
      if (newlyUnlockedBadges && newlyUnlockedBadges.length > 0) {
        setUnlockedBadges(newlyUnlockedBadges);
        handleTriggerConfetti();
        // Sync context stats
        updateProfile({
          badges: response.data.log?.badges || [] // Server updates badges array in user
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.error || error.message || 'Submission failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    { id: 'travel', label: 'Travel Logger', icon: Car },
    { id: 'food', label: 'Food Logger', icon: Utensils },
    { id: 'energy', label: 'Energy Logger', icon: Zap }
  ];

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', letterSpacing: '-0.5px' }}>Habit Logger</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Log your daily activities to calculate your carbon contributions.</p>
      </div>

      {/* Date & Tab Selector Controls */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Log Date:</span>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          />
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.25rem',
          gap: '0.5rem'
        }}>
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); clearFeedback(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  fontSize: '0.9rem',
                  flex: 1,
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Panels */}
      {successMsg && (
        <div style={{
          backgroundColor: 'var(--primary-light)',
          border: '1px solid var(--border-color)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          border: '1px solid rgba(211, 47, 47, 0.2)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confetti unlocked badges notification cards */}
      {unlockedBadges.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF2CC 100%)',
          border: '1px solid #FFE0B2',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(255, 179, 0, 0.15)',
          animation: 'pulse 2s infinite'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
          <h3 style={{ color: '#E65100', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Badge Unlocked!</h3>
          <p style={{ fontSize: '0.85rem', color: '#B78103', marginBottom: '0.75rem' }}>
            Congratulations, you have successfully completed a new eco goal:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {unlockedBadges.map(b => (
              <span key={b} style={{
                backgroundColor: 'white',
                border: '1px solid #FFE0B2',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#E65100'
              }}>
                🏆 {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Habit Forms Container */}
      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: TRAVEL LOGGER */}
          {activeTab === 'travel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Transportation Mode</label>
                <select 
                  className="form-input"
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Petrol Car">Petrol Car ⛽</option>
                  <option value="Diesel Car">Diesel Car 🚜</option>
                  <option value="Electric Vehicle">Electric Vehicle (EV) ⚡</option>
                  <option value="Bus">Public Bus 🚌</option>
                  <option value="Train">Electric Train 🚄</option>
                  <option value="Bike">Bicycle 🚲</option>
                  <option value="Walking">Walking 🚶</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Distance (kilometers)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="0.1"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value) || '')}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Passenger Count</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="1"
                  step="1"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value) || '')}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Emissions are divided equally among occupants.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: FOOD LOGGER */}
          {activeTab === 'food' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Daily Diet Profile</label>
                <select 
                  className="form-input"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Meat Heavy">Meat Heavy (High Beef/Pork) 🥩</option>
                  <option value="Omnivore">Omnivore (Balanced Diet) 🍲</option>
                  <option value="Vegetarian">Vegetarian (No meat/fish) 🥚</option>
                  <option value="Vegan">Vegan (Plant-Based only) 🥗</option>
                </select>
              </div>

              {/* Toggle switch for Food Waste */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Unused Food Waste Penalty</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Applies a 10% penalty for discarded edible meals.
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={foodWasteToggle}
                  onChange={(e) => setFoodWasteToggle(e.target.checked)}
                  style={{
                    width: '42px',
                    height: '22px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary)'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: ENERGY LOGGER */}
          {activeTab === 'energy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Electricity Consumption (kWh)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="0"
                  step="0.1"
                  value={electricity}
                  onChange={(e) => setElectricity(parseFloat(e.target.value) || '')}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gas Usage (kWh/Units)</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="0"
                  step="0.1"
                  value={gas}
                  onChange={(e) => setGas(parseFloat(e.target.value) || '')}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Renewable Energy Percentage</label>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{renewables}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={renewables}
                  onChange={(e) => setRenewables(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary)',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Suppresses electricity footprint proportionally by offset.
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.9rem', width: '100%', gap: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Saving activity...</span>
              </>
            ) : (
              <span>Save Log Entry</span>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default HabitLogger;
