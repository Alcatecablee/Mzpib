import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface StorageData {
  name: string;
  count: number;
  percentage: number;
}

interface FolderBreakdown {
  name: string;
  size: number;
  count: number;
  sizeGB: number;
}

interface Props {
  sizeDistribution: StorageData[];
  folderBreakdown: FolderBreakdown[];
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export function StorageCharts({ sizeDistribution, folderBreakdown }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold mb-4">Storage Distribution by Size</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sizeDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {sizeDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Storage by Folder</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={folderBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} GB`} />
            <Bar dataKey="sizeGB" fill="#10b981" name="Size (GB)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
