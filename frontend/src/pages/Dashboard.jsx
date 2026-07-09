import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getHistory } from "../services/api";
import DashboardGauge from "../components/DashboardGauge";
import { DashboardSkeleton } from "../components/SkeletonLoader";
import BadgeGrid from "../components/badges/BadgeGrid";
import { useAuth } from "../context/AuthContext";
import {
  EmissionsLineChart,
  CategoryBreakdownChart,
  BudgetComparisonChart,
} from "../components/charts";
import DashboardStats from "../components/charts/DashboardStats";
import Heatmap from "../components/Heatmap";
import {
  Flame,
  Award,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Car,
  Utensils,
  Zap,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, histRes] = await Promise.all([
        getDashboard(),
        getHistory(),
      ]);
      setData(dashRes.data);
      setHistoryData(histRes.data);

      if (dashRes.data.user) {
        updateProfile({
          streak: dashRes.data.user.streak,
          badges: dashRes.data.user.badges,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Could not retrieve dashboard data. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="skeleton" style={{ width: "250px", height: "36px", marginBottom: "2rem" }} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem 2rem" }}>
        <AlertCircle size={48} style={{ color: "var(--danger)", marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>Failed to Load Dashboard</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const { user, todaySummary, recentActivities, progressCards } = data;
  const stats = historyData?.statistics;

  const enhancedStats = stats
    ? {
        ...stats,
        badgeCount: user.badges?.length || 0,
        budgetUsage: user.carbonBudget > 0 ? (stats.sevenDayAverage / user.carbonBudget) * 100 : 0,
      }
    : null;

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Travel": return <Car size={16} />;
      case "Food": return <Utensils size={16} />;
      case "Energy": return <Zap size={16} />;
      default: return <TrendingDown size={16} />;
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-family-title)", letterSpacing: "-0.5px" }}>
            Hello, {user.name || "Eco Advocate"}! 🌿
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Your environmental impact metrics snapshot for today.</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            padding: "0.6rem 1.2rem",
            borderRadius: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-family-title)",
            border: "1px solid var(--border-color)",
            fontSize: "0.95rem",
          }}
        >
          <Flame size={20} fill="var(--primary)" />
          <span>{user.streak} Day Streak</span>
        </div>
      </div>

      {/* Analytics Stats Row */}
      {enhancedStats && (
        <div style={{ marginBottom: "1.5rem" }}>
          <DashboardStats stats={enhancedStats} budget={user.carbonBudget} />
        </div>
      )}

      {/* Main Dashboard Layout Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Gauge, Charts & Checklists */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Carbon Budget Gauge */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
            <h3 style={{ alignSelf: "flex-start", marginBottom: "0.5rem", fontSize: "1.1rem" }}>Daily Carbon Budget Tracker</h3>
            <DashboardGauge totalEmission={todaySummary.totalEmission} budget={user.carbonBudget} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "1rem", lineHeight: "1.4" }}>
              {todaySummary.totalEmission > user.carbonBudget
                ? `You are currently ${Math.abs(todaySummary.budgetRemaining).toFixed(1)} kg CO₂ over your daily budget.`
                : `You have ${todaySummary.budgetRemaining.toFixed(1)} kg CO₂ remaining in your daily budget.`}
            </p>
          </div>

          {/* 30-Day Line Chart */}
          {historyData?.lineChart && historyData.lineChart.length > 0 && (
            <div className="glass-card" style={{ height: "320px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>30-Day Carbon Trend</h3>
              <div style={{ flex: 1, position: "relative" }}>
                <EmissionsLineChart data={historyData.lineChart} budget={user.carbonBudget} />
              </div>
            </div>
          )}

          {/* Budget Comparison Chart */}
          {historyData?.lineChart && historyData.lineChart.length > 0 && (
            <div className="glass-card" style={{ height: "300px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Budget Comparison</h3>
              <div style={{ flex: 1, position: "relative" }}>
                <BudgetComparisonChart data={historyData.lineChart} budget={user.carbonBudget} />
              </div>
            </div>
          )}

          {/* Daily Logging Checklist */}
          <div className="glass-card">
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Today's Habit Logger Checklist</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {[
                { key: "travel", label: "Travel & Commutes", logData: todaySummary.travel },
                { key: "food", label: "Daily Meals & Diet", logData: todaySummary.food },
                { key: "energy", label: "Utilities & Energy", logData: todaySummary.energy },
              ].map(({ key, label, logData }) => {
                const logged = progressCards[`${key}Logged`];
                return (
                  <div
                    key={key}
                    onClick={() => navigate("/log", { state: { initialTab: key } })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      background: logged ? "var(--primary-light)" : "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {logged ? <CheckCircle2 size={20} style={{ color: "var(--success)" }} /> : <PlusCircle size={20} style={{ color: "var(--text-secondary)" }} />}
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span>{logged && logData ? `${logData.emissions.toFixed(1)} kg CO₂` : "Log Now"}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Badges, Charts & Activities */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Achievements Badges */}
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Award size={20} style={{ color: "var(--primary)" }} />
              <h3 style={{ fontSize: "1.1rem" }}>Sustainability Badges</h3>
            </div>
            <BadgeGrid unlockedBadges={user.badges || []} />
          </div>

          {/* 14-Day Category Breakdown Chart */}
          {historyData?.stackedChart && historyData.stackedChart.length > 0 && (
            <div className="glass-card" style={{ height: "340px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>14-Day Category Breakdown</h3>
              <div style={{ flex: 1, position: "relative" }}>
                <CategoryBreakdownChart data={historyData.stackedChart} />
              </div>
            </div>
          )}

          {/* Heatmap */}
          {historyData?.heatmap && (
            <div className="glass-card">
              <Heatmap data={historyData.heatmap} />
            </div>
          )}

          {/* Recent Activity List */}
          <div className="glass-card">
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Recent Activities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getCategoryIcon(act.category)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 600 }}>{act.description}</h4>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {new Date(act.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {act.emissions.toFixed(1)} kg CO₂
                  </span>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  No activities recorded in the last 7 days.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
