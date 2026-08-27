import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import axiosInstance from '../../api/axiosInstance';
import {
  fetchOrderById,
  updateOrderStatus,
  updateOrderOutlet,
  clearSelectedOrder,
  clearOrderError,
} from '../../store/slices/orderSlice';

import {
  ArrowLeft,
  Printer,
  User,
  Phone,
  MapPin,
  Package,
  Clock,
  Save,
  Calendar,
  CreditCard,
  Check,
  RefreshCw,
  AlertCircle,
  Truck,
  XCircle,
  Store,
} from 'lucide-react';

import logo from "../../assets/titto-red.logo.png";

// Status configuration for badges
const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: Clock },
  processing: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: Package },
  shipped: { color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', icon: Truck },
  delivered: { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: Check },
  cancelled: { color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', icon: XCircle },
};

export default function OrderDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Redux State থেকে ডাটা নেওয়া
  const { selectedOrder, loading, updating, error } = useSelector((state) => state.orders);

  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' | 'error'

  // Outlet control state (mirrors the status control below)
  const [outletId, setOutletId] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(false);
  const [outletMessage, setOutletMessage] = useState('');
  const [outletMessageType, setOutletMessageType] = useState('success');

  // Memoized order data extraction
  const order = useMemo(() => {
    if (!selectedOrder) return null;
    // Handle different response structures
    return selectedOrder.data || selectedOrder.order || selectedOrder;
  }, [selectedOrder]);

  // FIX: subtotal and discountAmount used to be plain consts / a useMemo
  // declared AFTER the `if (loading) return` and `if (!order) return`
  // early returns below. That meant these hooks were skipped entirely on
  // the loading/not-found renders, then suddenly called once the order
  // loaded — a classic "hooks called in different order between renders"
  // violation. Both are now computed here, above every early return, and
  // guard internally for a null `order` instead of relying on the early
  // returns to have already happened.

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return order.items && order.items.length > 0
      ? order.items.reduce((acc, item) => {
          const price = parseFloat(item.price || 0);
          const qty = parseFloat(item.quantity || item.qty || 1);
          return acc + (price * qty);
        }, 0)
      : parseFloat(order.price || order.total || 0);
  }, [order]);

  const discountAmount = useMemo(() => {
    if (!order) return 0;

    if (order.items && order.items.length > 0) {
      return order.items.reduce((acc, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const itemQty = parseFloat(item.quantity || item.qty || 1);
        const itemDiscVal = parseFloat(item.discount || 0);
        const type = item.discount_type || item.discountType || order.discount_type || order.discountType || 'percent';

        if (type === 'percent' || type === 'percentage') {
          return acc + ((itemPrice * itemDiscVal) / 100) * itemQty;
        }
        return acc + (itemDiscVal * itemQty);
      }, 0);
    }

    const orderDiscVal = parseFloat(order.discount || 0);
    const type = order.discount_type || order.discountType || 'percent';

    if (type === 'percent' || type === 'percentage') {
      return (subtotal * orderDiscVal) / 100;
    }
    return orderDiscVal;
  }, [order, subtotal]);

  // Fetch order on mount
  useEffect(() => {
    if (id && id !== 'undefined' && id !== 'null') {
      dispatch(fetchOrderById(id));
    }

    return () => {
      dispatch(clearSelectedOrder());
      dispatch(clearOrderError());
    };
  }, [dispatch, id]);

  // Set status when order loads
  useEffect(() => {
    if (order?.status) {
      setStatus(order.status);
    }
  }, [order?.status]);

  // Set outlet selection when order loads
  useEffect(() => {
    if (order?.outletId) {
      setOutletId(String(order.outletId));
    }
  }, [order?.outletId]);

  // Fetch outlets that can actually fulfill THIS order — i.e. have enough
  // stock, for every item in it, at the assigned outlet's chosen size(s).
  // Re-runs whenever the order (and thus its items) changes.
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') return;

    let cancelled = false;

    const loadOutlets = async () => {
      setLoadingOutlets(true);
      try {
        const res = await axiosInstance.get(`/orders/${id}/available-outlets`);
        const list = res.data?.data || res.data || [];
        if (!cancelled) setOutlets(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setOutlets([]);
      } finally {
        if (!cancelled) setLoadingOutlets(false);
      }
    };

    loadOutlets();
    return () => {
      cancelled = true;
    };
  }, [id, order?.items]);

  // Auto-hide status message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-hide outlet message after 4 seconds
  useEffect(() => {
    if (outletMessage) {
      const timer = setTimeout(() => setOutletMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [outletMessage]);

  // Handle status update
  const handleStatusUpdate = useCallback(async () => {
    if (!id || !status || status === order?.status) {
      setMessage('Please select a different status to update');
      setMessageType('error');
      return;
    }

    setMessage('');

    try {
      const resultAction = await dispatch(updateOrderStatus({ id, status }));

      if (updateOrderStatus.fulfilled.match(resultAction)) {
        setMessage('Order status updated successfully!');
        setMessageType('success');
      } else {
        setMessage(resultAction.payload || 'Failed to update status');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to update status. Please try again.');
      setMessageType('error');
    }
  }, [dispatch, id, status, order?.status]);

  // Handle outlet update
  const handleOutletUpdate = useCallback(async () => {
    if (!id || !outletId || String(outletId) === String(order?.outletId || '')) {
      setOutletMessage('Please select a different outlet to update');
      setOutletMessageType('error');
      return;
    }

    setOutletMessage('');

    try {
      const resultAction = await dispatch(updateOrderOutlet({ id, outletId }));

      if (updateOrderOutlet.fulfilled.match(resultAction)) {
        setOutletMessage('Order outlet updated successfully!');
        setOutletMessageType('success');
      } else {
        setOutletMessage(resultAction.payload || 'Failed to update outlet');
        setOutletMessageType('error');
      }
    } catch (err) {
      setOutletMessage('Failed to update outlet. Please try again.');
      setOutletMessageType('error');
    }
  }, [dispatch, id, outletId, order?.outletId]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Every hook above this line runs on every render, in the same order,
  // regardless of loading/order state. Only plain JSX / plain consts
  // follow the early returns below. ──

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-secondary-light dark:text-text-secondary-dark">
        <RefreshCw size={32} className="animate-spin text-accent-brand mb-3" />
        <p className="font-medium">Loading order details...</p>
      </div>
    );
  }

  // Not found state
  if (!order || (!order.id && !order._id)) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-rose-500">Order Not Found</h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
            {error || `The requested order ID (${id}) does not exist or has been removed.`}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Calculate order values (plain consts — not hooks, safe below the early returns)
  const deliveryCharge = parseFloat(
    order.deliveryCharge ?? order.delivery_charge ?? 0
  );

  const grandTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const orderIdDisplay = order.id || order._id || id;

  const customerName = (order.firstName || order.first_name || order.lastName || order.last_name)
    ? `${order.firstName || order.first_name || ''} ${order.lastName || order.last_name || ''}`.trim()
    : (order.name || order.customer_name || 'Customer');

  const fullAddress = [
    order.address,
    order.cityDistrict || order.city_district || order.district,
    order.postalCode || order.postal_code,
  ]
    .filter(Boolean)
    .join(', ') || 'N/A';

  const orderDate = order.createdAt || order.created_at
    ? new Date(order.createdAt || order.created_at).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const statusInfo = STATUS_CONFIG[order.status?.toLowerCase()] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 p-4 md:p-6 print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2 print:hidden">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => dispatch(clearOrderError())}
            className="ml-auto hover:opacity-70"
            aria-label="Dismiss error"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Top Bar Navigation (প্রিন্টে হাইড থাকবে) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
            aria-label="Back to orders"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Order #{orderIdDisplay}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon size={12} />
                {order.status || 'Pending'}
              </span>
            </div>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 flex items-center gap-1">
              <Calendar size={13} />
              Placed on {orderDate}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-accent-brand font-medium rounded-lg hover:opacity-90 transition-all shadow-sm text-sm cursor-pointer"
        >
          <Printer size={18} />
          Print Invoice
        </button>
      </div>

      {/* Status Update Control Box (প্রিন্টে হাইড থাকবে) */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-accent-brand" />
            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Update Status:
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 capitalize"
              disabled={updating}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || status === order.status}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-brand text-white font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              {updating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>

        {message && (
          <p className={`text-xs mt-3 font-medium flex items-center gap-1 ${
            messageType === 'success' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {messageType === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {message}
          </p>
        )}
      </div>

      {/* Outlet Update Control Box (প্রিন্টে হাইড থাকবে) */}
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-accent-brand" />
            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Fulfilling Outlet:
              {!order.outletId && (
                <span className="ml-2 text-[11px] font-normal text-rose-500">
                  (Not assigned yet — required before shipping)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 min-w-[180px]"
              disabled={updating || loadingOutlets}
            >
              <option value="">
                {loadingOutlets
                  ? 'Loading outlets...'
                  : outlets.length === 0
                  ? 'No outlet has enough stock'
                  : '-- Select Outlet --'}
              </option>
              {outlets.map((o) => (
                <option key={o.outlet_id ?? o.id} value={o.outlet_id ?? o.id}>
                  {o.outlet_name ?? o.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleOutletUpdate}
              disabled={updating || loadingOutlets || !outletId || String(outletId) === String(order.outletId || '')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-brand text-white font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              {updating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>

        {order.outletName && (
          <p className="text-xs mt-3 text-text-secondary-light dark:text-text-secondary-dark">
            Currently assigned: <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{order.outletName}</span>
          </p>
        )}

        {outletMessage && (
          <p className={`text-xs mt-3 font-medium flex items-center gap-1 ${
            outletMessageType === 'success' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {outletMessageType === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {outletMessage}
          </p>
        )}
      </div>

      {/* Printable Invoice Header (শুধু প্রিন্ট করার সময় দেখাবে) */}
      <div className="hidden print:block border-b border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <img src={logo} className="h-12 w-auto object-contain" alt="Titto Logo" />
            <p className="text-xs text-gray-500 mt-1">www.titto.com.bd | Support: +880 1831-698522</p>

            <div className="mt-4">
              <span className="text-[10px] pb-2 font-bold uppercase tracking-wider text-gray-400">INVOICE TO:</span>
              <h3 className="text-xs pb-1 pt-1 text-gray-600">
                <span className="font-extrabold">Name:</span> {customerName}
              </h3>
              <p className="text-xs pb-1 text-gray-600">
                <span className="font-extrabold">Phone:</span> {order.phone || 'N/A'}
              </p>
              <p className="text-xs pb-1 text-gray-600 max-w-xs">
                <span className="font-extrabold">Address:</span> {fullAddress}
              </p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-end">
            <div className="bg-white p-2 border border-gray-300 rounded-md shadow-sm">
              <QRCodeSVG
                value={`Invoice #${orderIdDisplay} | Customer: ${customerName} | Phone: ${order.phone || 'N/A'} | Amount: BDT ${grandTotal}`}
                size={80}
                level="M"
              />
            </div>
            <div className="text-right mt-2">
              <h2 className="text-base font-bold text-black">INVOICE #{orderIdDisplay}</h2>
              <p className="text-xs text-gray-500">
                Date: {orderDate}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase border border-gray-400 rounded">
                Status: {order.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
        
        {/* Left Section: Ordered Items */}
        <div className="lg:col-span-2 space-y-6 print:w-full">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm print:border-none print:shadow-none">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 print:hidden">
              <Package size={18} className="text-accent-brand" />
              <span>Ordered Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark uppercase text-[11px] font-semibold tracking-wider print:bg-gray-100 print:text-black print:border-y print:border-gray-300">
                  <tr>
                    <th className="px-5 py-3 print:px-2 print:py-2">Product Description</th>
                    <th className="px-5 py-3 text-center print:px-2 print:py-2">Qty</th>
                    <th className="px-5 py-3 text-right print:px-2 print:py-2">Unit Price</th>
                    <th className="px-5 py-3 text-right print:px-2 print:py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark print:divide-gray-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const itemQty = Number(item.quantity || item.qty || 1);
                      const itemPrice = parseFloat(item.price || item.product_price || 0);
                      const itemDiscountVal = parseFloat(item.discount || 0);
                      const itemDiscType = item.discount_type || item.discountType || order.discount_type || order.discountType || 'percent';

                      // Calculate unit discount
                      const unitDiscount = itemDiscType === 'percent' || itemDiscType === 'percentage'
                        ? (itemPrice * itemDiscountVal) / 100
                        : itemDiscountVal;

                      const discountedUnitPrice = Math.max(0, itemPrice - unitDiscount);
                      const itemOriginalTotal = itemPrice * itemQty;
                      const itemNetTotal = discountedUnitPrice * itemQty;

                      return (
                        <tr key={item.id || item._id || idx}>
                          <td className="px-5 py-3.5 print:px-2 print:py-2 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                            <div>
                              <p className="font-semibold text-slate-900 print:text-black">
                                {item.name || item.product_name || item.title || 'Product Item'}
                              </p>
                              {(item.color || item.size) && (
                                <span className="block text-xs text-text-secondary-light dark:text-text-secondary-dark print:text-gray-600 font-normal mt-1">
                                  {item.color && `Color: ${item.color}`} 
                                  {item.color && item.size && ' | '} 
                                  {item.size && `Size: ${item.size}`}
                                </span>
                              )}
                              {itemDiscountVal > 0 && (
                                <span className="block text-xs text-emerald-600 dark:text-emerald-400 print:text-emerald-700 font-normal mt-1">
                                  (Discount: {itemDiscType === 'flat' ? `৳${itemDiscountVal}` : `${itemDiscountVal}%`})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 print:px-2 print:py-2 text-center print:text-black">
                            {itemQty}
                          </td>
                          
                          <td className="px-5 py-3.5 print:px-2 print:py-2 text-right print:text-black">
                            {itemDiscountVal > 0 ? (
                              <div>
                                <span className="line-through text-xs text-gray-400 block font-normal">
                                  ৳{itemPrice.toLocaleString('en-BD')}
                                </span>
                                <span className="font-medium">
                                  ৳{discountedUnitPrice.toLocaleString('en-BD')}
                                </span>
                              </div>
                            ) : (
                              `৳${itemPrice.toLocaleString('en-BD')}`
                            )}
                          </td>

                          <td className="px-5 py-3.5 print:px-2 print:py-2 text-right font-semibold print:text-black">
                            {itemDiscountVal > 0 ? (
                              <div>
                                <span className="line-through text-xs text-gray-400 block font-normal">
                                  ৳{itemOriginalTotal.toLocaleString('en-BD')}
                                </span>
                                <span>৳{itemNetTotal.toLocaleString('en-BD')}</span>
                              </div>
                            ) : (
                              `৳${itemOriginalTotal.toLocaleString('en-BD')}`
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-5 py-3.5 print:px-2 print:py-2 font-medium text-text-primary-light dark:text-text-primary-dark print:text-black">
                        Standard Order Item
                      </td>
                      <td className="px-5 py-3.5 print:px-2 print:py-2 text-center print:text-black">1</td>
                      <td className="px-5 py-3.5 print:px-2 print:py-2 text-right print:text-black">
                        ৳{subtotal.toLocaleString('en-BD')}
                      </td>
                      <td className="px-5 py-3.5 print:px-2 print:py-2 text-right font-semibold print:text-black">
                        ৳{subtotal.toLocaleString('en-BD')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Price Summary Breakdown */}
            <div className="p-5 bg-background-light/50 dark:bg-background-dark/50 border-t border-border-light dark:border-border-dark space-y-2 text-sm print:bg-transparent print:p-0 print:pt-4 print:border-t print:border-gray-300">
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Subtotal:</span>
                <span>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark print:text-gray-700">
                <span>Delivery Charge:</span>
                <span>৳{deliveryCharge.toLocaleString('en-BD')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-text-primary-light dark:text-text-primary-dark print:text-black pt-2 border-t border-border-light dark:border-border-dark print:border-gray-300">
                <span>Grand Total:</span>
                <span className="text-accent-brand print:text-black">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Details Box */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:border-none print:shadow-none print:p-0 print:hidden">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
              <User size={18} className="text-accent-brand" />
              Customer Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Name</p>
                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {customerName}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Phone</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-accent-brand" />
                  {order.phone || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Shipping Address</p>
                <p className="font-medium text-text-primary-light dark:text-text-primary-dark flex items-start gap-1.5 mt-0.5">
                  <MapPin size={16} className="text-accent-brand shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Details Box */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 space-y-4 shadow-sm print:bg-transparent print:border-t print:border-gray-200 print:rounded-none print:shadow-none print:px-0 print:py-4">
            <h3 className="pl-3 font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 print:border-none print:pb-0">
              <CreditCard size={18} className="text-accent-brand print:hidden" />
              Payment Information
            </h3>

            <div className="pl-3 space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark print:text-gray-500">
                  Payment Method
                </p>
                <p className="font-semibold capitalize text-text-primary-light dark:text-text-primary-dark print:text-black">
                  {order.payment_method || order.paymentMethod || 'Cash on Delivery (COD)'}
                </p>
              </div>

              {order.note && (
                <div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark print:text-gray-500">
                    Order Note
                  </p>
                  <p className="text-xs bg-background-light dark:bg-background-dark p-2.5 rounded-lg border border-border-light dark:border-border-dark mt-1 italic text-text-primary-light dark:text-text-primary-dark print:bg-gray-50 print:border-gray-200 print:text-black">
                    "{order.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Footer Signatures (শুধু প্রিন্টে শো করবে) */}
      <div className="hidden print:flex justify-between items-end mt-16 pt-8 border-t border-dashed border-gray-400 text-xs text-gray-600">
        <div>
          <p className="font-semibold text-black">Customer Signature</p>
          <p className="text-[10px] text-gray-400 mt-1">Received in good condition</p>
        </div>
        <div className="text-right">
          <div className="border-b border-gray-400 w-44 ml-auto mb-1"></div>
          <p className="font-semibold text-black">Authorized Authority</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Send In Good Condition</p>
        </div>
      </div>
    </div>
  );
}