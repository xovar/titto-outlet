import React from "react";
import { ShoppingCart, RotateCcw, UserPlus, Tag, Banknote, CreditCard, QrCode, Printer } from "lucide-react";
import CartItem from "./CartItem";

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
  return (
    <div className="w-full lg:w-105 bg-white dark:bg-gray-800 flex flex-col h-full border-l border-gray-200 dark:border-gray-700 shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium focus:outline-none"
          >
            <option value="Walk-in Customer">Walk-in Customer</option>
            <option value="Rahim Uddin">Rahim Uddin (+8801700000000)</option>
            <option value="Karim Chowdhury">Karim Chowdhury (+8801800000000)</option>
          </select>
          <button
            title="Add Customer"
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
    </div>
  );
}