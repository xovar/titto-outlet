import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart } from "lucide-react";

export default function ProductCard({ product = {}, addToCart }) {
  const itemId = product.id || product._id;
  const title = product.name || "Product Name";
  const categoryName = typeof product.category === "object" ? product.category?.name : product.category || "General";

  // ১. ইউনিক কালার লিস্ট বের করা
  const colorsList = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants
        .map((v) => v.color)
        .filter((c) => c && c.name)
        .filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
    }
    return [];
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    if (colorsList.length > 0) {
      setSelectedColor(colorsList[0].name);
    }
  }, [colorsList]);

  // ২. নির্বাচিত কালারের একটিভ ভ্যারিয়েন্ট
  const activeVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.color?.name === selectedColor) ||
      product.variants[0]
    );
  }, [product.variants, selectedColor]);

  // ৩. নির্বাচিত ভ্যারিয়েন্টের সাইজ লিস্ট বের করা
   const sizesList = useMemo(() => {
    const rawSizes = activeVariant?.sizes || [];

    const merged = {};
    rawSizes.forEach((s) => {
      if (!s.size) return;
      if (!merged[s.size]) {
        merged[s.size] = { ...s, stock: Number(s.stock) || 0 };
      } else {
        // একই সাইজ একাধিকবার থাকলে stock যোগ করে দেওয়া হচ্ছে
        merged[s.size].stock += Number(s.stock) || 0;
      }
    });

    return Object.values(merged);
  }, [activeVariant]);

  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (sizesList.length > 0) {
      setSelectedSize(sizesList[0].size);
    } else {
      setSelectedSize("");
    }
  }, [sizesList]);

  // ৪. ডায়নামিক ইমেজ এক্সট্রাকশন
  const image = useMemo(() => {
    if (activeVariant?.images && activeVariant.images.length > 0) {
      return activeVariant.images[0];
    }
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === "string" ? product.images[0] : product.images[0].url;
    }
    return product.image || "https://via.placeholder.com/300?text=No+Image";
  }, [activeVariant, product]);

  // ৫. প্রাইস ও ডিসকাউন্ট হিসাব
  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;

  // কার্ট হ্যান্ডলার
  const handleAddToCart = (e, customSize = null) => {
    e.stopPropagation();

    const targetSize = customSize || selectedSize;

    if (!selectedColor && colorsList.length > 0) {
      alert("Please select a color!");
      return;
    }
    if (!targetSize && sizesList.length > 0) {
      alert("Please select a size!");
      return;
    }

    const sizeObj = sizesList.find((s) => s.size === targetSize);
    const stock = sizeObj ? Number(sizeObj.stock) : 0;

    if (sizesList.length > 0 && stock <= 0) {
      alert("Selected size is out of stock!");
      return;
    }

    if (addToCart) {
      addToCart({
        id: `${itemId}_${activeVariant?.id || "var"}_${sizeObj?.id || targetSize}`,
        productId: itemId,
        name: `${title} (${selectedColor} - Size: ${targetSize})`,
        price: finalPrice,
        stock: stock,
        image: image,
        sku: sizeObj?.sku || "",
      });
    }
  };

  return (
    <div className="group w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col p-3 justify-between">
      <div>
        {/* Image Section (Clean Screenshot Style) */}
        <div className="relative w-full h-44 bg-white dark:bg-gray-900 rounded-lg overflow-hidden mb-3 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
          {discount > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          )}

          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/300?text=No+Image";
            }}
          />
        </div>

        {/* Category & Title */}
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-0.5">
          {categoryName}
        </p>
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate mb-2.5" title={title}>
          {title}
        </h3>

        {/* 1. COLOR SELECTION SECTION */}
        {colorsList.length > 0 && (
          <div className="mb-2.5">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Color: <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedColor}</span>
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {colorsList.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    style={{ backgroundColor: c.code }}
                    className={`w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm transition-all ${
                      isSelected ? "ring-2 ring-indigo-600 ring-offset-1 scale-110 z-10" : "opacity-60 hover:opacity-100"
                    }`}
                    title={c.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SIZE SELECTION SECTION */}
        {sizesList.length > 0 && (
          <div className="mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Size:
            </span>
            <div className="flex gap-1 flex-wrap">
              {sizesList.map((s) => {
                const isOutOfStock = Number(s.stock) <= 0;
                const isSelected = selectedSize === s.size;

                return (
                  <button
                    key={s.id || s.size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      setSelectedSize(s.size);
                    }}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                      isOutOfStock
                        ? "bg-gray-100 dark:bg-gray-700/50 text-gray-300 dark:text-gray-500 border-gray-200 dark:border-gray-700 line-through cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PRICE & ADD BUTTON */}
      <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            ৳{finalPrice.toFixed(0)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through ml-1.5 font-medium">
              ৳{price.toFixed(0)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => handleAddToCart(e)}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <ShoppingCart size={13} /> Add
        </button>
      </div>
    </div>
  );
}