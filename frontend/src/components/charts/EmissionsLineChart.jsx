import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { formatDateLabel } from "../../utils/carbonCalculator";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const EmissionsLineChart = ({ data = [], budget = 15 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
        No data available for this chart.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => formatDateLabel(item.date)),
    datasets: [
      {
        label: "Daily Footprint (kg CO₂)",
        data: data.map((item) => item.emissions),
        borderColor: "#2c6b4f",
        backgroundColor: "rgba(44, 107, 79, 0.08)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: "#2c6b4f",
        pointHoverRadius: 6,
      },
      {
        label: "Daily Budget Limit",
        data: data.map(() => budget),
        borderColor: "#d32f2f",
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { family: "Outfit", size: 12, weight: "500" } },
      },
      tooltip: {
        titleFont: { family: "Outfit" },
        bodyFont: { family: "Inter" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "kg CO₂",
          font: { family: "Outfit", weight: "600" },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default EmissionsLineChart;
