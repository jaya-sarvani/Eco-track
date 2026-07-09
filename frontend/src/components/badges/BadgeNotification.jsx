import React, { useEffect } from "react";

const BadgeNotification = ({ badges = [], onClose }) => {
  useEffect(() => {
    if (badges.length > 0 && onClose) {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [badges.length, onClose]);

  if (!badges || badges.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFF9E6 0%, #FFF2CC 100%)",
        border: "1px solid #FFE0B2",
        padding: "1.25rem",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(255, 179, 0, 0.15)",
        animation: "pulse 2s infinite",
      }}
    >
      <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>
        🎉
      </span>
      <h3
        style={{
          color: "#E65100",
          fontWeight: 800,
          fontSize: "1.1rem",
          marginBottom: "0.25rem",
        }}
      >
        Badge Unlocked!
      </h3>
      <p
        style={{
          fontSize: "0.85rem",
          color: "#B78103",
          marginBottom: "0.75rem",
        }}
      >
        Congratulations, you completed a new eco goal:
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {badges.map((b) => (
          <span
            key={b}
            style={{
              backgroundColor: "white",
              border: "1px solid #FFE0B2",
              padding: "0.35rem 0.85rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#E65100",
            }}
          >
            🏆 {b}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BadgeNotification;
