'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Phone,
  Clock,
  TrendingUp,
  Award,
  Target,
  Smile,
  Meh,
  Frown,
  Loader2,
  BarChart3
} from 'lucide-react';
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?days=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
        <p className="text-gray-600">Make some calls to see analytics</p>
      </div>
    );
  }

  // Prepare chart data
  const callsChartData = {
    labels: data.callsOverTime.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Calls per Day',
        data: data.callsOverTime.map(d => d.count),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const durationChartData = {
    labels: data.avgDurationOverTime.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Avg Duration (seconds)',
        data: data.avgDurationOverTime.map(d => d.avgDurationSeconds),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const sentimentChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          data.sentimentDistribution.positive,
          data.sentimentDistribution.neutral,
          data.sentimentDistribution.negative,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' ,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track performance and insights
          </p>
        </div>

        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-40"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
              <p className="text-3xl font-bold">{data.metrics.totalCalls}</p>
            </div>
            <Phone className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Duration</p>
              <p className="text-3xl font-bold">{data.metrics.avgDuration}s</p>
            </div>
            <Clock className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quality Score</p>
              <p className="text-3xl font-bold">{data.metrics.avgQualityScore}/10</p>
            </div>
            <Award className="w-10 h-10 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
              <p className="text-3xl font-bold">{data.metrics.successRate}%</p>
            </div>
            <Target className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold">{data.metrics.completedCalls}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calls Over Time */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Calls Over Time
          </h3>
          <div className="h-[300px]">
            <Line data={callsChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Average Duration */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Average Call Duration
          </h3>
          <div className="h-[300px]">
            <Bar data={durationChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Sentiment & Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sentiment Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Smile className="w-5 h-5" />
            Sentiment Distribution
          </h3>
          <div className="h-[250px]">
            <Doughnut 
              data={sentimentChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
        </Card>

        {/* Sentiment Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Sentiment Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-green-600" />
                <span className="font-medium">Positive</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {data.sentimentDistribution.positive}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Meh className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Neutral</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {data.sentimentDistribution.neutral}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Frown className="w-5 h-5 text-red-600" />
                <span className="font-medium">Negative</span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {data.sentimentDistribution.negative}
              </span>
            </div>
          </div>
        </Card>

        {/* Analytics Coverage */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Analytics Coverage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Scored Calls</span>
                <span className="text-sm font-medium">
                  {data.callsWithAnalytics} / {data.metrics.totalCalls}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${data.metrics.totalCalls > 0
                      ? (data.callsWithAnalytics / data.metrics.totalCalls) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              <p>
                {data.metrics.totalCalls - data.callsWithAnalytics} calls haven't been
                scored yet. Scorecards are generated automatically after each call.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}