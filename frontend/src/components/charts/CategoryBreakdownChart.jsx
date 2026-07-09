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
import { formatDateLabel } from "../../utils/carbonCalculator";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CategoryBreakdownChart = ({ data = [] }) => {
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
        label: "Travel",
        data: data.map((item) => item.travel),
        backgroundColor: "#4d9078",
      },
      {
        label: "Food",
        data: data.map((item) => item.food),
        backgroundColor: "#81c784",
      },
      {
        label: "Energy",
        data: data.map((item) => item.energy),
        backgroundColor: "#ffd54f",
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
      x: { stacked: true },
      y: {
        stacked: true,
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

export default CategoryBreakdownChart;
