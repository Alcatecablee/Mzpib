import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TopVideo {
  videoId: string;
  videoName: string;
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
}

interface AnalyticsTrend {
  date: string;
  views: number;
  watchTime: number;
  uniqueViewers: number;
}

interface Props {
  viewTrends: AnalyticsTrend[];
  topVideos: TopVideo[];
}

export function OverviewCharts({ viewTrends, topVideos }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold mb-4">View Trends (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={viewTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" />
            <Line type="monotone" dataKey="uniqueViewers" stroke="#10b981" name="Unique Viewers" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Top Videos by Views</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topVideos.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="videoName" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalViews" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
