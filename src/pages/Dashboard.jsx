import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import KpiCard from '../components/dashboard/KpiCard';
import SalesChart from '../components/dashboard/SalesChart';
import RecentOrders from '../components/dashboard/RecentOrders';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, salesChart, recentOrders, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-[80vh]" id="dashboard-view">
      {/* 💡 Overlay with Blur Effect & Message */}
      <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-lg transition-all">
        <div className="bg-white/80 dark:bg-gray-900/80 border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-xl max-w-md">
          <p className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-wide">
            Working so hard on it please be patient 🙏
          </p>
        </div>
      </div>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={ShoppingBag}
          iconColor="blue"
          label="Total Sales"
          value={stats?.totalSales?.toLocaleString() || '0'}
          subtext={`↑ ${stats?.salesGrowth || 0}% from last month`}
        />
        <KpiCard
          icon={DollarSign}
          iconColor="green"
          label="Total Revenue"
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          subtext={`↑ ${stats?.revenueGrowth || 0}% from last month`}
        />
        <KpiCard
          icon={TrendingUp}
          iconColor="amber"
          label="Today's Sales"
          value={`${stats?.todaySales || 0} items`}
          subtext="Orders received today"
        />
        <KpiCard
          icon={Activity}
          iconColor="purple"
          label="Today's Revenue"
          value={`$${stats?.todayRevenue?.toLocaleString() || '0'}`}
          subtext="Daily run-rate"
        />
      </div>

      {/* Sales Chart */}
      <SalesChart data={salesChart} />

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}