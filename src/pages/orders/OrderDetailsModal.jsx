import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Package,
  User,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  Phone,
  Barcode,
  Loader2,
} from 'lucide-react';

export default function OrderDetailsModal({ isOpen, onClose, order, onUpdateStatus }) {
  // প্রতিটি প্রোডাক্ট আইটেমের SKU স্টেট ধরে রাখার জন্য
  const [skus, setSkus] = useState({});
  const [loading, setLoading] = useState(false);

  // মোডাল ওপেন হলে কারেন্ট SKU গুলো লোড করা
  useEffect(() => {
    if (order && order.items) {
      const initialSkus = {};
      order.items.forEach((item, index) => {
        const itemId = item.id || item._id || index;
        initialSkus[itemId] = item.sku || '';
      });
      setSkus(initialSkus);
    }
  }, [order]);

  // ESC Key এবং Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  // Input change handler for SKU
  const handleSkuChange = (itemId, value) => {
    setSkus((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // Deliver and Update SKU Handler
  const handleMarkAsDelivered = async () => {
    try {
      setLoading(true);
      
      const payload = {
        orderId: order.id || order._id || order.order_id,
        status: 'delivered',
        items: order.items.map((item, index) => {
          const itemId = item.id || item._id || index;
          return {
            id: itemId,
            product_id: item.product_id || item.productId,
            variant_id: item.variant_id || item.variantId,
            sku: skus[itemId] || '',
          };
        }),
      };

      // Parent Component / Redux Thunk Dispatch
      if (onUpdateStatus) {
        await onUpdateStatus(payload);
      } else {
        console.log('Submitted Payload:', payload);
      }

      onClose();
    } catch (error) {
      console.error('Failed to update order status and SKU:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status Badge Helper
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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
          statusClasses[key] || statusClasses.pending
        }`}
      >
        {icons[key]}
        {status || 'Pending'}
      </span>
    );
  };

  const orderId = order.id || order._id || order.order_id;
  const firstName = order.firstName || order.first_name || '';
  const lastName = order.lastName || order.last_name || '';
  const deliveryCharge = parseFloat(order.deliveryCharge ?? order.delivery_charge ?? 0);

  // Subtotal & Discount calculations
  const computedSubtotal =
    order.items && order.items.length > 0
      ? order.items.reduce(
          (acc, item) => acc + parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1),
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
          item.discount_type || item.discountType || order.discount_type || order.discountType || 'percent';

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

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background Dark Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box Container */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Order Details
              <span className="text-blue-600 font-mono text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/50">
                #{orderId}
              </span>
            </h2>
            {getStatusBadge(order.status)}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm overflow-y-auto">
          {/* Customer & Address Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                <User size={13} /> Customer Info
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {firstName} {lastName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <Phone size={12} />
                <span>{order.phone || 'No phone provided'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                <MapPin size={13} /> Shipping Address
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {order.address || order.shipping_address || 'N/A'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                <Calendar size={12} />
                <span>
                  Placed on:{' '}
                  {order.createdAt || order.created_at
                    ? new Date(order.createdAt || order.created_at).toLocaleString('en-GB')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items with SKU Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <Package size={14} /> Order Items
            </div>
            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden">
                {order.items.map((item, idx) => {
                  const itemId = item.id || item._id || idx;
                  return (
                    <div key={idx} className="p-3.5 space-y-3 bg-white dark:bg-slate-900">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">
                            {item.name || item.product_name || `Product #${item.product_id || item.productId}`}
                          </p>
                          {(item.color || item.size) && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {item.color && `Color: ${item.color}`} {item.size && `| Size: ${item.size}`}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          ৳{parseFloat(item.price || 0).toLocaleString('en-BD')} × {item.quantity || item.qty || 1}
                        </span>
                      </div>

                      {/* SKU Input Field */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                          <Barcode size={13} /> SKU:
                        </span>
                        <input
                          type="text"
                          placeholder="Enter SKU..."
                          value={skus[itemId] || ''}
                          onChange={(e) => handleSkuChange(itemId, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No detailed items available.</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                ৳{computedSubtotal.toLocaleString('en-BD')}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount</span>
                <span className="font-mono">-৳{discountAmount.toLocaleString('en-BD')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery Charge</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                ৳{deliveryCharge.toLocaleString('en-BD')}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-base">
                ৳{totalPrice.toLocaleString('en-BD')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleMarkAsDelivered}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Mark as Delivered
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}