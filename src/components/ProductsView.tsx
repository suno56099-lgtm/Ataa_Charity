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
} from 'lucide-react';
import { Product } from '../types/index.ts';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showArchived, setShowArchived] = useState(false);

  // Add / Edit Modal state
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

  // Soft Delete Confirmation Modal state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

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

  // Handle Add/Edit Form Submit
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
        setFormError(res.error || 'فشل إضافة السلعة');
        return;
      }
      setFormSuccess('تمت إضافة السلعة التموينية بنجاح');
    }

    setTimeout(() => {
      setIsModalOpen(false);
      onRefresh();
    }, 700);
  };

  // Open Soft Delete Confirmation
  const promptDeleteProduct = (p: Product) => {
    if (!isAdmin) return;
    setDeletingProduct(p);
    setDeleteSuccess(null);
  };

  // Confirm Soft Delete
  const handleConfirmDelete = () => {
    if (!isAdmin || !deletingProduct) return;
    const res = dataService.deleteProduct(deletingProduct.id);
    if (res.success) {
      setDeleteSuccess(`تم حذف (أرشفة) السلعة "${deletingProduct.name}" بنجاح`);
      setTimeout(() => {
        setDeletingProduct(null);
        setDeleteSuccess(null);
        onRefresh();
      }, 700);
    }
  };

  // Restore Soft Deleted Product
  const handleRestoreProduct = (id: string) => {
    if (!isAdmin) return;
    dataService.restoreProduct(id);
    onRefresh();
  };

  // Toggle active/inactive
  const handleToggleProduct = (id: string) => {
    if (!isAdmin) return;
    dataService.toggleProduct(id);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold text-[#E8EDEA]">
              قائمة السلع والمنتجات التموينية
            </h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            إدارة السلع الغذائية المتاحة للتوزيع في جمعية عطاء الخيرية وتحديد تكلفة كل سلعة بنقاط الدعم.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role Indicator */}
          {!isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-[#34C38F]" />
              <span>صلاحية استعراض فقط (موظف)</span>
            </div>
          )}

          {isAdmin && (
            <>
              {/* Show Archived Toggle */}
              {archivedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
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

              {/* Add Product Button */}
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#2bb27f] active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سلعة جديدة</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2 flex-1">
          <Search className="w-4 h-4 text-[#8A9690]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السلعة، سعر النقاط، أو التصنيف..."
            className="w-full bg-transparent text-xs text-[#E8EDEA] placeholder-[#8A9690] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#8A9690] hover:text-[#E8EDEA]"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#34C38F] text-[#0F1412] font-bold shadow-sm'
                  : 'bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#26312C]'
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
          <Package className="w-12 h-12 mx-auto text-[#8A9690]/40" />
          <div className="text-base font-bold text-[#E8EDEA]">
            لا توجد سلع تموينية مطابقة للبحث
          </div>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery
              ? `لم نجد أي سلعة تموينية تحتوي على "${searchQuery}". حاول تغيير كلمة البحث.`
              : 'لم تتم إضافة أي سلع تموينية في هذا التصنيف حالياً.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const isSoftDeleted = !!prod.isDeleted;
            return (
              <div
                key={prod.id}
                className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                  isSoftDeleted
                    ? 'bg-[#1F1918]/60 border-[#F0707A]/30 opacity-75'
                    : prod.isActive
                    ? 'bg-[#161D1A] border-[#26312C] hover:border-[#34C38F]/40 shadow-sm'
                    : 'bg-[#161D1A]/60 border-[#26312C]/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2521] border border-[#26312C] text-[#8A9690] font-medium">
                          {prod.category}
                        </span>
                        {isSoftDeleted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] font-bold">
                            محذوف (أرشيف)
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#E8EDEA] mt-1.5 leading-snug">
                        {prod.name}
                      </h3>
                      <div className="text-xs text-[#8A9690]">
                        الوحدة: {prod.unit || 'عبوة'}
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] font-extrabold text-sm">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{prod.pointsCost}</span>
                      </div>
                      <span className="text-[10px] text-[#8A9690] mt-1">نقطة تموينية</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-[#26312C] flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      isSoftDeleted
                        ? 'text-[#F0707A]'
                        : prod.isActive
                        ? 'text-[#34C38F]'
                        : 'text-[#8A9690]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSoftDeleted
                          ? 'bg-[#F0707A]'
                          : prod.isActive
                          ? 'bg-[#34C38F]'
                          : 'bg-[#8A9690]'
                      }`}
                    />
                    <span>
                      {isSoftDeleted
                        ? 'محجوب من الصرف'
                        : prod.isActive
                        ? 'متاح للصرف'
                        : 'معطل مؤقتاً'}
                    </span>
                  </span>

                  {/* Admin-only controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {isSoftDeleted ? (
                        <button
                          onClick={() => handleRestoreProduct(prod.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34C38F]/15 hover:bg-[#34C38F]/25 text-[#34C38F] font-bold text-[11px] transition"
                          title="استعادة السلعة إلى قائمة السلع النشطة"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>استعادة</span>
                        </button>
                      ) : (
                        <>
                          {/* Edit Product */}
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-lg bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                            title="تعديل السلعة"
                            aria-label={`تعديل ${prod.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleProduct(prod.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              prod.isActive
                                ? 'bg-[#1C2521] hover:bg-[#E0B35A]/20 text-[#8A9690] hover:text-[#E0B35A]'
                                : 'bg-[#34C38F]/15 text-[#34C38F] hover:bg-[#34C38F]/25'
                            }`}
                            title={prod.isActive ? 'تعطيل مؤقت' : 'تفعيل السلعة'}
                            aria-label={prod.isActive ? `تعطيل ${prod.name}` : `تفعيل ${prod.name}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Product (Soft Delete with confirmation) */}
                          <button
                            onClick={() => promptDeleteProduct(prod)}
                            className="p-1.5 rounded-lg bg-[#1C2521] hover:bg-[#F0707A]/20 text-[#8A9690] hover:text-[#F0707A] transition cursor-pointer"
                            title="حذف السلعة (أرشفة)"
                            aria-label={`حذف ${prod.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#34C38F]" />
                <h3 className="text-base font-bold">
                  {editingProduct
                    ? 'تعديل بيانات السلعة التموينية'
                    : 'إضافة سلعة تموينية جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Product Name (required, unique) */}
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  اسم السلعة والوزن <span className="text-[#F0707A]">* (يجب أن يكون فريداً)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أرز 800 جرام - ماركت"
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              {/* Price in Points & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    السعر بالنقاط <span className="text-[#F0707A]">* (عدد صحيح &gt; 0)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
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

              {/* Category */}
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

      {/* Delete Confirmation Modal (Soft Delete) */}
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
    </div>
  );
};
