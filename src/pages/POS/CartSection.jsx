import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ShoppingCart,
  RotateCcw,
  UserPlus,
  Tag,
  Banknote,
  CreditCard,
  QrCode,
  Printer,
  X,
  Phone,
  User,
  Search,
  CheckCircle2,
  Loader2,
  Store,
  Calendar,
  PackageOpen,
} from "lucide-react";
import CartItem from "./CartItem";
import {
  searchCustomerByPhone,
  createCustomer,
  clearSearchResult,
} from "../../store/slices/Customerslice.JS"; // পাথটা তোমার আসল ফোল্ডার স্ট্রাকচার অনুযায়ী মিলিয়ে নিও

// অর্ডার স্ট্যাটাস অনুযায়ী badge রঙ
const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function CartSection({
  cart,
  customer,
  setCustomer,
  clearCart,
  updateQty,
  removeFromCart,
  discountPercent,
  setDiscountPercent,
  taxPercent,
  setTaxPercent,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  handlePrintReceipt,
}) {
  const dispatch = useDispatch();

  // 🔗 dummy local customers state সরিয়ে redux store থেকে নেওয়া হচ্ছে।
  // searchResult: { found: null|true|false, customer: { ...profile, orders: [...] } }
  const { searchResult, searching, creating, error } = useSelector(
    (state) => state.customers
  );

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [newName, setNewName] = useState("");

  const resetModal = () => {
    setPhoneInput("");
    setPhoneError("");
    setNewName("");
    setShowAddCustomer(false);
    dispatch(clearSearchResult());
  };

  const handleSearch = () => {
    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (!/^(01)[0-9]{9}$/.test(cleanPhone)) {
      setPhoneError("সঠিক ১১ ডিজিটের নাম্বার দিন (01XXXXXXXXX)");
      return;
    }
    setPhoneError("");

    // 🔗 backend এখন customer profile-এর সাথে orders[] (প্রতিটার items +
    // outlet সহ) রিটার্ন করে — searchResult.customer.orders
    dispatch(searchCustomerByPhone(cleanPhone));
  };

  const handleSelectExisting = () => {
    if (!searchResult.customer) return;
    const { name, phone } = searchResult.customer;
    setCustomer(`${name} (+88${phone})`);
    resetModal();
  };

  const handleAddNew = () => {
    if (!newName.trim()) {
      setPhoneError("নাম দিতে হবে");
      return;
    }
    const cleanPhone = phoneInput.replace(/\D/g, "");

    dispatch(createCustomer({ name: newName.trim(), phone: cleanPhone }))
      .unwrap()
      .then((data) => {
        const { name, phone } = data.customer;
        setCustomer(`${name} (+88${phone})`);
        resetModal();
      })
      .catch(() => {
        // error state ইতিমধ্যে redux এ সেট হয়ে গেছে, নিচে দেখানো হচ্ছে
      });
  };

  const foundCustomer = searchResult.customer;
  const orders = foundCustomer?.orders || [];
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0) + (o.deliveryCharge || 0), 0);

  return (
    <div className="w-full lg:w-105 bg-white dark:bg-gray-800 flex flex-col h-full border-l border-gray-200 dark:border-gray-700 shadow-xl relative">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium focus:outline-none"
          >
            <option value="Walk-in Customer">Walk-in Customer</option>
            {/* dropdown এর জন্য fetchCustomers() parent থেকে dispatch করে
                state.customers.items ম্যাপ করো, আগের নোট অনুযায়ী */}
          </select>
          <button
            title="Add Customer"
            onClick={() => setShowAddCustomer(true)}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <UserPlus size={18} />
          </button>
        </div>

        <div className="flex justify-between items-center text-sm font-medium">
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <ShoppingCart size={18} /> Cart Items ({cart.reduce((a, b) => a + b.qty, 0)})
          </span>
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-semibold"
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingCart size={48} className="mb-2 stroke-1" />
            <p className="text-sm">No items in the cart</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>৳{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Tag size={14} /> Discount (%)
          </span>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPercent}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDiscountPercent(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
            }}
            className="w-16 px-2 py-0.5 text-right border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none"
          />
        </div>

        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Tag size={14} /> Tax (%)
          </span>
          <input
            type="number"
            min="0"
            max="100"
            value={taxPercent}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setTaxPercent(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
            }}
            className="w-16 px-2 py-0.5 text-right border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none"
          />
        </div>

        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Tax Amount</span>
          <span>৳{taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-base font-bold">
          <span>Total Payable</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            ৳{grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { id: "cash", label: "Cash", icon: Banknote },
            { id: "card", label: "Card", icon: CreditCard },
            { id: "bkash", label: "Mobile Pay", icon: QrCode },
          ].map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  paymentMethod === method.id
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={14} />
                {method.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handlePrintReceipt}
            className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={() => {
              if (cart.length === 0) return alert("Cart is empty!");
              alert("Order placed successfully!");
              clearCart();
            }}
            className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Pay ৳{grandTotal.toFixed(0)}
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full p-5 relative flex flex-col ${
              searchResult.found === true
                ? "max-w-2xl max-h-[85vh]"
                : "max-w-sm"
            }`}
          >
            <button
              onClick={resetModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 flex-shrink-0">
              <UserPlus size={20} className="text-indigo-600" /> কাস্টমার খুঁজুন
            </h3>

            {/* ফোন নাম্বার সার্চ ফিল্ড */}
            <div className="space-y-1 flex-shrink-0">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Phone size={14} /> ফোন নাম্বার
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneError("");
                    dispatch(clearSearchResult());
                  }}
                  placeholder="01XXXXXXXXX"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1 text-sm font-medium"
                >
                  {searching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  খুঁজুন
                </button>
              </div>
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {/* কাস্টমার পাওয়া গেছে — প্রোফাইল + পুরো purchase history */}
            {searchResult.found === true && foundCustomer && (
              <div className="mt-4 flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                {/* প্রোফাইল সামারি */}
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                      <CheckCircle2 size={16} /> কাস্টমার পাওয়া গেছে
                    </div>
                    <button
                      onClick={handleSelectExisting}
                      className="py-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                    >
                      সিলেক্ট করো
                    </button>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mt-2">
                    {foundCustomer.name} — +88{foundCustomer.phone}
                  </p>
                  {foundCustomer.address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {foundCustomer.address}
                      {foundCustomer.cityDistrict ? `, ${foundCustomer.cityDistrict}` : ""}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                    <span>
                      মোট অর্ডার: <strong>{totalOrders}</strong>
                    </span>
                    <span>
                      মোট খরচ: <strong>৳{totalSpent.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                {/* Order history */}
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <PackageOpen size={14} /> আগের অর্ডার ({totalOrders})
                  </h4>

                  {totalOrders === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                      এই কাস্টমারের আগে কোনো অর্ডার নেই।
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                          {/* Order header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/40 text-xs">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-gray-500 dark:text-gray-400">
                                #{order.id}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Calendar size={12} /> {formatDate(order.createdAt)}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Store size={12} /> {order.outletName || "আউটলেট নির্ধারিত হয়নি"}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium capitalize ${
                                STATUS_STYLES[order.status] || STATUS_STYLES.pending
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          {/* Items */}
                          <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                                <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name || "product"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <PackageOpen size={16} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                    {item.name || "Unknown Product"}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {[item.color, item.size].filter(Boolean).join(" • ")}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    ×{item.quantity}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    ৳{item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order footer */}
                          <div className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-gray-900/40 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            <span>ডেলিভারি চার্জ: ৳{order.deliveryCharge.toFixed(2)}</span>
                            <span>মোট: ৳{(order.price + order.deliveryCharge).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* কাস্টমার পাওয়া যায়নি — নতুন কাস্টমার ফর্ম */}
            {searchResult.found === false && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  এই নাম্বারে কোনো কাস্টমার নেই। নতুন হিসেবে যোগ করুন।
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <User size={14} /> নাম
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="কাস্টমারের নাম"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleAddNew}
                  disabled={creating}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  নতুন কাস্টমার যোগ করো
                </button>
              </div>
            )}

            <button
              onClick={resetModal}
              className="mt-4 w-full py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}
    </div>
  );
}