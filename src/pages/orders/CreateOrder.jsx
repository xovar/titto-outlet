import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../store/slices/productSlice';
import axiosInstance from '../../api/axiosInstance';
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  MapPin,
  Package,
  ShoppingCart,
  Send,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
} from 'lucide-react';

// 🔍 1. Searchable Product Select Component (Custom Combobox)
const SearchableProductSelect = ({
  products = [],
  selectedProductId,
  onSelect,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // সিলেক্ট করা প্রোডাক্ট খুঁজে বের করা
  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id || p._id) === String(selectedProductId)),
    [products, selectedProductId]
  );

  // Dropdown এর বাইরে ক্লিক করলে বন্ধ করার ফিল্টার
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Name, Brand, ID দিয়ে প্রোডাক্ট ফিল্টার করার লজিক
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase();
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const idMatch = String(p.id || p._id || '').toLowerCase().includes(q);
      const brandMatch = p.brand?.name?.toLowerCase().includes(q);
      return nameMatch || idMatch || brandMatch;
    });
  }, [products, searchTerm]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={
            loading ? 'Loading products...' : 'Search by Name, Brand, or ID...'
          }
          value={
            isOpen
              ? searchTerm
              : selectedProduct
              ? `${selectedProduct.name} ${
                  selectedProduct.brand?.name ? `(${selectedProduct.brand.name})` : ''
                } - ৳${selectedProduct.price}`
              : searchTerm
          }
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(''); // ফোকাস করলে সার্চ ক্লিয়ার করে দেবে যাতে নতুন করে সার্চ করা যায়
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          className="w-full px-3 py-2 pr-9 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-brand/50 placeholder:text-text-secondary-light/60"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none">
          {isOpen ? <Search size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* 🔽 Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-xl">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
              No product found
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const isSelected = String(prod.id || prod._id) === String(selectedProductId);
              return (
                <div
                  key={prod.id || prod._id}
                  onClick={() => {
                    onSelect(prod.id || prod._id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`p-2.5 hover:bg-accent-brand/10 cursor-pointer text-xs border-b border-border-light/40 dark:border-border-dark/40 last:border-0 transition-colors ${
                    isSelected
                      ? 'bg-accent-brand/15 font-semibold text-accent-brand'
                      : 'text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold truncate">{prod.name}</span>
                    <span className="font-bold text-accent-brand shrink-0">৳{prod.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    <span>Brand: {prod.brand?.name || 'N/A'}</span>
                    <span className="font-mono bg-background-light dark:bg-background-dark px-1.5 py-0.5 rounded">
                      ID: {prod.id || prod._id}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};


// 🛍️ 2. Main CreateOrder Component
export default function CreateOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux Store
  const {
    items: availableProducts = [],
    loading: productLoading,
    error: productError,
  } = useSelector((state) => state.products || {});

  // Shipping Details State
  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    postalCode: '',
  });

  // Billing Details State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    postalCode: '',
  });

  // Pricing & Delivery State
  const [deliveryCharge, setDeliveryCharge] = useState(60);

  // Order Items Array
  const [items, setItems] = useState([
    {
      productId: '',
      variantId: '',
      name: '',
      category: '',
      color: '',
      size: '',
      price: 0,
      quantity: 1,
      discount: 0,
      image: '',
      maxStock: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Products
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        variantId: '',
        name: '',
        category: '',
        color: '',
        size: '',
        price: 0,
        quantity: 1,
        discount: 0,
        image: '',
        maxStock: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      alert('Order must contain at least one product item!');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 📦 1. Product Select Handler
  const handleSelectProduct = (index, selectedProductId) => {
    const selectedProd = availableProducts?.find(
      (p) => String(p.id || p._id) === String(selectedProductId)
    );

    if (!selectedProd) return;

    const firstVariant = selectedProd.variants?.[0];
    const firstSize = firstVariant?.sizes?.[0];

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: selectedProd.id || selectedProd._id,
        variantId: firstVariant?.id || '',
        name: selectedProd.name || '',
        category: selectedProd.category?.name || '',
        price: parseFloat(selectedProd.price || 0),
        discount: parseFloat(selectedProd.discount || 0),
        color: firstVariant?.color?.name || '',
        image: firstVariant?.images?.[0] || '',
        size: firstSize?.size || '',
        maxStock: firstSize?.stock || 0,
        quantity: 1,
      };
      return updated;
    });
  };

  // 🎨 2. Variant (Color) Select Handler
  const handleSelectVariant = (index, selectedVariantId) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const prod = availableProducts?.find(
        (p) => String(p.id || p._id) === String(item.productId)
      );

      const variant = prod?.variants?.find(
        (v) => String(v.id) === String(selectedVariantId)
      );

      if (!variant) return prev;

      const firstSize = variant.sizes?.[0];

      updated[index] = {
        ...item,
        variantId: variant.id,
        color: variant.color?.name || '',
        image: variant.images?.[0] || item.image,
        size: firstSize?.size || '',
        maxStock: firstSize?.stock || 0,
        quantity: 1,
      };
      return updated;
    });
  };

  // 📐 3. Size Select Handler
  const handleSelectSize = (index, selectedSizeId) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const prod = availableProducts?.find(
        (p) => String(p.id || p._id) === String(item.productId)
      );
      const variant = prod?.variants?.find(
        (v) => String(v.id) === String(item.variantId)
      );
      const sizeObj = variant?.sizes?.find(
        (s) => String(s.id) === String(selectedSizeId)
      );

      if (!sizeObj) return prev;

      updated[index] = {
        ...item,
        size: sizeObj.size,
        maxStock: sizeObj.stock || 0,
        quantity: 1,
      };
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]:
          field === 'price' || field === 'quantity' || field === 'discount'
            ? parseFloat(value) || 0
            : value,
      };
      return updated;
    });
  };

  // Pricing Calculations
  const subtotal = items.reduce(
    (acc, item) => acc + (item.price * item.quantity - (item.discount || 0)),
    0
  );
  const grandTotal = subtotal + parseFloat(deliveryCharge || 0);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!shipping.lastName || !shipping.address || !shipping.cityDistrict || !shipping.phone) {
      setFormError('Please fill in all required shipping fields (*)');
      return;
    }

    const invalidItems = items.some((item) => !item.name || item.price <= 0);
    if (invalidItems) {
      setFormError('Please select a product and ensure valid pricing for all items.');
      return;
    }

    setSubmitting(true);

    const orderPayload = {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      address: shipping.address,
      cityDistrict: shipping.cityDistrict,
      postalCode: shipping.postalCode,
      phone: shipping.phone,
      price: subtotal,
      deliveryCharge: parseFloat(deliveryCharge || 0),
      billingFirstName: sameAsShipping ? shipping.firstName : billing.firstName,
      billingLastName: sameAsShipping ? shipping.lastName : billing.lastName,
      billingAddressInput: sameAsShipping ? shipping.address : billing.address,
      billingCity: sameAsShipping ? shipping.cityDistrict : billing.cityDistrict,
      billingPostalCode: sameAsShipping ? shipping.postalCode : billing.postalCode,
      billingPhone: sameAsShipping ? shipping.phone : billing.phone,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.name,
        category: item.category || null,
        color: item.color || null,
        size: item.size || null,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity, 10),
        discount: parseFloat(item.discount || 0),
        image: item.image || null,
      })),
    };

    try {
      const response = await axiosInstance.post('/orders', orderPayload);
      const data = response.data;
      navigate(`/orders/${data.orderId || data.id || data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Create New Order
            </h1>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              Search products by Name, Brand or ID
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {(formError || (typeof productError === 'string' ? productError : productError?.message)) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{formError || productError?.message || productError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Details */}
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
              <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                <User size={18} className="text-accent-brand" />
                Shipping Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={shipping.firstName}
                    onChange={handleShippingChange}
                    placeholder="John"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={shipping.lastName}
                    onChange={handleShippingChange}
                    placeholder="Doe"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={shipping.phone}
                    onChange={handleShippingChange}
                    placeholder="01700000000"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    City / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cityDistrict"
                    required
                    value={shipping.cityDistrict}
                    onChange={handleShippingChange}
                    placeholder="Dhaka"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Full Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={shipping.address}
                    onChange={handleShippingChange}
                    placeholder="House 12, Road 5, Mirpur, Dhaka"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={shipping.postalCode}
                    onChange={handleShippingChange}
                    placeholder="1216"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border-light dark:border-border-dark">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-border-light dark:border-border-dark text-accent-brand focus:ring-accent-brand"
                  />
                  <span>Billing address is same as shipping address</span>
                </label>
              </div>
            </div>

            {/* Billing Details */}
            {!sameAsShipping && (
              <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
                <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                  <MapPin size={18} className="text-accent-brand" />
                  Billing Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={billing.firstName}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={billing.lastName}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={billing.phone}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="cityDistrict"
                      value={billing.cityDistrict}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={billing.address}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Products Selection List */}
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
                <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 text-base">
                  <Package size={18} className="text-accent-brand" />
                  Select Products
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-brand/10 text-accent-brand hover:bg-accent-brand hover:text-white transition-all"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const currentProduct = availableProducts?.find(
                    (p) => String(p.id || p._id) === String(item.productId)
                  );

                  const currentVariant = currentProduct?.variants?.find(
                    (v) => String(v.id) === String(item.variantId)
                  );

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-accent-brand">
                          Item #{index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* 🔍 1. Searchable Product Dropdown */}
                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Select Product <span className="text-rose-500">*</span>
                        </label>
                        <SearchableProductSelect
                          products={availableProducts}
                          selectedProductId={item.productId}
                          loading={productLoading}
                          onSelect={(prodId) => handleSelectProduct(index, prodId)}
                        />
                      </div>

                      {/* 2. Color Dropdown & 3. Size Dropdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Color Dropdown */}
                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Select Color
                          </label>
                          <select
                            value={item.variantId}
                            onChange={(e) => handleSelectVariant(index, e.target.value)}
                            disabled={!currentProduct?.variants?.length}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs focus:outline-none focus:ring-2 focus:ring-accent-brand/50 disabled:opacity-50"
                          >
                            <option value="">-- Select Color --</option>
                            {currentProduct?.variants?.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.color?.name || 'Default Color'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Size Dropdown */}
                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Select Size
                          </label>
                          <select
                            value={
                              currentVariant?.sizes?.find((s) => s.size === item.size)?.id || ''
                            }
                            onChange={(e) => handleSelectSize(index, e.target.value)}
                            disabled={!currentVariant?.sizes?.length}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs focus:outline-none focus:ring-2 focus:ring-accent-brand/50 disabled:opacity-50"
                          >
                            <option value="">-- Select Size --</option>
                            {currentVariant?.sizes?.map((sizeObj) => (
                              <option key={sizeObj.id} value={sizeObj.id}>
                                Size: {sizeObj.size} (Stock: {sizeObj.stock})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Details Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Price (৳)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Quantity {item.maxStock > 0 && `(Max: ${item.maxStock})`}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.maxStock || undefined}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Discount (৳)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={item.category}
                            className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark text-xs cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Summary */}
          <div className="space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm sticky top-6">
              <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                <ShoppingCart size={18} className="text-accent-brand" />
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    ৳{subtotal.toLocaleString('en-BD')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Delivery Charge (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-border-light dark:border-border-dark flex justify-between items-center text-base font-bold">
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    Grand Total:
                  </span>
                  <span className="text-accent-brand">
                    ৳{grandTotal.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-accent-brand text-white font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}