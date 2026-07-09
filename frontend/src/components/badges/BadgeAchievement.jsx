import React from "react";
import { BADGE_DEFINITIONS } from "./badgeDefinitions";

const BadgeAchievement = ({ badgeName, unlocked = false }) => {
  const badge = BADGE_DEFINITIONS.find((b) => b.name === badgeName);
  if (!badge) return null;

  return (
    <div
      className={`badge-card ${unlocked ? "unlocked" : ""}`}
      title={badge.description}
      style={{ cursor: "help", position: "relative" }}
    >
      <span style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block" }}>
        {badge.icon}
      </span>
      <span className="badge-title">{badge.name}</span>
      {unlocked && (
        <div
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "var(--success)",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.5rem",
            color: "white",
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
};

export default BadgeAchievement;
