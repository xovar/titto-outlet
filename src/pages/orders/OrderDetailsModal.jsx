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
  Printer,
} from 'lucide-react';

export default function OrderDetailsModal({ isOpen, onClose, order, onUpdateStatus }) {
  const [skus, setSkus] = useState({});
  const [loading, setLoading] = useState(false);

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

  const isAlreadyDelivered = order.status?.toLowerCase() === 'delivered';

  const handleSkuChange = (itemId, value) => {
    setSkus((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // ইনভয়েস প্রিন্ট করার জন্য হেলপার ফাংশন (ছবি অনুযায়ী হুবহু ডিজাইন)
  const printInvoice = (updatedOrder, updatedSkus) => {
    const orderId = updatedOrder.id || updatedOrder._id || updatedOrder.order_id;
    const firstName = updatedOrder.firstName || updatedOrder.first_name || '';
    const lastName = updatedOrder.lastName || updatedOrder.last_name || '';
    const deliveryCharge = parseFloat(updatedOrder.deliveryCharge ?? updatedOrder.delivery_charge ?? 0);

    const computedSubtotal =
      updatedOrder.items && updatedOrder.items.length > 0
        ? updatedOrder.items.reduce(
            (acc, item) => acc + parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1),
            0
          )
        : parseFloat(updatedOrder.price || 0);

    const discountAmount = (() => {
      if (updatedOrder.items && updatedOrder.items.length > 0) {
        return updatedOrder.items.reduce((acc, item) => {
          const itemPrice = parseFloat(item.price || 0);
          const itemQty = parseFloat(item.quantity || item.qty || 1);
          const itemDiscVal = parseFloat(item.discount || 0);
          const type =
            item.discount_type || item.discountType || updatedOrder.discount_type || updatedOrder.discountType || 'percent';

          if (type === 'percent' || type === 'percentage') {
            return acc + ((itemPrice * itemDiscVal) / 100) * itemQty;
          }
          return acc + itemDiscVal * itemQty;
        }, 0);
      }
      const orderDiscVal = parseFloat(updatedOrder.discount || 0);
      const type = updatedOrder.discount_type || updatedOrder.discountType || 'percent';
      if (type === 'percent' || type === 'percentage') {
        return (computedSubtotal * orderDiscVal) / 100;
      }
      return orderDiscVal;
    })();

    const totalPrice = Math.max(0, computedSubtotal + deliveryCharge - discountAmount);
    const orderDate = updatedOrder.createdAt || updatedOrder.created_at
      ? new Date(updatedOrder.createdAt || updatedOrder.created_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('en-GB');

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(orderId)}`;

    const itemsHtml = (updatedOrder.items || [])
      .map((item, index) => {
        const itemId = item.id || item._id || index;
        const itemSku = updatedSkus[itemId] || item.sku || '';
        const itemTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || item.qty || 1);
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 0;">
              <strong style="font-size: 14px; color: #0f172a;">${item.name || item.product_name || `Product #${item.product_id || item.productId}`}</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                ${item.color ? `Color: ${item.color}` : ''} ${item.size ? `| Size: ${item.size}` : ''} ${itemSku ? `| SKU: ${itemSku}` : ''}
              </div>
            </td>
            <td style="text-align: center; padding: 12px 0; font-size: 13px;">${item.quantity || item.qty || 1}</td>
            <td style="text-align: right; padding: 12px 0; font-size: 13px;">৳${parseFloat(item.price || 0).toLocaleString('en-BD')}</td>
            <td style="text-align: right; padding: 12px 0; font-size: 13px; font-weight: bold;">৳${itemTotal.toLocaleString('en-BD')}</td>
          </tr>
        `;
      })
      .join('');

    const invoiceWindow = window.open('', '_blank', 'width=800,height=900');
    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
            .invoice-box { max-width: 650px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
            .logo { font-size: 32px; font-weight: 900; color: #e11d48; font-style: italic; }
            .logo-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .qr-code { width: 85px; height: 85px; border: 1px solid #e2e8f0; padding: 4px; border-radius: 6px; }
            .details-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 25px; }
            .customer-info line { margin-bottom: 3px; }
            .invoice-title-block { text-align: right; }
            .status-badge { display: inline-block; font-size: 10px; font-weight: bold; border: 1px solid #000; padding: 2px 6px; margin-top: 6px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; }
            th.right { text-align: right; }
            th.center { text-align: center; }
            .summary { float: right; width: 220px; font-size: 13px; margin-bottom: 30px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-top: 4px; }
            .payment-info { clear: both; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 60px; font-size: 12px; }
            .footer-signatures { display: flex; justify-content: space-between; font-size: 11px; color: #475569; border-top: 1px dashed #cbd5e1; pt: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">Titto</div>
                <div class="logo-sub">www.titto.com.bd | Support: +880 1831-698522</div>
              </div>
              <img src="${qrCodeUrl}" class="qr-code" alt="QR" />
            </div>

            <div class="details-bar">
              <div class="customer-info">
                <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">INVOICE TO:</div>
                <div style="margin-top: 4px;"><strong>Name:</strong> ${firstName} ${lastName}</div>
                <div><strong>Phone:</strong> ${updatedOrder.phone || 'N/A'}</div>
                <div><strong>Address:</strong> ${updatedOrder.address || updatedOrder.shipping_address || 'N/A'}</div>
              </div>
              <div class="invoice-title-block">
                <div style="font-size: 16px; font-weight: bold;">INVOICE #${orderId}</div>
                <div style="color: #64748b; margin-top: 4px;">Date: ${orderDate}</div>
                <div class="status-badge">STATUS: DELIVERED</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>PRODUCT DESCRIPTION</th>
                  <th class="center">QTY</th>
                  <th class="right">UNIT PRICE</th>
                  <th class="right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>৳${computedSubtotal.toLocaleString('en-BD')}</span>
              </div>
              ${
                discountAmount > 0
                  ? `<div class="summary-row" style="color: #059669;">
                      <span>Discount:</span>
                      <span>-৳${discountAmount.toLocaleString('en-BD')}</span>
                    </div>`
                  : ''
              }
              <div class="summary-row">
                <span>Delivery Charge:</span>
                <span>৳${deliveryCharge.toLocaleString('en-BD')}</span>
              </div>
              <div class="summary-row grand-total">
                <span>Grand Total:</span>
                <span>৳${totalPrice.toLocaleString('en-BD')}</span>
              </div>
            </div>

            <div class="payment-info">
              <strong style="font-size: 13px;">Payment Information</strong>
              <div style="margin-top: 6px; color: #64748b;">Payment Method</div>
              <div><strong>Cash On Delivery (COD)</strong></div>
            </div>

            <div class="footer-signatures">
              <div>
                <div style="border-top: 1px solid #cbd5e1; width: 140px; margin-bottom: 4px;"></div>
                <strong>Customer Signature</strong>
                <div style="font-size: 9px; color: #94a3b8;">Received in good condition</div>
              </div>
              <div style="text-align: right;">
                <div style="border-top: 1px solid #cbd5e1; width: 140px; margin-bottom: 4px; margin-left: auto;"></div>
                <strong>Authorized Authority</strong>
                <div style="font-size: 9px; color: #94a3b8;">Send In Good Condition</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  const handleMarkAsDelivered = async () => {
    if (isAlreadyDelivered) return;

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

      if (onUpdateStatus) {
        await onUpdateStatus(payload);
      }

      // আপডেট সাকসেসফুল হলে সরাসরি ইনভয়েস জেনারেট করে প্রিন্ট দেওয়া হবে
      printInvoice(order, skus);

      onClose();
    } catch (error) {
      console.error('Failed to update order status and SKU:', error);
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

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

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                          <Barcode size={13} /> SKU:
                        </span>
                        <input
                          type="text"
                          placeholder="Enter SKU..."
                          disabled={isAlreadyDelivered}
                          value={skus[itemId] || ''}
                          onChange={(e) => handleSkuChange(itemId, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {isAlreadyDelivered && (
              <button
                onClick={() => printInvoice(order, skus)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Printer size={14} /> Re-print Invoice
              </button>
            )}
          </div>

          <button
            onClick={handleMarkAsDelivered}
            disabled={loading || isAlreadyDelivered}
            className={`px-5 py-2 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isAlreadyDelivered
                ? 'bg-slate-500'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Updating...
              </>
            ) : isAlreadyDelivered ? (
              <>
                <CheckCircle2 size={14} />
                Already Delivered
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
  );``
}