import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function CartItem({ item, updateQty, removeFromCart }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{item.name}</h4>
        <p className="text-xs text-gray-500">৳{item.price} each</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQty(item.id, -1)}
          className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
        <button
          onClick={() => updateQty(item.id, 1)}
          className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="text-right">
        <p className="font-bold text-sm">৳{Number(item.price) * item.qty}</p>
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}