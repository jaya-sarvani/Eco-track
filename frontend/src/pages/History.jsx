import React, { useEffect, useState } from 'react';
import { getHistory, downloadReport } from '../services/api';
import Heatmap from '../components/Heatmap';
import { ChartSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import { 
  Calendar, 
  Download, 
  ArrowDown, 
  ArrowUp, 
  Info,
  Clock,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';

// Chart.js imports
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const History = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29); // Default 30 days including today
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // PDF Report month selection
  const [reportMonth, setReportMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });
  const [downloading, setDownloading] = useState(false);

  const fetchHistoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getHistory(startDate, endDate);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve historical data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchHistoryData();
  };

  const handleDownloadReport = async (e) => {
    e.preventDefault();
    setDownloading(true);
    try {
      await downloadReport(reportMonth);
    } catch (err) {
      alert('Failed to generate and download report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="skeleton" style={{ width: '280px', height: '36px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const { statistics, lineChart, stackedChart, heatmap, logsTable } = data || {};

  // Setup Line Chart configuration
  const lineChartConfig = {
    labels: lineChart ? lineChart.map(item => {
      const dateParts = item.date.split('-');
      return `${dateParts[1]}/${dateParts[2]}`; // MM/DD format
    }) : [],
    datasets: [
      {
        label: 'Daily Footprint (kg CO₂)',
        data: lineChart ? lineChart.map(item => item.emissions) : [],
        borderColor: '#2c6b4f',
        backgroundColor: 'rgba(44, 107, 79, 0.08)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#2c6b4f',
        pointHoverRadius: 6
      },
      {
        label: 'Daily Budget Limit',
        data: lineChart ? lineChart.map(item => item.budget) : [],
        borderColor: '#d32f2f',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Outfit', size: 12, weight: '500' }
        }
      },
      tooltip: {
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kg CO₂',
          font: { family: 'Outfit', weight: '600' }
        }
      }
    }
  };

  // Setup Stacked Bar configuration
  const stackedBarConfig = {
    labels: stackedChart ? stackedChart.map(item => {
      const dateParts = item.date.split('-');
      return `${dateParts[1]}/${dateParts[2]}`; // MM/DD
    }) : [],
    datasets: [
      {
        label: 'Travel',
        data: stackedChart ? stackedChart.map(item => item.travel) : [],
        backgroundColor: '#4d9078' // Seafoam
      },
      {
        label: 'Food',
        data: stackedChart ? stackedChart.map(item => item.food) : [],
        backgroundColor: '#81c784' // Light Green
      },
      {
        label: 'Energy',
        data: stackedChart ? stackedChart.map(item => item.energy) : [],
        backgroundColor: '#ffd54f' // Yellow
      }
    ]
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Outfit', size: 12, weight: '500' }
        }
      }
    },
    scales: {
      x: { stacked: true },
      y: { 
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'kg CO₂',
          font: { family: 'Outfit', weight: '600' }
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', letterSpacing: '-0.5px' }}>History & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review charts, track historical metrics, and download carbon reports.</p>
        </div>
      </div>

      {/* Control Panel Card: Date range filters & PDF generator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Date Filter Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Filter Date Range</h3>
          <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '130px' }}>
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '130px' }}>
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <RefreshCw size={16} />
              <span>Apply</span>
            </button>
          </form>
        </div>

        {/* PDF Exporter Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Download Carbon Report</h3>
          <form onSubmit={handleDownloadReport} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
              <label className="form-label">Select Reporting Month</label>
              <input 
                type="month" 
                className="form-input" 
                value={reportMonth} 
                onChange={(e) => setReportMonth(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', gap: '0.5rem' }} disabled={downloading}>
              {downloading ? (
                <>
                  <RefreshCw size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Historical Statistics Dashboard */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card: Total Emissions */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Info size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Range Footprint</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{statistics.rangeTotal.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>kg</span></h3>
            </div>
          </div>

          {/* Card: 7-Day Average */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>7-Day Average</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{statistics.sevenDayAverage.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>kg</span></h3>
            </div>
          </div>

          {/* Card: Best Day */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(46, 125, 50, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <ArrowDown size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lowest Carbon Day</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{statistics.bestDay.emissions.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>kg</span></h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{statistics.bestDay.date}</span>
            </div>
          </div>

          {/* Card: Worst Day */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(211, 47, 47, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <ArrowUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Highest Carbon Day</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{statistics.worstDay.emissions.toFixed(1)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>kg</span></h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{statistics.worstDay.date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts & Heatmap Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Chart 1: Line graph */}
          <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Daily Carbon Footprint (Last 30 Days)</h3>
            <div style={{ flex: 1, position: 'relative' }}>
              {lineChart && lineChart.length > 0 ? (
                <Line data={lineChartConfig} options={lineChartOptions} />
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-secondary)' }}>No log data within range.</div>
              )}
            </div>
          </div>

          {/* Chart 2: Stacked category breakdown */}
          <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>14-Day Category Breakdown</h3>
            <div style={{ flex: 1, position: 'relative' }}>
              {stackedChart && stackedChart.length > 0 ? (
                <Bar data={stackedBarConfig} options={stackedBarOptions} />
              ) : (
                <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-secondary)' }}>No log data within range.</div>
              )}
            </div>
          </div>

        </div>

        {/* Heatmap & Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Calendar Heatmap */}
          <div className="glass-card">
            <Heatmap data={heatmap} />
          </div>

          {/* Daily Table Logs */}
          <div className="glass-card" style={{ maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Daily Activity Logs</h3>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Travel</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Food</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Energy</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {logsTable && logsTable.map((row) => (
                    <tr key={row.date} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {row.travel ? `${row.travel.emissions.toFixed(1)}` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {row.food ? `${row.food.emissions.toFixed(1)}` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {row.energy ? `${row.energy.emissions.toFixed(1)}` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                        {row.totalEmission.toFixed(1)}
                      </td>
                    </tr>
                  ))}

                  {(!logsTable || logsTable.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                        No records stored for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default History;
