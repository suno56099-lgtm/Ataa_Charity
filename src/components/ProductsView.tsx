import React, { useState } from 'react';
import {
  Package,
  Plus,
  Coins,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Power,
  Search,
  Archive,
  RotateCcw,
  Shield,
  Scale,
  Users,
} from 'lucide-react';
import { Product, ProductQuantityLimit } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';

interface ProductsViewProps {
  products: Product[];
  onRefresh: () => void;
  isAdmin: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onRefresh,
  isAdmin,
}) => {
  const [activeSection, setActiveSection] = useState<'products' | 'limits'>('products');

  // Products Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showArchived, setShowArchived] = useState(false);

  // Add / Edit Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pointsCost: 5,
    unit: 'كيس 1 كجم',
    category: 'حبوب وبقوليات',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Soft Delete Product Confirmation Modal state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Limits Tab State
  const [limitSearchQuery, setLimitSearchQuery] = useState('');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<ProductQuantityLimit | null>(null);
  const [limitFormData, setLimitFormData] = useState({
    productId: '',
    familySize: 7,
    maxQuantity: 5,
  });
  const [limitFormError, setLimitFormError] = useState<string | null>(null);
  const [limitFormSuccess, setLimitFormSuccess] = useState<string | null>(null);
  const [deletingLimit, setDeletingLimit] = useState<ProductQuantityLimit | null>(null);

  const categories = [
    'الكل',
    'حبوب وبقوليات',
    'زيوت ودهون',
    'معلبات وألبان',
    'مجمدات ولحوم',
    'مشروبات ومكملات',
  ];

  // Fetch all products including soft-deleted if showArchived is enabled
  const allProductsList = isAdmin && showArchived
    ? dataService.getAllProducts()
    : products.filter((p) => !p.isDeleted);

  const filteredProducts = allProductsList.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.pointsCost.toString().includes(q);
    const matchesCategory =
      selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const archivedCount = dataService
    .getAllProducts()
    .filter((p) => p.isDeleted).length;

  // Quantity Limits data
  const [selectedFamilySizeFilter, setSelectedFamilySizeFilter] = useState<string>('all');
  const productLimits = dataService.getProductLimits();
  const filteredLimits = [...productLimits]
    .sort((a, b) => a.familySize - b.familySize || a.productName.localeCompare(b.productName, 'ar'))
    .filter((l) => {
      if (selectedFamilySizeFilter !== 'all' && l.familySize.toString() !== selectedFamilySizeFilter) {
        return false;
      }
      const q = limitSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        l.productName.toLowerCase().includes(q) ||
        l.familySize.toString().includes(q) ||
        l.maxQuantity.toString().includes(q)
      );
    });

  // Open Add Product Modal
  const openAddModal = () => {
    if (!isAdmin) return;
    setFormData({
      name: '',
      pointsCost: 5,
      unit: 'كيس 1 كجم',
      category: 'حبوب وبقوليات',
    });
    setEditingProduct(null);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditModal = (p: Product) => {
    if (!isAdmin) return;
    setFormData({
      name: p.name,
      pointsCost: p.pointsCost,
      unit: p.unit || 'عبوة',
      category: p.category || 'حبوب وبقوليات',
    });
    setEditingProduct(p);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Handle Add/Edit Product Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError(null);
    setFormSuccess(null);

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setFormError('اسم السلعة مطلوب');
      return;
    }

    const points = Number(formData.pointsCost);
    if (!Number.isInteger(points) || points <= 0) {
      setFormError('تكلفة السلعة بالنقاط يجب أن تكون عدداً صحيحاً أكبر من الصفر');
      return;
    }

    if (editingProduct) {
      const res = dataService.updateProduct(editingProduct.id, {
        name: cleanName,
        pointsCost: points,
        unit: formData.unit.trim() || 'عبوة',
        category: formData.category,
      });
      if (!res.success) {
        setFormError(res.error || 'فشل تحديث بيانات السلعة');
        return;
      }
      setFormSuccess('تم تحديث بيانات السلعة بنجاح');
    } else {
      const res = dataService.addProduct({
        name: cleanName,
        pointsCost: points,
        unit: formData.unit.trim() || 'عبوة',
        category: formData.category,
      });
      if (!res.success) {
        setFormError(res.error || 'فشل إضافة السلعة الجديدة');
        return;
      }
      setFormSuccess('تمت إضافة السلعة الجديدة بنجاح');
    }

    onRefresh();
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingProduct(null);
    }, 700);
  };

  // Handle Confirm Soft Delete Product
  const handleConfirmDelete = () => {
    if (!isAdmin || !deletingProduct) return;
    const res = dataService.deleteProduct(deletingProduct.id);
    if (res.success) {
      setDeleteSuccess('تم حذف السلعة وإخفاؤها بنجاح مع حفظ سجلاتها السابقة');
      onRefresh();
      setTimeout(() => {
        setDeletingProduct(null);
        setDeleteSuccess(null);
      }, 900);
    }
  };

  // Restore Soft Deleted Product
  const handleRestoreProduct = (id: string) => {
    if (!isAdmin) return;
    dataService.restoreProduct(id);
    onRefresh();
  };

  // Toggle active/inactive Product
  const handleToggleProduct = (id: string) => {
    if (!isAdmin) return;
    dataService.toggleProduct(id);
    onRefresh();
  };

  // Open Add Limit Modal
  const openAddLimitModal = () => {
    if (!isAdmin) return;
    const activeProds = products.filter((p) => p.isActive && !p.isDeleted);
    const defaultProdId = activeProds.length > 0 ? activeProds[0].id : '';
    setLimitFormData({
      productId: defaultProdId,
      familySize: 7,
      maxQuantity: 5,
    });
    setEditingLimit(null);
    setLimitFormError(null);
    setLimitFormSuccess(null);
    setIsLimitModalOpen(true);
  };

  // Open Edit Limit Modal
  const openEditLimitModal = (limit: ProductQuantityLimit) => {
    if (!isAdmin) return;
    setLimitFormData({
      productId: limit.productId,
      familySize: limit.familySize,
      maxQuantity: limit.maxQuantity,
    });
    setEditingLimit(limit);
    setLimitFormError(null);
    setLimitFormSuccess(null);
    setIsLimitModalOpen(true);
  };

  // Handle Limit Form Submit
  const handleLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setLimitFormError(null);
    setLimitFormSuccess(null);

    if (!limitFormData.productId) {
      setLimitFormError('يرجى اختيار السلعة التموينية');
      return;
    }

    const famSize = Number(limitFormData.familySize);
    if (!Number.isInteger(famSize) || famSize < 1) {
      setLimitFormError('حجم الأسرة يجب أن يكون 1 فأكثر');
      return;
    }

    const maxQty = Number(limitFormData.maxQuantity);
    if (!Number.isInteger(maxQty) || maxQty < 1) {
      setLimitFormError('الحد الأقصى للكمية يجب أن يكون 1 فأكثر');
      return;
    }

    const selectedProd = products.find((p) => p.id === limitFormData.productId);
    const prodName = selectedProd ? selectedProd.name : '';

    const res = dataService.saveProductLimit({
      id: editingLimit ? editingLimit.id : undefined,
      productId: limitFormData.productId,
      productName: prodName,
      familySize: famSize,
      maxQuantity: maxQty,
    });

    if (!res.success) {
      setLimitFormError(res.error || 'فشل حفظ الحد الأقصى');
      return;
    }

    setLimitFormSuccess('تم حفظ الحد الأقصى للصرف بنجاح');
    onRefresh();
    setTimeout(() => {
      setIsLimitModalOpen(false);
      setEditingLimit(null);
    }, 700);
  };

  // Handle Confirm Delete Limit
  const handleConfirmDeleteLimit = () => {
    if (!isAdmin || !deletingLimit) return;
    const res = dataService.deleteProductLimit(deletingLimit.id);
    if (res.success) {
      onRefresh();
      setDeletingLimit(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold text-[#E8EDEA]">
              إدارة السلع والمنتجات التموينية
            </h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            إدارة السلع الغذائية المتاحة للتوزيع في جمعية عطاء وضبط حدود الكميات المسموحة لكل حجم أسرة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-[#34C38F]" />
              <span>صلاحية استعراض فقط (موظف)</span>
            </div>
          )}

          {isAdmin && activeSection === 'products' && (
            <>
              {archivedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    showArchived
                      ? 'bg-[#E0B35A]/15 border-[#E0B35A]/40 text-[#E0B35A]'
                      : 'bg-[#1C2521] border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                  }`}
                  title="عرض أو إخفاء السلع المحذوفة بواسطة الحذف المرن"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>
                    {showArchived
                      ? 'إخفاء السلع المحذوفة'
                      : `عرض السلع المحذوفة (${archivedCount})`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#2bb27f] active:scale-95 transition cursor-pointer w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سلعة جديدة</span>
              </button>
            </>
          )}

          {isAdmin && activeSection === 'limits' && (
            <button
              type="button"
              onClick={openAddLimitModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E0B35A] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#cfa14b] active:scale-95 transition cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حد أقصى جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs: Products vs Quantity Limits */}
      <div className="flex items-center gap-2 border-b border-[#26312C] pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'products'
              ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 shadow-sm'
              : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>قائمة السلع والأسعار ({products.filter((p) => !p.isDeleted).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('limits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'limits'
              ? 'bg-[#E0B35A]/15 text-[#E0B35A] border border-[#E0B35A]/30 shadow-sm'
              : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>حدود الكميات حسب أفراد الأسرة ({productLimits.length})</span>
        </button>
      </div>

      {/* SECTION 1: PRODUCTS CATALOG */}
      {activeSection === 'products' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#161D1A] border border-[#26312C] rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2.5 bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2 flex-1">
              <Search className="w-4 h-4 text-[#8A9690] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم السلعة، سعر النقاط، أو التصنيف..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#E8EDEA] placeholder-[#8A9690] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#8A9690] hover:text-[#E8EDEA] p-1 cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#34C38F] text-[#0F1412] shadow-sm'
                      : 'bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-12 text-center text-[#8A9690] space-y-3">
              <Package className="w-10 h-10 text-[#8A9690]/40 mx-auto" />
              <p className="text-sm">لا توجد سلع تموينية مطابقة لمعايير البحث الحالية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const isSoftDeleted = p.isDeleted;
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isSoftDeleted
                        ? 'bg-[#1C2521]/50 border-red-950/40 opacity-75'
                        : p.isActive
                        ? 'bg-[#161D1A] border-[#26312C] hover:border-[#34C38F]/40 hover:shadow-lg'
                        : 'bg-[#161D1A]/60 border-[#26312C] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-[#E8EDEA]">{p.name}</h3>
                            {isSoftDeleted ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0707A]/20 text-[#F0707A] font-bold border border-[#F0707A]/30">
                                محذوف مؤرشف
                              </span>
                            ) : p.isActive ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34C38F]/15 text-[#34C38F] font-bold border border-[#34C38F]/30">
                                متاح للتوزيع
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8A9690]/20 text-[#8A9690] font-bold">
                                معطل مؤقتاً
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#8A9690] mt-1">
                            {p.unit} • {p.category}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] font-bold text-sm flex-shrink-0">
                          <Coins className="w-4 h-4" />
                          <span>{p.pointsCost} ن</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-4 pt-3 border-t border-[#26312C] flex items-center justify-between gap-2">
                        {isSoftDeleted ? (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[11px] text-[#F0707A]">
                              محجوبة عن الصرف الجديد
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRestoreProduct(p.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#34C38F]/20 text-[#34C38F] hover:bg-[#34C38F]/30 text-xs font-semibold transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>استعادة السلعة</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleProduct(p.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                p.isActive
                                  ? 'bg-[#1C2521] border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                                  : 'bg-[#34C38F]/15 border-[#34C38F]/30 text-[#34C38F]'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{p.isActive ? 'تعطيل' : 'تفعيل'}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                className="p-2 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] hover:border-[#34C38F]/40 transition cursor-pointer"
                                title="تعديل السلعة"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingProduct(p)}
                                className="p-2 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#F0707A] hover:border-[#F0707A]/40 transition cursor-pointer"
                                title="حذف السلعة (أرشفة)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: QUANTITY LIMITS (admin-editable table: product, family_size, max_quantity) */}
      {activeSection === 'limits' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-[#E0B35A]/10 border border-[#E0B35A]/25 text-[#E0B35A] text-xs leading-relaxed flex items-start gap-3">
            <Scale className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#E0B35A]" />
            <div>
              <span className="font-bold">نظام ضبط حدود الكميات حسب عدد أفراد الأسرة:</span>{' '}
              يتم هنا تحديد الحد الأقصى لصرف السلع التموينية في عملية التسليم الواحدة وفقاً لحجم الأسرة.
              الأصناف التي لا يوجد لها قيد مسجل لأسرة معينة يمكن صرفها دون حد أقصى للكمية (طالما رصيد النقاط يكفي).
              يتم إنفاذ هذه الحدود فورياً في شاشة الصرف وعند الحفظ على السيرفر (Backend).
            </div>
          </div>

          {/* Filters & Search for Limits */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#161D1A] border border-[#26312C] rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2.5 bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2 flex-1">
              <Search className="w-4 h-4 text-[#8A9690] flex-shrink-0" />
              <input
                type="text"
                value={limitSearchQuery}
                onChange={(e) => setLimitSearchQuery(e.target.value)}
                placeholder="ابحث باسم السلعة، حجم الأسرة، أو الحد الأقصى..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#E8EDEA] placeholder-[#8A9690] focus:outline-none"
              />
              {limitSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLimitSearchQuery('')}
                  className="text-[#8A9690] hover:text-[#E8EDEA] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Family Size Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedFamilySizeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedFamilySizeFilter === 'all'
                    ? 'bg-[#E0B35A] text-[#0F1412] shadow-sm font-bold'
                    : 'bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                }`}
              >
                جميع الأسر
              </button>
              {[1, 2, 3, 4, 5, 6, 7].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedFamilySizeFilter(size.toString())}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedFamilySizeFilter === size.toString()
                      ? 'bg-[#E0B35A] text-[#0F1412] shadow-sm font-bold'
                      : 'bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                  }`}
                >
                  أسرة {size}
                </button>
              ))}
            </div>
          </div>

          {/* Limits Table & Mobile Cards */}
          <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-5 shadow-sm">
            {filteredLimits.length === 0 ? (
              <div className="py-12 text-center text-[#8A9690] text-sm space-y-3">
                <Scale className="w-10 h-10 text-[#8A9690]/40 mx-auto" />
                <p>لا توجد حدود كميات مسجلة مطابقة لبحثك.</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openAddLimitModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0B35A] text-[#0F1412] font-bold text-xs hover:bg-[#cfa14b] transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة حد أقصى جديد الآن</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredLimits.map((lim) => (
                    <div
                      key={lim.id}
                      className="p-4 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-2.5 shadow-sm text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[#E8EDEA]">{lim.productName}</div>
                          <div className="text-[11px] text-[#8A9690] mt-0.5 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#34C38F]" />
                            <span>حجم الأسرة: {lim.familySize} أفراد</span>
                          </div>
                        </div>
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A]">
                          الحد: {lim.maxQuantity} قطع
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="pt-2 border-t border-[#26312C] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditLimitModal(lim)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#161D1A] border border-[#26312C] hover:border-[#34C38F]/40 text-[#8A9690] hover:text-[#E8EDEA] text-xs font-medium transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingLimit(lim)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#161D1A] border border-[#26312C] hover:border-[#F0707A]/40 text-[#8A9690] hover:text-[#F0707A] text-xs font-medium transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#26312C] text-[#8A9690]">
                        <th className="pb-3 pr-2">السلعة التموينية (Product)</th>
                        <th className="pb-3 text-center">حجم الأسرة (Family Size)</th>
                        <th className="pb-3 text-center">الحد الأقصى للصرف (Max Quantity)</th>
                        <th className="pb-3 pl-2 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26312C]">
                      {filteredLimits.map((lim) => (
                        <tr key={lim.id} className="hover:bg-[#1C2521] transition">
                          <td className="py-3.5 pr-2 font-bold text-sm text-[#E8EDEA]">
                            {lim.productName}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] font-bold">
                              <Users className="w-3.5 h-3.5" />
                              <span>{lim.familySize} أفراد</span>
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] font-extrabold text-sm font-mono">
                              {lim.maxQuantity} قطع
                            </span>
                          </td>
                          <td className="py-3.5 pl-2 text-left">
                            {isAdmin ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditLimitModal(lim)}
                                  className="p-1.5 rounded-lg bg-[#161D1A] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] hover:border-[#34C38F]/40 transition cursor-pointer"
                                  title="تعديل الحد الأقصى"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingLimit(lim)}
                                  className="p-1.5 rounded-lg bg-[#161D1A] border border-[#26312C] text-[#8A9690] hover:text-[#F0707A] hover:border-[#F0707A]/40 transition cursor-pointer"
                                  title="حذف الحد الأقصى"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#8A9690] text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#26312C] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#E8EDEA]">
                  {editingProduct ? 'تعديل بيانات السلعة' : 'إضافة سلعة تموينية جديدة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A9690] hover:text-[#E8EDEA] p-1.5 rounded-xl hover:bg-[#1C2521] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">اسم السلعة التموينية</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أرز 800 جرام - ماركت"
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">تكلفة النقاط</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.pointsCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsCost: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E0B35A] font-bold focus:outline-none focus:border-[#E0B35A]"
                  />
                </div>

                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">الوحدة التموينية</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="مثال: كيس 800 جم"
                    className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">تصنيف السلعة</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                >
                  <option value="حبوب وبقوليات">حبوب وبقوليات</option>
                  <option value="زيوت ودهون">زيوت ودهون</option>
                  <option value="معلبات وألبان">معلبات وألبان</option>
                  <option value="مجمدات ولحوم">مجمدات ولحوم</option>
                  <option value="مشروبات ومكملات">مشروبات ومكملات</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold shadow-md transition cursor-pointer"
                >
                  {editingProduct ? 'حفظ التعديل' : 'إضافة السلعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT QUANTITY LIMIT */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#26312C] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E0B35A]/20 text-[#E0B35A] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#E8EDEA]">
                  {editingLimit ? 'تعديل الحد الأقصى للصرف' : 'إضافة حد أقصى جديد للصرف'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="text-[#8A9690] hover:text-[#E8EDEA] p-1.5 rounded-xl hover:bg-[#1C2521] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {limitFormError && (
              <div className="p-3.5 rounded-xl bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{limitFormError}</span>
              </div>
            )}

            {limitFormSuccess && (
              <div className="p-3.5 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{limitFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleLimitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">السلعة التموينية (Product)</label>
                <select
                  value={limitFormData.productId}
                  onChange={(e) => setLimitFormData({ ...limitFormData, productId: e.target.value })}
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] font-semibold focus:outline-none focus:border-[#E0B35A]"
                  required
                >
                  {products
                    .filter((p) => !p.isDeleted)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pointsCost} نقطة - {p.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    حجم الأسرة (عدد الأفراد)
                  </label>
                  <select
                    value={limitFormData.familySize}
                    onChange={(e) =>
                      setLimitFormData({
                        ...limitFormData,
                        familySize: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#34C38F] font-bold focus:outline-none focus:border-[#34C38F]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'فرد' : num === 2 ? 'فردان' : 'أفراد'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    الحد الأقصى (قطع)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={limitFormData.maxQuantity}
                    onChange={(e) =>
                      setLimitFormData({
                        ...limitFormData,
                        maxQuantity: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E0B35A] font-extrabold font-mono text-sm focus:outline-none focus:border-[#E0B35A]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] text-[11px] leading-relaxed">
                سيتم منع صرف أكثر من{' '}
                <strong className="text-[#E0B35A]">{limitFormData.maxQuantity} قطع</strong> من هذه السلعة
                لأي أسرة مكونة من{' '}
                <strong className="text-[#34C38F]">{limitFormData.familySize} أفراد</strong> في شاشة الصرف.
              </div>

              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLimitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0B35A] hover:bg-[#cfa14b] text-[#0F1412] font-bold shadow-md transition cursor-pointer"
                >
                  {editingLimit ? 'حفظ التعديل' : 'إضافة الحد الأقصى'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE PRODUCT CONFIRMATION (Soft Delete) */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0707A]/15 text-[#F0707A] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E8EDEA]">
                  تأكيد حذف السلعة التموينية
                </h3>
                <p className="text-xs text-[#8A9690] mt-0.5">
                  تطبيق سياسة الحذف المرن (Soft Delete)
                </p>
              </div>
            </div>

            {deleteSuccess ? (
              <div className="p-3.5 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-1.5">
                  <div className="text-xs text-[#8A9690]">السلعة المراد حذفها:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#E8EDEA]">
                      {deletingProduct.name}
                    </span>
                    <span className="text-xs font-bold text-[#E0B35A] px-2 py-0.5 rounded-lg bg-[#E0B35A]/10 border border-[#E0B35A]/20">
                      {deletingProduct.pointsCost} نقطة
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#E0B35A]/10 border border-[#E0B35A]/25 text-[#E0B35A] text-xs leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">حماية السجلات التاريخية:</span>{' '}
                    سيتم إخفاء السلعة من عمليات الصرف والتوزيع الجديدة فقط. تظل كافة
                    بيانات السلعة واسمها وسعرها محفوظة بالكامل داخل سجلات وإيصالات الصرف
                    السابقة دون أي تأثير على العمليات القديمة.
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeletingProduct(null)}
                    className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] text-xs font-semibold transition cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-xl bg-[#F0707A] hover:bg-[#e05e69] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد الحذف (أرشفة)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE LIMIT CONFIRMATION */}
      {deletingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0707A]/15 text-[#F0707A] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E8EDEA]">
                  حذف الحد الأقصى للصرف
                </h3>
                <p className="text-xs text-[#8A9690] mt-0.5">
                  إلغاء تقييد كمية السلعة لهذه الشريحة
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-1.5 text-xs">
              <div className="text-[#8A9690]">الحد الأقصى المراد حذفه:</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#E8EDEA]">{deletingLimit.productName}</span>
                <span className="text-[#34C38F] font-bold">أسرة من {deletingLimit.familySize} أفراد</span>
              </div>
              <div className="text-[#E0B35A] font-bold">الحد الحالي: {deletingLimit.maxQuantity} قطع</div>
            </div>

            <p className="text-xs text-[#8A9690]">
              بعد حذف هذا الحد، سيتاح صرف هذا الصنف لأي أسرة من هذا الحجم بأي كمية طالما رصيد النقاط يسمح بذلك.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingLimit(null)}
                className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] text-xs font-semibold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLimit}
                className="px-5 py-2 rounded-xl bg-[#F0707A] hover:bg-[#e05e69] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
