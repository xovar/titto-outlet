export default function KpiCard({ icon: Icon, iconColor, label, value, subtext }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="card card-hover p-5" id={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {label}
          </p>
          <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[iconColor] || colorMap.blue}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
