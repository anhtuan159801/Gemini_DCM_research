import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  data: number[];
}

interface ChartProps {
  data: ChartData;
}

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          family: 'Inter, sans-serif'
        }
      }
    },
  },
};

const barColors = [
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#bfdbfe', // blue-200
  '#dbeafe', // blue-100
];

const pieColors = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
];


export const BarChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Số lượng',
        data: data.data,
        backgroundColor: data.labels.map((_, i) => barColors[i % barColors.length]),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Ensure y-axis labels are integers
        }
      },
    },
    plugins: {
        ...commonOptions.plugins,
        legend: {
            display: false // Hide legend for bar chart
        }
    }
  };

  return <div style={{height: '400px'}}><Bar options={options} data={chartData} /></div>;
};


export const PieChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Tỷ lệ',
        data: data.data,
        backgroundColor: data.labels.map((_, i) => pieColors[i % pieColors.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  return <div style={{height: '400px'}}><Pie options={commonOptions} data={chartData} /></div>;
};