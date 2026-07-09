import React, { useEffect, useState } from 'react';
import { getSuggestions } from '../services/api';
import { 
  Sparkles, 
  Leaf, 
  Car, 
  Utensils, 
  Zap, 
  Thermometer, 
  Lightbulb, 
  Trash2, 
  ShoppingBag, 
  Droplet, 
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Lightbulb as BulbIcon
} from 'lucide-react';

const Suggestions = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSuggestions(todayStr);
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve AI recommendations. Please check backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Map icon text to Lucide elements
  const renderIcon = (iconName) => {
    const props = { size: 24, style: { color: 'var(--primary)' } };
    switch (iconName?.toLowerCase()) {
      case 'car': return <Car {...props} />;
      case 'utensils': return <Utensils {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'leaf': return <Leaf {...props} />;
      case 'thermometer': return <Thermometer {...props} />;
      case 'lightbulb': return <Lightbulb {...props} />;
      case 'trash-2': return <Trash2 {...props} />;
      case 'shopping-bag': return <ShoppingBag {...props} />;
      case 'droplet': return <Droplet {...props} />;
      default: return <TrendingDown {...props} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>Consulting Eco Advisor</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Analyzing your daily carbon logs to structure recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Failed to Load AI Advice</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchSuggestions} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  // Calculate sum of savings
  const totalSavings = recommendations.reduce((sum, r) => sum + floatVal(r.estimated_savings_kg), 0);

  function floatVal(val) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.0 : parsed;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={24} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', letterSpacing: '-0.5px', margin: 0 }}>
              AI Eco Suggestions
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Personalized sustainability steps driven by Groq llama-3.3-70b-versatile.</p>
        </div>

        <button 
          onClick={fetchSuggestions} 
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
        >
          <RefreshCw size={14} />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Aggregate Savings Panel */}
      {totalSavings > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontFamily: 'var(--font-family-title)', fontWeight: 700 }}>
              Combined Potential Impact
            </h3>
            <p style={{ opacity: 0.85, fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Adopting these 3 swaps could reduce your footprint significantly.
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', display: 'block', lineHeight: '1' }}>
              -{totalSavings.toFixed(1)} kg
            </span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>
              CO₂ Savings / day
            </span>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="glass-card"
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'flex-start',
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Category Icon */}
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {renderIcon(rec.icon)}
            </div>

            {/* Content Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rec.title}</h3>
                
                {/* Savings tag */}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontFamily: 'var(--font-family-title)'
                }}>
                  -{floatVal(rec.estimated_savings_kg).toFixed(1)} kg CO₂
                </span>
              </div>
              
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1rem' }}>
                {rec.recommendation}
              </p>

              {/* Lifestyle Swap Panel */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-color)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <BulbIcon size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Lifestyle Swap: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{rec.practical_swap}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Suggestions;
