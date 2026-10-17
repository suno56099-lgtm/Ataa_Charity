import React, { useState } from 'react';
import {
  Package,
  Plus,
  Coins,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Power,
  Search,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pointsCost: 15,
    unit: 'كيس 1 كجم',
    category: 'حبوب وبقوليات',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const categories = ['الكل', 'حبوب وبقوليات', 'زيوت ودهون', 'معلبات وألبان', 'مجمدات ولحوم', 'مشروبات ومكملات'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      pointsCost: 15,
      unit: 'كيس 1 كجم',
      category: 'حبوب وبقوليات',
    });
    setEditingProduct(null);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setFormData({
      name: p.name,
      pointsCost: p.pointsCost,
      unit: p.unit,
      category: p.category,
    });
    setEditingProduct(p);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim()) {
      setFormError('اسم السلعة مطلوب');
      return;
    }
    if (formData.pointsCost <= 0) {
      setFormError('تكلفة السلعة بالنقاط يجب أن تكون أكبر من الصفر');
      return;
    }

    if (editingProduct) {
      const res = dataService.updateProduct(editingProduct.id, formData);
      if (!res.success) {
        setFormError(res.error || 'فشل التعديل');
        return;
      }
      setFormSuccess('تم تحديث السلعة بنجاح');
    } else {
      const res = dataService.addProduct(formData);
      if (!res.success) {
        setFormError(res.error || 'فشل الإضافة');
        return;
      }
      setFormSuccess('تمت إضافة السلعة التموينية بنجاح');
    }

    setTimeout(() => {
      setIsModalOpen(false);
      onRefresh();
    }, 800);
  };

  const handleToggleProduct = (id: string) => {
    dataService.toggleProduct(id);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold text-[#E8EDEA]">قائمة السلع والمنتجات التموينية</h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            إدارة السلع الغذائية المتاحة للتوزيع في جمعية عطاء الخيرية وتحديد تكلفة كل سلعة بنقاط الدعم.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#2bb27f] active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سلعة جديدة</span>
          </button>
        )}
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
            placeholder="ابحث باسم السلعة أو التصنيف..."
            className="w-full bg-transparent text-xs text-[#E8EDEA] placeholder-[#8A9690] focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
              prod.isActive
                ? 'bg-[#161D1A] border-[#26312C] hover:border-[#34C38F]/40'
                : 'bg-[#161D1A]/60 border-[#26312C]/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2521] border border-[#26312C] text-[#8A9690] font-medium">
                    {prod.category}
                  </span>
                  <h3 className="text-base font-bold text-[#E8EDEA] mt-2 line-clamp-1">
                    {prod.name}
                  </h3>
                  <div className="text-xs text-[#8A9690] mt-0.5">الوحدة: {prod.unit}</div>
                </div>

                {/* Points Badge */}
                <div className="flex flex-col items-end">
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
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  prod.isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    prod.isActive ? 'bg-[#34C38F]' : 'bg-[#8A9690]'
                  }`}
                />
                <span>{prod.isActive ? 'متاح للصرف' : 'معطل مؤقتاً'}</span>
              </span>

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 rounded-lg bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition"
                    title="تعديل السلعة"
                    aria-label={`تعديل ${prod.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleProduct(prod.id)}
                    className={`p-1.5 rounded-lg transition ${
                      prod.isActive
                        ? 'bg-[#1C2521] hover:bg-[#F0707A]/20 text-[#8A9690] hover:text-[#F0707A]'
                        : 'bg-[#34C38F]/15 text-[#34C38F] hover:bg-[#34C38F]/25'
                    }`}
                    title={prod.isActive ? 'تعطيل السلعة' : 'تفعيل السلعة'}
                    aria-label={prod.isActive ? `تعطيل ${prod.name}` : `تفعيل ${prod.name}`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#34C38F]" />
                <h3 className="text-base font-bold">
                  {editingProduct ? 'تعديل بيانات السلعة' : 'إضافة سلعة تموينية جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]"
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
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  اسم السلعة والوزن <span className="text-[#F0707A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: زيت طعام عباد الشمس 1 لتر"
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    تكلفة النقاط <span className="text-[#F0707A]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.pointsCost}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsCost: parseInt(e.target.value, 10) || 1 })
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
                    placeholder="مثال: زجاجة 1 لتر"
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
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold shadow-md transition"
                >
                  {editingProduct ? 'حفظ التعديل' : 'إضافة السلعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
