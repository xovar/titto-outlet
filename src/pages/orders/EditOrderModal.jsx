import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrder } from '../../store/slices/orderSlice';
import { X, Save, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function EditOrderModal({ isOpen, onClose, order }) {
  const dispatch = useDispatch();
  const { updating, error } = useSelector((state) => state.orders || {});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    status: 'pending',
    deliveryCharge: 0,
    note: '',
    items: [],
  });

  // 1️⃣ Sync local state when order changes or modal opens
  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        firstName: order.firstName || order.first_name || '',
        lastName: order.lastName || order.last_name || '',
        phone: order.phone || '',
        address: order.address || order.shipping_address || '',
        cityDistrict: order.cityDistrict || order.city_district || order.district || '',
        status: order.status || 'pending',
        deliveryCharge: parseFloat(order.deliveryCharge ?? order.delivery_charge ?? 0),
        note: order.note || '',
        items: Array.isArray(order.items) && order.items.length > 0
          ? order.items.map((item) => ({
              id: item.id || null,
              productId: item.productId || item.product_id || item.id || `manual_${Date.now()}`,
              variantId: item.variantId || item.variant_id || null,
              name: item.name || item.product_name || item.title || '',
              category: item.category || null,
              color: item.color || null,
              size: item.size || null,
              price: parseFloat(item.price || 0),
              quantity: parseInt(item.quantity || item.qty || 1, 10),
              discount: parseFloat(item.discount || 0),
              discountType: item.discount_type || item.discountType || 'percent',
              image: item.image || null,
            }))
          : [],
      });
    }
  }, [order, isOpen]);

  // 2️⃣ Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  // ✏️ General Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'deliveryCharge' ? (value === '' ? '' : Math.max(0, parseFloat(value) || 0)) : value,
    }));
  };

  // ✏️ Order Item Field Change (Immutable State Update)
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          let updatedValue = value;
          if (field === 'price' || field === 'quantity' || field === 'discount') {
            updatedValue = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
          }
          return { ...item, [field]: updatedValue };
        }
        return item;
      }),
    }));
  };

  // ➕ Add New Empty Item Row
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: `manual_${Date.now()}`,
          variantId: null,
          name: '',
          price: 0,
          quantity: 1,
          discount: 0,
          discountType: 'percent',
          color: null,
          size: null,
        },
      ],
    }));
  };

  // 🗑️ Remove Item Row
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('An order must contain at least one item!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // 🧮 Dynamic Price Calculations (OrderList Logics)
  const calculatedSubtotal = formData.items.reduce((acc, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return acc + price * qty;
  }, 0);

  const calculatedDiscount = formData.items.reduce((acc, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQty = parseFloat(item.quantity) || 0;
    const itemDiscVal = parseFloat(item.discount) || 0;
    const type = item.discountType || 'percent';

    if (type === 'percent' || type === 'percentage') {
      return acc + ((itemPrice * itemDiscVal) / 100) * itemQty;
    }
    return acc + itemDiscVal * itemQty;
  }, 0);

  const deliveryChargeVal = parseFloat(formData.deliveryCharge) || 0;
  const grandTotal = Math.max(0, calculatedSubtotal + deliveryChargeVal - calculatedDiscount);

  // 💾 Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: order.id || order._id,
      ...formData,
      deliveryCharge: deliveryChargeVal,
      price: calculatedSubtotal,
      total_amount: grandTotal,
    };

    const resultAction = await dispatch(updateOrder(payload));
    if (updateOrder.fulfilled.match(resultAction) || resultAction.meta?.requestStatus === 'fulfilled') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-187.5 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* FIXED HEADER */}
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-background-light/50 dark:bg-background-dark/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              Edit Order <span className="font-mono text-accent-brand">#{order.id || order._id}</span>
            </h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Update order details and items list
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM & SCROLLABLE CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          
          <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">City / District</label>
                  <input
                    type="text"
                    name="cityDistrict"
                    value={formData.cityDistrict}
                    onChange={handleInputChange}
                    placeholder="e.g. Dhaka, Chittagong"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Order Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm capitalize focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Delivery Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent-brand hover:underline"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              <div className="border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark font-semibold border-b border-border-light dark:border-border-dark">
                    <tr>
                      <th className="p-3">Product Title</th>
                      <th className="p-3 text-center w-20">Qty</th>
                      <th className="p-3 text-right w-24">Price (৳)</th>
                      <th className="p-3 text-right w-24">Disc (%)</th>
                      <th className="p-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {formData.items.map((item, idx) => (
                      <tr key={item.productId || idx} className="bg-surface-light dark:bg-surface-dark">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="Product Name"
                            required
                            className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-16 text-center px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-medium text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-20 text-right px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                            className="w-20 text-right px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Note */}
            <div>
              <label className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">Order Note (Optional)</label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="e.g. Special instructions for delivery..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50 transition-all"
              />
            </div>

            {/* Price Summary */}
            <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl space-y-2 text-sm border border-border-light dark:border-border-dark">
              <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                <span>Subtotal:</span>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                  ৳{calculatedSubtotal.toLocaleString('en-BD')}
                </span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-medium">
                    -৳{calculatedDiscount.toLocaleString('en-BD')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-text-secondary-light dark:text-text-secondary-dark">
                <span>Delivery Charge:</span>
                <div className="flex items-center gap-1">
                  <span>৳</span>
                  <input
                    type="number"
                    min="0"
                    name="deliveryCharge"
                    value={formData.deliveryCharge}
                    onChange={handleInputChange}
                    className="w-24 text-right px-2 py-1 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark font-medium text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-1 focus:ring-accent-brand"
                  />
                </div>
              </div>

              <div className="flex justify-between font-bold text-base pt-2 border-t border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark">
                <span>Grand Total:</span>
                <span className="text-accent-brand">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>

          </div>

          {/* FIXED FOOTER */}
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-xs font-medium hover:bg-background-light dark:hover:bg-background-dark transition-all text-text-primary-light dark:text-text-primary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 px-5 py-2 bg-accent-brand hover:opacity-90 text-white font-semibold rounded-lg text-xs disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={16} /> {updating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}