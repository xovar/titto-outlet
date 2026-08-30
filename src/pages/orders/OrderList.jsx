import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, deliverOrderWithSkus } from '../../store/slices/orderSlice';
import OrderDetailsModal from './OrderDetailsModal';
import {
  Search,
  Eye,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function OrderList() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get('status') || 'all';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redux Store
  const { items, pagination, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({ page: currentPage, limit: 10, status: currentStatus }));
  }, [dispatch, currentStatus, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage);
      if (currentStatus === 'all') {
        newParams.delete('status');
      }
      setSearchParams(newParams);
    }
  };

  const filteredOrders = (items || []).filter((order) => {
    const firstName = order.firstName || order.first_name || '';
    const lastName = order.lastName || order.last_name || '';
    const name = `${firstName} ${lastName}`.toLowerCase();
    const phone = order.phone || '';
    const orderId = (order.id || order._id || '').toString().toLowerCase();
    const search = searchTerm.toLowerCase();

    return orderId.includes(search) || name.includes(search) || phone.includes(search);
  });

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // FIX: OrderDetailsModal was previously rendered with no `onUpdateStatus`
  // prop at all — the modal's "if (onUpdateStatus)" check always fell
  // through to its console.log-only fallback, so "Mark as Delivered" never
  // actually called the backend. This wires it to the deliverOrderWithSkus
  // thunk (PUT /orders/:id/status with { status, items }), and re-throws
  // on failure so the modal's own catch block (rather than silently
  // closing) is what runs.
  const handleUpdateStatus = async (payload) => {
    const resultAction = await dispatch(deliverOrderWithSkus(payload));

    if (!deliverOrderWithSkus.fulfilled.match(resultAction)) {
      throw new Error(resultAction.payload || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      shipped: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    };

    const icons = {
      pending: <Clock size={13} />,
      processing: <RefreshCw size={13} className="animate-spin" />,
      shipped: <Truck size={13} />,
      delivered: <CheckCircle2 size={13} />,
      cancelled: <XCircle size={13} />,
    };

    const key = status?.toLowerCase() || 'pending';

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
          statusClasses[key] || statusClasses.pending
        }`}
      >
        {icons[key]}
        {status || 'Pending'}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Order Management
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-light dark:border-border-dark text-sm scrollbar-none">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setSearchParams(tab === 'all' ? {} : { status: tab, page: '1' })
              }
              className={`px-3.5 py-1.5 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
                currentStatus === tab
                  ? 'bg-accent-brand/10 text-accent-brand font-semibold'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-background-light dark:hover:bg-background-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
            />
            <input
              type="text"
              placeholder="Search by ID, Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
            />
          </div>

          <button
            onClick={() => dispatch(fetchOrders({ page: currentPage, limit: 10, status: currentStatus }))}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-all text-text-secondary-light dark:text-text-secondary-dark w-full sm:w-auto justify-center"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-accent-brand" />
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <Package size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-base">No orders found</p>
            <p className="text-xs mt-1">Try changing your search terms or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filteredOrders.map((order) => {
                  const deliveryCharge = parseFloat(
                    order.deliveryCharge ?? order.delivery_charge ?? 0
                  );

                  const computedSubtotal =
                    order.items && order.items.length > 0
                      ? order.items.reduce(
                          (acc, item) =>
                            acc + parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1),
                          0
                        )
                      : parseFloat(order.price || 0);

                  const discountAmount = (() => {
                    if (order.items && order.items.length > 0) {
                      return order.items.reduce((acc, item) => {
                        const itemPrice = parseFloat(item.price || 0);
                        const itemQty = parseFloat(item.quantity || item.qty || 1);
                        const itemDiscVal = parseFloat(item.discount || 0);
                        const type =
                          item.discount_type ||
                          item.discountType ||
                          order.discount_type ||
                          order.discountType ||
                          'percent';

                        if (type === 'percent' || type === 'percentage') {
                          return acc + ((itemPrice * itemDiscVal) / 100) * itemQty;
                        }
                        return acc + itemDiscVal * itemQty;
                      }, 0);
                    }

                    const orderDiscVal = parseFloat(order.discount || 0);
                    const type = order.discount_type || order.discountType || 'percent';

                    if (type === 'percent' || type === 'percentage') {
                      return (computedSubtotal * orderDiscVal) / 100;
                    }
                    return orderDiscVal;
                  })();

                  const totalPrice = Math.max(0, computedSubtotal + deliveryCharge - discountAmount);
                  const firstName = order.firstName || order.first_name || 'Customer';
                  const lastName = order.lastName || order.last_name || '';
                  const orderId = order.id || order._id;

                  return (
                    <tr
                      key={orderId}
                      className="hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-accent-brand">
                        #{orderId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {firstName} {lastName}
                        </div>
                        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {order.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark font-mono">
                        ৳{totalPrice.toLocaleString('en-BD')}
                        {discountAmount > 0 && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                            (-৳{discountAmount.toLocaleString('en-BD')} off)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-5 py-4 text-xs text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {order.createdAt || order.created_at
                            ? new Date(order.createdAt || order.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(order)}
                          className="inline-flex cursor-pointer p-1.5 rounded-md hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-accent-brand transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <div>
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> (Total{' '}
              <span className="font-semibold">{pagination.total}</span> orders)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal Component */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}