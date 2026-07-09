import React from "react";

const BADGE_DEFINITIONS = [
  { name: "First Log", description: "Log your first carbon entry", icon: "🌱" },
  { name: "3-Day Streak", description: "Log for 3 consecutive days", icon: "🔥" },
  { name: "7-Day Streak", description: "Log for 7 consecutive days", icon: "⚡" },
  { name: "30-Day Consistency", description: "Log for 30 consecutive days", icon: "📅" },
  { name: "Green Traveler", description: "Use walking, biking, train, or EV", icon: "🚲" },
  { name: "Food Saver", description: "7 days of vegetarian/vegan diet", icon: "🥗" },
  { name: "Energy Guardian", description: "5 days of 50%+ renewable energy", icon: "⚡" },
  { name: "Carbon Champion", description: "7 days under carbon budget", icon: "🏆" },
];

const BadgeGrid = ({ unlockedBadges = [] }) => {
  return (
    <div className="badges-grid">
      {BADGE_DEFINITIONS.map((badge) => {
        const isUnlocked = unlockedBadges.includes(badge.name);
        return (
          <div
            key={badge.name}
            className={`badge-card ${isUnlocked ? "unlocked" : ""}`}
            title={badge.description}
            style={{ cursor: "help" }}
          >
            <span
              className="badge-icon"
              style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block" }}
            >
              {badge.icon}
            </span>
            <span className="badge-title">{badge.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeGrid;
