import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  fetchCategories,
  fetchBrands,
  fetchColors,
  addProduct,
  updateProduct,
} from "../../store/slices/productSlice";
import { fetchOutlets } from "../../store/slices/outletSlice";
import axiosInstance from "../../api/axiosInstance";

export default function ProductForm() {
  const { id } = useParams(); // URL এ id থাকলে Edit Mode
  const isEditMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categories, brands, colors, loading } = useSelector(
    (state) => state.products
  );
  
  // Redux store থেকে outlets ডাটা নিয়ে আসা
  const outlets = useSelector(
    (state) => state.outlets?.items || state.outlets?.outlets || []
  );
  
  const isSubmitting = loading?.products || false;

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [gender, setGender] = useState(0);

  // Variant & UI Loading State
  const [variants, setVariants] = useState([
    {
      colorId: "",
      images: [],
      sizes: [{ size: "", stock: "", outletId: "" }],
    },
  ]);
  const [uploadingVariants, setUploadingVariants] = useState({});
  const [validationError, setValidationError] = useState("");
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // Fetch initial dropdown data
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    dispatch(fetchColors());
    dispatch(fetchOutlets());
  }, [dispatch]);

  // Edit Mode হলে পুরনো প্রোডাক্টের ডাটা লোড করে ফিল্ড পপুলেট করা
  useEffect(() => {
    if (isEditMode) {
      setFetchingProduct(true);
      axiosInstance
        .get(`/products/${id}`)
        .then((res) => {
          const product = res.data?.data || res.data;
          setName(product.name || "");
          setDescription(product.description || "");
          setPrice(product.price ? product.price.toString() : "");
          setDiscount(product.discount ? product.discount.toString() : "0");
          setCategoryId(product.category_id || product.category?.id || "");
          setBrandId(product.brand_id || product.brand?.id || "");
          setGender(product.gender !== undefined ? Number(product.gender) : 0);

          if (product.variants && product.variants.length > 0) {
            const formattedVariants = product.variants.map((v) => ({
              colorId: v.color_id || v.colorId || "",
              images: Array.isArray(v.images)
                ? v.images
                : typeof v.images === "string"
                ? JSON.parse(v.images)
                : [],
              sizes:
                v.sizes && v.sizes.length > 0
                  ? v.sizes.map((s) => ({
                      size: s.size || "",
                      stock: s.stock !== undefined ? s.stock.toString() : "",
                      outletId: s.outlet_id || s.outletId || "",
                    }))
                  : [{ size: "", stock: "", outletId: "" }],
            }));
            setVariants(formattedVariants);
          }
        })
        .catch((err) => {
          console.error("Error fetching product:", err);
          setValidationError("Failed to load product details.");
        })
        .finally(() => {
          setFetchingProduct(false);
        });
    }
  }, [id, isEditMode]);

  // Set default Category, Brand & Outlet only in ADD MODE
  useEffect(() => {
    if (!isEditMode) {
      if (categories?.length > 0 && !categoryId) {
        const firstCatId = categories[0].id || categories[0]._id;
        if (firstCatId) setCategoryId(firstCatId);
      }
      if (brands?.length > 0 && !brandId) {
        const firstBrandId = brands[0].id || brands[0]._id;
        if (firstBrandId) setBrandId(firstBrandId);
      }
    }
  }, [categories, brands, categoryId, brandId, isEditMode]);

  // Set default Color & Outlet for the initial variant in ADD MODE
  useEffect(() => {
    if (!isEditMode) {
      const defaultColorId = colors[0]?.id || colors[0]?._id;
      const defaultOutletId = outlets[0]?.outlet_id || outlets[0]?.id || outlets[0]?._id;

      if (defaultColorId || defaultOutletId) {
        setVariants((prev) =>
          prev.map((v, i) =>
            i === 0
              ? {
                  ...v,
                  colorId: v.colorId || defaultColorId || "",
                  sizes: v.sizes.map((s, sIdx) =>
                    sIdx === 0
                      ? { ...s, outletId: s.outletId || defaultOutletId || "" }
                      : s
                  ),
                }
              : v
          )
        );
      }
    }
  }, [colors, outlets, isEditMode]);

  // Helper to get default outlet ID
  const getDefaultOutletId = () => outlets[0]?.outlet_id || outlets[0]?.id || outlets[0]?._id || "";

  // Handler functions for Variants
  const handleAddVariant = () => {
    const defaultColorId = colors[0]?.id || colors[0]?._id || "";
    setVariants((prev) => [
      ...prev,
      {
        colorId: defaultColorId,
        images: [],
        sizes: [{ size: "", stock: "", outletId: getDefaultOutletId() }],
      },
    ]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (varIdx, field, val) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === varIdx ? { ...v, [field]: val } : v))
    );
  };

  // Image Upload Handler
  const handleImageUpload = async (varIdx, e) => {
    const inputElement = e.target;
    const files = Array.from(inputElement.files || []);
    if (files.length === 0) return;

    setUploadingVariants((prev) => ({ ...prev, [varIdx]: true }));

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const formData = new FormData();

    try {
      for (let file of files) {
        const compressedBlob = await imageCompression(file, options);
        const fileName = file.name || `image_${Date.now()}.jpg`;
        const compressedFile = new File([compressedBlob], fileName, {
          type: compressedBlob.type,
        });

        formData.append("images", compressedFile);
      }

      const response = await axiosInstance.post(
        "/upload/upload-images",
        formData,
        {
          headers: {
            "Content-Type": undefined,
          },
        }
      );

      const uploadedUrls =
        response.data?.urls ||
        response.data?.imageUrls ||
        response.data?.images ||
        [];

      if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
        setVariants((prev) =>
          prev.map((v, i) => {
            if (i !== varIdx) return v;
            const uniqueImages = Array.from(
              new Set([...v.images, ...uploadedUrls])
            );
            return { ...v, images: uniqueImages };
          })
        );
        setValidationError("");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to upload images. Please try again.";
      setValidationError(serverMsg);
    } finally {
      setUploadingVariants((prev) => ({ ...prev, [varIdx]: false }));
      if (inputElement) inputElement.value = "";
    }
  };

  // Image Remove Handler
  const handleRemoveImage = async (varIdx, imgIdx) => {
    const imageUrlToRemove = variants[varIdx]?.images[imgIdx];
    if (!imageUrlToRemove) return;

    setVariants((prev) =>
      prev.map((v, i) =>
        i === varIdx
          ? { ...v, images: v.images.filter((_, idx) => idx !== imgIdx) }
          : v
      )
    );

    try {
      await axiosInstance.post("/upload/delete-image", {
        imageUrl: imageUrlToRemove,
      });
      setValidationError("");
    } catch (error) {
      console.error("Failed to delete image from server:", error);
      const serverMsg =
        error.response?.data?.message ||
        "Failed to delete image from server. Removed locally.";
      setValidationError(serverMsg);
    }
  };

  // Size and Stock Handlers
  const handleAddSize = (varIdx) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === varIdx
          ? {
              ...v,
              sizes: [
                ...v.sizes,
                { size: "", stock: "", outletId: getDefaultOutletId() },
              ],
            }
          : v
      )
    );
  };

  const handleRemoveSize = (varIdx, sizeIdx) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== varIdx || v.sizes.length === 1) return v;
        return {
          ...v,
          sizes: v.sizes.filter((_, sIdx) => sIdx !== sizeIdx),
        };
      })
    );
  };

  const handleSizeChange = (varIdx, sizeIdx, field, val) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== varIdx) return v;
        const updatedSizes = v.sizes.map((s, sIdx) =>
          sIdx === sizeIdx ? { ...s, [field]: val } : s
        );
        return { ...v, sizes: updatedSizes };
      })
    );
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) return setValidationError("Product name is required");
    if (!price || parseFloat(price) <= 0)
      return setValidationError("Please enter a valid price");
    if (!categoryId) return setValidationError("Please select a category");
    if (!brandId) return setValidationError("Please select a brand");

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.colorId)
        return setValidationError(`Please select a color for variant ${i + 1}`);

      if (v.images.length === 0) {
        return setValidationError(
          `Please upload at least one image for variant ${i + 1}`
        );
      }

      for (let j = 0; j < v.sizes.length; j++) {
        const s = v.sizes[j];
        if (!s.size.trim()) {
          return setValidationError(
            `Please enter size name for variant ${i + 1}, item ${j + 1}`
          );
        }
        if (s.stock === "" || parseInt(s.stock, 10) < 0) {
          return setValidationError(
            `Stock cannot be negative or empty for variant ${i + 1}, item ${j + 1}`
          );
        }
        if (!s.outletId) {
          return setValidationError(
            `Please select an outlet for variant ${i + 1}, item ${j + 1}`
          );
        }
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      discount: parseFloat(discount) || 0,
      category_id: categoryId,
      brand_id: brandId,
      gender: parseInt(gender, 10) || 0,
      variants: variants.map((v) => ({
        color_id: v.colorId,
        images: v.images,
        sizes: v.sizes.map((s) => ({
          size: s.size.trim(),
          stock: parseInt(s.stock, 10) || 0,
          outlet_id: s.outletId,
        })),
      })),
    };

    console.log(payload);

    // Edit/Update or Add Action Dispatch
    const actionToDispatch = isEditMode
      ? updateProduct({ id, productData: payload })
      : addProduct(payload);

    dispatch(actionToDispatch)
      .unwrap()
      .then(() => {
        navigate("/products");
      })
      .catch((err) => {
        setValidationError(
          err || `Failed to ${isEditMode ? "update" : "create"} product`
        );
      });
  };

  if (fetchingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <Loader2 size={36} className="animate-spin text-accent-brand mb-2" />
        <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
          Loading product data...
        </p>
      </div>
    );
  }

  return (
    <div className="" id="product-form-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 text-xs font-semibold text-accent-brand hover:underline mb-1 cursor-pointer"
            type="button"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-sm mt-4">
          {validationError}
        </div>
      )}

      <div className="flex justify-center mt-10">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Basic Metadata */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Basic Metadata
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Viper Element Track Cleats"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      rows={4}
                      className="input-field resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-field"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="input-field"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Relational Taxonomy */}
            <div className="space-y-6">
              <div className="card p-5 space-y-4 h-full">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Relational Taxonomy
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      {categories.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Brand *
                    </label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="" disabled>
                        Select Brand
                      </option>
                      {brands.map((b) => (
                        <option key={b.id || b._id} value={b.id || b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      For/Gender *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Option */}
          <div className="card p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                Product Variants
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="btn-secondary py-1.5! px-3! text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((variant, varIdx) => (
                <div
                  key={varIdx}
                  className="p-5 border border-border-light dark:border-border-dark bg-bg-surface-light dark:bg-bg-surface-dark rounded-xl shadow-xs space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-brand/10 text-accent-brand">
                      Variant #{varIdx + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(varIdx)}
                        className="text-accent-danger hover:text-red-700 p-1.5 rounded-lg hover:bg-accent-danger/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Color Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Color Selector *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={variant.colorId}
                          onChange={(e) =>
                            handleVariantChange(
                              varIdx,
                              "colorId",
                              e.target.value
                            )
                          }
                          className="select-field"
                          required
                        >
                          <option value="">Select Color</option>
                          {colors.map((c) => (
                            <option key={c.id || c._id} value={c.id || c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {variant.colorId && (
                          <div
                            className="w-10 h-10 rounded-lg border shrink-0 shadow-inner"
                            style={{
                              backgroundColor:
                                colors.find(
                                  (c) => (c.id || c._id) === variant.colorId
                                )?.code || "#888",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Image Upload Field */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Upload Variant Images *
                      </label>
                      <div className="relative border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-4 text-center bg-bg-surface-light dark:bg-bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploadingVariants[varIdx]}
                          onChange={(e) => handleImageUpload(varIdx, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col items-center gap-1 text-text-secondary-light dark:text-text-secondary-dark">
                          {uploadingVariants[varIdx] ? (
                            <>
                              <Loader2
                                size={20}
                                className="animate-spin text-accent-brand"
                              />
                              <span className="text-xs font-semibold">
                                Uploading...
                              </span>
                            </>
                          ) : (
                            <>
                              <ImageIcon size={20} />
                              <span className="text-xs font-semibold">
                                Click or drag images to upload
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      {variant.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {variant.images.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative group aspect-square rounded-md overflow-hidden border border-border-light dark:border-border-dark"
                            >
                              <img
                                src={url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveImage(varIdx, imgIdx)
                                }
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Size, Stock & Outlet Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Sizes, Stock & Outlet *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddSize(varIdx)}
                          className="text-accent-brand hover:underline text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={12} /> Add Size
                        </button>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {variant.sizes.map((sz, szIdx) => (
                          <div
                            key={szIdx}
                            className="p-2 border border-border-light dark:border-border-dark rounded-lg space-y-2 bg-bg-surface-light dark:bg-bg-surface-dark"
                          >
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={sz.size}
                                onChange={(e) =>
                                  handleSizeChange(
                                    varIdx,
                                    szIdx,
                                    "size",
                                    e.target.value
                                  )
                                }
                                placeholder="Size"
                                className="input-field py-1.5! w-24 shrink-0"
                                required
                              />
                              <input
                                type="number"
                                value={sz.stock}
                                onChange={(e) =>
                                  handleSizeChange(
                                    varIdx,
                                    szIdx,
                                    "stock",
                                    e.target.value
                                  )
                                }
                                placeholder="Stock"
                                className="input-field py-1.5!"
                                required
                                min="0"
                              />
                              {variant.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(varIdx, szIdx)}
                                  className="text-text-secondary-light hover:text-accent-danger p-1.5 rounded-md hover:bg-accent-danger/10 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Outlet Select Dropdown */}
                            <div>
                              <select
                                value={sz.outletId}
                                onChange={(e) =>
                                  handleSizeChange(
                                    varIdx,
                                    szIdx,
                                    "outletId",
                                    e.target.value
                                  )
                                }
                                className="select-field text-xs py-1.5!"
                                required
                              >
                                <option value="" disabled>
                                  Select Outlet
                                </option>
                                {outlets.map((outlet) => (
                                  <option
                                    key={
                                      outlet.outlet_id ||
                                      outlet.id ||
                                      outlet._id
                                    }
                                    value={
                                      outlet.outlet_id ||
                                      outlet.id ||
                                      outlet._id
                                    }
                                  >
                                    {outlet.name || outlet.outlet_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="btn-secondary cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} />{" "}
                  {isEditMode ? "Update Product" : "Save Product"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}