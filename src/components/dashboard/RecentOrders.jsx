import { Package } from 'lucide-react';

function StatusBadge({ status }) {
  const classMap = {
    'Ordered': 'badge-ordered',
    'On the Way': 'badge-on-the-way',
    'Delivered': 'badge-delivered',
  };

  return (
    <span className={`badge ${classMap[status] || 'badge-ordered'}`}>
      {status}
    </span>
  );
}

export default function RecentOrders({ orders }) {
  if (!orders?.length) {
    return (
      <div className="card p-5">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No recent orders.</p>
      </div>
    );
  }

  return (
    <div className="card" id="recent-orders">
      <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
        <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
          Recent Purchases
        </h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
          Latest order activity stream
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light dark:border-border-dark">
              <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                Product
              </th>
              <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-5 py-3 font-medium text-text-secondary-light dark:text-text-secondary-dark text-xs uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-background-light dark:hover:bg-background-dark transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-brand/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-accent-brand">
                        {order.customer.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark whitespace-nowrap">
                      {order.customer}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-text-secondary-light dark:text-text-secondary-dark shrink-0" />
                    <span className="text-text-secondary-light dark:text-text-secondary-dark truncate max-w-[200px]">
                      {order.product}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {order.amount}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3.5 text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
