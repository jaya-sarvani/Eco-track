import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthlySummaryChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
        No monthly summary data available.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Total Emissions (kg CO₂)",
        data: data.map((item) => item.total),
        backgroundColor: "rgba(44, 107, 79, 0.7)",
        borderColor: "#2c6b4f",
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Average Daily (kg CO₂)",
        data: data.map((item) => item.average),
        backgroundColor: "rgba(77, 144, 120, 0.7)",
        borderColor: "#4d9078",
        borderWidth: 1,
        borderRadius: 6,
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

  return <Bar data={chartData} options={options} />;
};

export default MonthlySummaryChart;
