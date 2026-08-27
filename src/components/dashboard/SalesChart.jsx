import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSelector } from 'react-redux';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="card px-4 py-3 shadow-lg" style={{ minWidth: 160 }}>
      <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          {entry.name === 'revenue' ? `$${entry.value.toLocaleString()}` : `${entry.value} items`}
        </p>
      ))}
    </div>
  );
}

export default function SalesChart({ data }) {
  const { darkMode } = useSelector((state) => state.theme);

  const gridColor = darkMode ? '#1E293B' : '#F1F5F9';
  const textColor = darkMode ? '#94A3B8' : '#64748B';

  return (
    <div className="card p-5" id="sales-chart">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
            Sales Analytics
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
            Last 30 days performance
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-brand" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-success" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Revenue</span>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: textColor }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#gradientSales)"
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gradientRevenue)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
