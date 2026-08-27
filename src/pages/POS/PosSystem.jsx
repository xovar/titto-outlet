import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchCategories,
} from "../../store/slices/productSlice";
import { Search, Barcode, Loader2 } from "lucide-react";
import ProductCard from "./ProductCard";
import CartSection from "./CartSection";

export default function PosSystem() {
  const dispatch = useDispatch();

  const {
    items: products = [],
    categories: reduxCategories = [],
    loading,
    error,
  } = useSelector((state) => state.products || {});

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState("");

  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        reduxCategories.length > 0
          ? reduxCategories.map((c) => (typeof c === "object" ? c.name : c))
          : products
              .map((p) =>
                typeof p.category === "object" ? p.category?.name : p.category,
              )
              .filter(Boolean),
      ),
    ),
  ];

  const addToCart = useCallback((productItem) => {
    const itemId = productItem.id;
    const stockLimit = productItem.stock ?? 0;

    if (stockLimit <= 0) {
      alert("Product is out of stock!");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === itemId);
      if (existing) {
        if (existing.qty >= stockLimit) {
          alert("Stock limit reached for this item!");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === itemId ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prevCart, { ...productItem, qty: 1 }];
    });
  }, []);

  const handleBarcodeScan = useCallback(
    (code) => {
      const cleanCode = String(code).trim().toLowerCase();
      if (!cleanCode) return;

      let matchedProduct = null;
      let matchedVariant = null;
      let matchedSize = null;

      for (const p of products) {
        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            if (v.sizes && Array.isArray(v.sizes)) {
              const size = v.sizes.find(
                (s) =>
                  String(s.sku || "")
                    .trim()
                    .toLowerCase() === cleanCode,
              );
              if (size) {
                matchedProduct = p;
                matchedVariant = v;
                matchedSize = size;
                break;
              }
            }
          }
        }
        if (
          !matchedProduct &&
          String(p.barcode || "").toLowerCase() === cleanCode
        ) {
          matchedProduct = p;
          break;
        }
        if (matchedProduct) break;
      }

      if (matchedProduct && matchedSize) {
        const cartItem = {
          id: `${matchedProduct.id}_${matchedVariant.id || "v"}_${matchedSize.id || "s"}`,
          productId: matchedProduct.id,
          name: `${matchedProduct.name} (${matchedVariant.color?.name || ""} - Size: ${matchedSize.size})`,
          price: matchedProduct.price,
          stock: matchedSize.stock,
          image: matchedVariant.images?.[0] || matchedProduct.image,
          sku: matchedSize.sku,
        };
        addToCart(cartItem);
      } else if (matchedProduct) {
        const firstVariant = matchedProduct.variants?.[0];
        const firstSize = firstVariant?.sizes?.[0];
        const totalStock =
          firstSize?.stock ??
          matchedProduct.stock ??
          matchedProduct.quantity ??
          0;

        const cartItem = {
          id: firstSize
            ? `${matchedProduct.id}_${firstVariant?.id || "v"}_${firstSize.id || "s"}`
            : matchedProduct.id,
          productId: matchedProduct.id,
          name: firstSize
            ? `${matchedProduct.name} (${firstVariant?.color?.name || ""} - Size: ${firstSize.size})`
            : matchedProduct.name,
          price: matchedProduct.price,
          stock: totalStock,
          image: firstVariant?.images?.[0] || matchedProduct.image,
          sku: firstSize?.sku || matchedProduct.sku || "",
        };
        addToCart(cartItem);
      } else {
        alert(`Product with barcode/SKU "${code}" not found!`);
      }
      setBarcodeInput("");
    },
    [products, addToCart],
  );

  useEffect(() => {
    let buffer = "";
    let timeout;

    const handleKeyDown = (e) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (buffer.length > 0) {
          handleBarcodeScan(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => (buffer = ""), 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScan]);

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              alert("Stock limit reached!");
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const removeFromCart = (id) =>
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.price || 0) * item.qty,
    0,
  );
  const discountAmount =
    (subtotal * Math.min(Math.max(discountPercent, 0), 100)) / 100;
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const filteredProducts = products.filter((p) => {
    const pCategory =
      typeof p.category === "object" ? p.category?.name : p.category;
    const matchesCategory =
      selectedCategory === "All" || pCategory === selectedCategory;

    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const directSkuMatch = String(p.sku || "")
      .toLowerCase()
      .includes(query);
    const barcodeMatch = String(p.barcode || "")
      .toLowerCase()
      .includes(query);

    const nestedSkuMatch = p.variants?.some((v) =>
      v.sizes?.some((s) =>
        String(s.sku || "")
          .toLowerCase()
          .includes(query),
      ),
    );

    return (
      matchesCategory &&
      (nameMatch || directSkuMatch || barcodeMatch || nestedSkuMatch)
    );
  });

  const handlePrintReceipt = () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const printWindow = window.open("", "_blank");
    if (!printWindow)
      return alert("Please allow pop-ups for receipt printing.");

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Receipt</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 0; padding: 5px; }
            }
            body { 
              font-family: 'Courier New', monospace, sans-serif; 
              width: 280px; 
              padding: 8px; 
              font-size: 13px; 
              font-weight: 600;
              color: #000;
              margin: 0 auto; 
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .line { border-bottom: 2px dashed #000; margin: 8px 0; }
            .bold { font-weight: 800; font-size: 14px; }
            .title { font-weight: 900; font-size: 18px; margin: 0 0 4px 0; }
            .sub-text { font-size: 11px; font-weight: 600; }
            .item-name { width: 65%; word-break: break-word; }
            .item-price { width: 35%; text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 class="title">TITTO OUTLET</h2>
            <p class="sub-text" style="margin: 0;">123 Commerce Way, Dhaka</p>
            <p class="sub-text" style="margin: 2px 0 0 0;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="line"></div>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customer}</p>
          <div class="line"></div>

          ${cart
            .map(
              (item) => `
            <div class="flex" style="margin-bottom: 4px;">
              <span class="item-name"><strong>${item.name}</strong> <small>x${item.qty}</small></span>
              <span class="item-price">৳${(Number(item.price) * item.qty).toFixed(2)}</span>
            </div>
          `,
            )
            .join("")}

          <div class="line"></div>
          <div class="flex"><span>Subtotal:</span><span>৳${subtotal.toFixed(2)}</span></div>
          <div class="flex"><span>Discount (${discountPercent}%):</span><span>-৳${discountAmount.toFixed(2)}</span></div>
          <div class="flex"><span>Tax (${taxPercent}%):</span><span>৳${taxAmount.toFixed(2)}</span></div>
          
          <div class="line"></div>
          <div class="flex bold"><span>TOTAL:</span><span>৳${grandTotal.toFixed(2)}</span></div>
          <div class="flex"><span>Payment:</span><strong>${paymentMethod.toUpperCase()}</strong></div>
          
          <div class="line"></div>
          <p class="text-center sub-text" style="margin-top: 10px;">Thank you for shopping with us!</p>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search product by Name, SKU..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (barcodeInput) handleBarcodeScan(barcodeInput);
            }}
            className="relative w-52"
          >
            <Barcode
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              ref={barcodeInputRef}
              type="text"
              autoFocus
              placeholder="Scan Barcode & Enter"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
            />
          </form>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading?.products ? (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : error?.products ? (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
            Failed to load products: {error.products}
          </div>
        ) : (
          /* এখানে items-start content-start যোগ করা হয়েছে */
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1 auto-rows-max items-start content-start">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                No products found
              </div>
            ) : (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  addToCart={addToCart}
                />
              ))
            )}
          </div>
        )}
      </div>

      <CartSection
        cart={cart}
        customer={customer}
        setCustomer={setCustomer}
        clearCart={clearCart}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        taxPercent={taxPercent}
        setTaxPercent={setTaxPercent}
        subtotal={subtotal}
        discountAmount={discountAmount}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        handlePrintReceipt={handlePrintReceipt}
      />
    </div>
  );
}
