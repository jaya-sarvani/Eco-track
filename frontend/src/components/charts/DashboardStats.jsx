import React from "react";
import { Info, Clock, ArrowDown, ArrowUp, Flame, Award, Gauge } from "lucide-react";

const StatsCard = ({ icon: Icon, label, value, unit, color = "var(--primary)", sublabel }) => (
  <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "10px",
        backgroundColor: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      <Icon size={20} />
    </div>
    <div>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{label}</span>
      <h3 style={{ fontSize: "1.35rem", fontWeight: 800 }}>
        {value} <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{unit}</span>
      </h3>
      {sublabel && (
        <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>{sublabel}</span>
      )}
    </div>
  </div>
);

const DashboardStats = ({ stats, budget }) => {
  if (!stats) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem",
      }}
    >
      <StatsCard
        icon={Info}
        label="Total CO₂ (Range)"
        value={stats.rangeTotal?.toFixed(1) || "0.0"}
        unit="kg"
      />
      <StatsCard
        icon={Clock}
        label="7-Day Average"
        value={stats.sevenDayAverage?.toFixed(1) || "0.0"}
        unit="kg"
      />
      <StatsCard
        icon={Clock}
        label="30-Day Average"
        value={stats.thirtyDayAverage?.toFixed(1) || stats.sevenDayAverage?.toFixed(1) || "0.0"}
        unit="kg"
      />
      <StatsCard
        icon={ArrowDown}
        label="Best Day"
        value={stats.bestDay?.emissions?.toFixed(1) || "0.0"}
        unit="kg"
        color="var(--success)"
        sublabel={stats.bestDay?.date || "N/A"}
      />
      <StatsCard
        icon={ArrowUp}
        label="Worst Day"
        value={stats.worstDay?.emissions?.toFixed(1) || "0.0"}
        unit="kg"
        color="var(--danger)"
        sublabel={stats.worstDay?.date || "N/A"}
      />
      <StatsCard
        icon={Flame}
        label="Current Streak"
        value={stats.currentStreak || 0}
        unit="days"
        color="#f9a825"
      />
      <StatsCard
        icon={Award}
        label="Badge Count"
        value={stats.badgeCount || 0}
        unit="earned"
        color="var(--secondary)"
      />
      <StatsCard
        icon={Gauge}
        label="Budget Usage"
        value={stats.budgetUsage?.toFixed(0) || "0"}
        unit="%"
        color={stats.budgetUsage > 100 ? "var(--danger)" : stats.budgetUsage > 70 ? "var(--warning)" : "var(--success)"}
        sublabel={`of ${budget} kg/day`}
      />
    </div>
  );
};

export default DashboardStats;
