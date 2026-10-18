import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  EyeOff,
  Coins,
  Edit2,
  X,
  CheckCircle2,
  AlertTriangle,
  Phone,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { Beneficiary } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import {
  validateEgyptianNationalId,
  validateEgyptianPhone,
  maskNationalId,
} from '../utils/egyptianValidation.ts';
import { calculateFamilyPoints } from '../utils/deliveryRules.ts';

interface BeneficiariesViewProps {
  beneficiaries: Beneficiary[];
  onRefresh: () => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({
  beneficiaries,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [unmaskedIds, setUnmaskedIds] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [pointsModalBeneficiary, setPointsModalBeneficiary] = useState<Beneficiary | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nationalId: '',
    fullName: '',
    phone: '',
    address: '',
    familySize: 4,
    pointsBalance: 120,
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Points Add State
  const [pointsToAdd, setPointsToAdd] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState<string>('دعم دوري للشهر الحالي');
  const [pointsSuccess, setPointsSuccess] = useState<string | null>(null);

  // Filtered List
  const filteredList = beneficiaries.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.nationalId.includes(q)
    );
  });

  // Handle Unmasking with Security Audit
  const handleToggleUnmask = (beneficiaryId: string) => {
    if (unmaskedIds[beneficiaryId]) {
      // Hide
      setUnmaskedIds((prev) => {
        const next = { ...prev };
        delete next[beneficiaryId];
        return next;
      });
    } else {
      // Reveal and log audit entry
      const result = dataService.revealNationalId(beneficiaryId);
      if (result) {
        setUnmaskedIds((prev) => ({
          ...prev,
          [beneficiaryId]: result.nationalId,
        }));
      }
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    const defaultFamilySize = 4;
    const tiers = dataService.getPointsTiers();
    const autoPoints = calculateFamilyPoints(defaultFamilySize, tiers);

    setFormData({
      nationalId: '',
      fullName: '',
      phone: '',
      address: '',
      familySize: defaultFamilySize,
      pointsBalance: autoPoints,
      notes: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setEditingBeneficiary(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (b: Beneficiary) => {
    const cleanFamilySize = Math.max(1, Math.min(7, b.familySize || 1));
    const tiers = dataService.getPointsTiers();
    const autoPoints = calculateFamilyPoints(cleanFamilySize, tiers);

    setFormData({
      nationalId: b.nationalId,
      fullName: b.fullName,
      phone: b.phone,
      address: b.address || '',
      familySize: cleanFamilySize,
      pointsBalance: autoPoints,
      notes: b.notes || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setEditingBeneficiary(b);
    setIsAddModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    const nCheck = validateEgyptianNationalId(formData.nationalId);
    if (!nCheck.isValid) {
      setFormError(nCheck.errorMessage || 'الرقم القومي غير صالح');
      return;
    }

    const pCheck = validateEgyptianPhone(formData.phone);
    if (!pCheck.isValid) {
      setFormError(pCheck.errorMessage || 'رقم الهاتف غير صالح');
      return;
    }

    if (!formData.fullName.trim() || formData.fullName.trim().split(' ').length < 3) {
      setFormError('يرجى إدخال الاسم الثلاثي أو الرباعي كاملاً للمستفيد');
      return;
    }

    const cleanFamilySize = Math.max(1, Math.min(7, Math.floor(formData.familySize || 1)));
    const tiers = dataService.getPointsTiers();
    const cleanPoints = calculateFamilyPoints(cleanFamilySize, tiers);

    const submissionData = {
      ...formData,
      familySize: cleanFamilySize,
      pointsBalance: cleanPoints,
    };

    if (editingBeneficiary) {
      const res = dataService.updateBeneficiary(editingBeneficiary.id, submissionData);
      if (!res.success) {
        setFormError(res.error || 'فشل التحديث');
        return;
      }
      setFormSuccess('تم تحديث بيانات المستفيد واحتساب النقاط بنجاح');
    } else {
      const res = dataService.addBeneficiary(submissionData);
      if (!res.success) {
        setFormError(res.error || 'فشل التسجيل');
        return;
      }
      setFormSuccess('تم تسجيل المستفيد واحتساب نقاط الأسرة بنجاح');
    }

    setTimeout(() => {
      setIsAddModalOpen(false);
      onRefresh();
    }, 900);
  };

  // Handle Add Points Submit
  const handleAddPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsModalBeneficiary) return;

    const res = dataService.addBeneficiaryPoints(
      pointsModalBeneficiary.id,
      pointsToAdd,
      pointsReason
    );

    if (res.success) {
      setPointsSuccess(`تم إضافة ${pointsToAdd} نقطة بنجاح. الرصيد الجديد: ${res.newBalance} نقطة`);
      setTimeout(() => {
        setPointsModalBeneficiary(null);
        setPointsSuccess(null);
        onRefresh();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold text-[#E8EDEA]">سجل المستفيدين والأسر المستحقة</h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            سجل الأسر المستحقة بقرية النسايمة، حجب الرقم القومي للخصوصية، وإدارة أرصدة نقاط السلع التموينية.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#2bb27f] active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستفيد جديد</span>
        </button>
      </div>

      {/* Search Input Card */}
      <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-[#8A9690]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث بالاسم، رقم الهاتف المحمول، أو الرقم القومي..."
          className="w-full bg-transparent border-none text-sm text-[#E8EDEA] placeholder-[#8A9690] focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#8A9690] hover:text-[#E8EDEA] px-2 py-1"
          >
            مسح
          </button>
        )}
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-[#8A9690]">
            عدد النتائج: <strong className="text-[#E8EDEA]">{filteredList.length}</strong> مستفيد
          </span>
          <div className="flex items-center gap-2 text-[11px] text-[#8A9690]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#E0B35A]" />
            <span>يتم تسجيل كل عملية كشف للرقم القومي في سجل التدقيق الأمني</span>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-14 text-center text-[#8A9690] space-y-2">
            <Users className="w-8 h-8 mx-auto text-[#8A9690]/40" />
            <p className="text-sm">لم يتم العثور على أي مستفيد يطابق معايير البحث.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (Phones & Small Screens < 768px) */}
            <div className="md:hidden space-y-3">
              {filteredList.map((ben) => {
                const isUnmasked = !!unmaskedIds[ben.id];
                const displayedNid = isUnmasked
                  ? unmaskedIds[ben.id]
                  : maskNationalId(ben.nationalId);

                return (
                  <div
                    key={ben.id}
                    className="p-4 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-3 shadow-sm"
                  >
                    {/* Header: Name, Family, Points */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#E8EDEA] text-sm sm:text-base">
                          {ben.fullName}
                        </h3>
                        {ben.notes && (
                          <p className="text-[11px] text-[#8A9690] mt-0.5 line-clamp-2">
                            {ben.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-left flex-shrink-0">
                        <span className="font-extrabold text-base text-[#E0B35A]">
                          {ben.pointsBalance}
                        </span>{' '}
                        <span className="text-[10px] text-[#8A9690]">نقطة</span>
                      </div>
                    </div>

                    {/* Metadata: National ID + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#26312C]">
                      {/* National ID */}
                      <div className="flex items-center justify-between bg-[#161D1A] px-2.5 py-1.5 rounded-lg border border-[#26312C]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] text-[#8A9690] flex-shrink-0">الرقم القومي:</span>
                          <span
                            className={`font-mono text-xs truncate ${
                              isUnmasked ? 'text-[#34C38F] font-bold' : 'text-[#8A9690]'
                            }`}
                          >
                            {displayedNid}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleUnmask(ben.id)}
                          className="p-1 rounded text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer flex-shrink-0"
                          title={isUnmasked ? 'حجب الرقم القومي' : 'كشف الرقم القومي'}
                          aria-label={isUnmasked ? 'إخفاء الرقم القومي' : 'إظهار الرقم القومي'}
                        >
                          {isUnmasked ? (
                            <EyeOff className="w-4 h-4 text-[#34C38F]" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Phone with Direct Call */}
                      <div className="flex items-center justify-between bg-[#161D1A] px-2.5 py-1.5 rounded-lg border border-[#26312C]">
                        <span className="text-[11px] text-[#8A9690]">المحمول:</span>
                        <a
                          href={`tel:${ben.phone}`}
                          className="font-mono text-xs text-[#34C38F] hover:underline flex items-center gap-1"
                          dir="ltr"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{ben.phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Family size badge & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#26312C] gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#161D1A] border border-[#26312C] text-[#8A9690]">
                        الأسرة: {ben.familySize} أفراد
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Add Points */}
                        <button
                          onClick={() => {
                            setPointsModalBeneficiary(ben);
                            setPointsToAdd(50);
                            setPointsReason('دعم تمويني إضافي');
                            setPointsSuccess(null);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E0B35A]/15 hover:bg-[#E0B35A]/25 text-[#E0B35A] border border-[#E0B35A]/30 text-xs font-bold transition cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>شحن نقاط</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(ben)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] border border-[#26312C] text-xs transition cursor-pointer"
                          aria-label={`تعديل ${ben.fullName}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Tablet Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#26312C] text-[#8A9690]">
                    <th className="pb-3 pr-2">اسم المستفيد</th>
                    <th className="pb-3">الرقم القومي (محمي)</th>
                    <th className="pb-3">رقم المحمول</th>
                    <th className="pb-3">أفراد الأسرة</th>
                    <th className="pb-3">رصيد النقاط</th>
                    <th className="pb-3 text-center pl-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C]">
                  {filteredList.map((ben) => {
                    const isUnmasked = !!unmaskedIds[ben.id];
                    const displayedNid = isUnmasked
                      ? unmaskedIds[ben.id]
                      : maskNationalId(ben.nationalId);

                    return (
                      <tr key={ben.id} className="hover:bg-[#1C2521] transition">
                        {/* Name & Note */}
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-[#E8EDEA] text-sm">{ben.fullName}</div>
                          {ben.notes && (
                            <div className="text-[11px] text-[#8A9690] line-clamp-1">{ben.notes}</div>
                          )}
                        </td>

                        {/* National ID with Reveal / Mask button */}
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs px-2 py-1 rounded-lg border ${
                                isUnmasked
                                  ? 'bg-[#34C38F]/15 border-[#34C38F]/40 text-[#34C38F] font-bold'
                                  : 'bg-[#1C2521] border-[#26312C] text-[#8A9690]'
                              }`}
                            >
                              {displayedNid}
                            </span>
                            <button
                              onClick={() => handleToggleUnmask(ben.id)}
                              className="p-1 rounded-lg hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                              title={isUnmasked ? 'حجب الرقم القومي' : 'كشف الرقم القومي (يسجل بالتدقيق)'}
                              aria-label={isUnmasked ? 'إخفاء الرقم القومي' : 'إظهار الرقم القومي'}
                            >
                              {isUnmasked ? (
                                <EyeOff className="w-3.5 h-3.5 text-[#34C38F]" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Phone with Click to Call */}
                        <td className="py-3 font-mono text-xs text-[#E8EDEA]">
                          <a
                            href={`tel:${ben.phone}`}
                            className="hover:text-[#34C38F] transition inline-flex items-center gap-1"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3 h-3 text-[#8A9690]" />
                            <span>{ben.phone}</span>
                          </a>
                        </td>

                        {/* Family Size */}
                        <td className="py-3 text-[#E8EDEA]">
                          <span className="px-2 py-0.5 rounded-full bg-[#1C2521] border border-[#26312C]">
                            {ben.familySize} أفراد
                          </span>
                        </td>

                        {/* Points Balance */}
                        <td className="py-3">
                          <span className="font-bold text-sm text-[#E0B35A]">
                            {ben.pointsBalance}
                          </span>{' '}
                          <span className="text-[10px] text-[#8A9690]">نقطة</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Add Points */}
                            <button
                              onClick={() => {
                                setPointsModalBeneficiary(ben);
                                setPointsToAdd(50);
                                setPointsReason('دعم تمويني إضافي');
                                setPointsSuccess(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E0B35A]/15 hover:bg-[#E0B35A]/25 text-[#E0B35A] border border-[#E0B35A]/30 text-xs font-semibold transition cursor-pointer"
                              title="إضافة نقاط للمستفيد"
                            >
                              <Coins className="w-3 h-3" />
                              <span>شحن نقاط</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(ben)}
                              className="p-1.5 rounded-lg bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                              title="تعديل البيانات"
                              aria-label={`تعديل بيانات ${ben.fullName}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Beneficiary Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] my-8 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#34C38F]" />
                <h2 className="text-base font-bold">
                  {editingBeneficiary ? 'تعديل بيانات المستفيد' : 'تسجيل مستفيد جديد في جمعية عطاء الخيرية (قرية النسايمة)'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleSaveBeneficiary} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  الاسم الرباعي للمستفيد <span className="text-[#F0707A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: أحمد عبد الرحمن محمود علي"
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              {/* National ID & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    الرقم القومي المصري (14 رقماً) <span className="text-[#F0707A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="28503140101234"
                    className="w-full font-mono bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                  />
                  <span className="text-[10px] text-[#8A9690] mt-1 block">
                    يتم التحقق من تاريخ الميلاد والمحافظة
                  </span>
                </div>

                <div>
                  <label className="block text-[#8A9690] mb-1 font-medium">
                    رقم الهاتف المحمول (11 رقماً) <span className="text-[#F0707A]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="01012345678"
                      className="w-full font-mono bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#8A9690] absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Family Size & Automatic Live Points Calculation */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#8A9690] font-medium text-xs">
                        عدد أفراد الأسرة (من 1 إلى 7 أفراد)
                      </label>
                      <span className="text-[10px] text-[#34C38F] font-semibold">محدد 1 - 7</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      step={1}
                      required
                      value={formData.familySize}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        const cleanSize = Math.max(1, Math.min(7, isNaN(parsed) ? 1 : parsed));
                        const tiers = dataService.getPointsTiers();
                        const autoPts = calculateFamilyPoints(cleanSize, tiers);
                        setFormData({
                          ...formData,
                          familySize: cleanSize,
                          pointsBalance: autoPts,
                        });
                      }}
                      className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] font-bold text-center focus:outline-none focus:border-[#34C38F]"
                    />
                  </div>

                  {/* Live Calculated Points Card (Points are never typed manually) */}
                  <div className="p-3 rounded-xl bg-[#0F1412] border border-[#26312C] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#8A9690] font-medium flex items-center gap-1">
                        <Calculator className="w-3 h-3 text-[#34C38F]" />
                        <span>النقاط المستحقة (احتساب آلي)</span>
                      </div>
                      <div className="text-[10px] text-[#34C38F] font-semibold mt-0.5">
                        حساب تلقائي حسب الشرائح
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] font-black text-lg">
                      <Coins className="w-4 h-4" />
                      <span>{formData.pointsBalance}</span>
                    </div>
                  </div>
                </div>

                {/* Micro info showing the exact formula preview */}
                <div className="p-2.5 rounded-xl bg-[#1C2521] border border-[#26312C]/60 text-[11px] text-[#8A9690] flex items-center justify-between">
                  <span>
                    وفقاً للشرائح المعتمدة: الفرد 1 (30ن) + الفرد 2-3 (24ن/فرد) + الفرد 4-7 (21ن/فرد).
                  </span>
                  <span className="text-[#34C38F] font-bold">لا يُكتب يدوياً</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  ملاحظات أو توصيات أخصائي البحث الميداني
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: أسرة أيتام، دخل منعدم، حالة صحية تستدعي دعماً إضافياً..."
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold shadow-md transition"
                >
                  {editingBeneficiary ? 'حفظ التعديلات' : 'تسجيل المستفيد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {pointsModalBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#E0B35A]" />
                <h3 className="text-base font-bold">إضافة نقاط تموينية للمستفيد</h3>
              </div>
              <button
                onClick={() => setPointsModalBeneficiary(null)}
                className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-[#1C2521] border border-[#26312C] text-xs space-y-1">
              <div className="text-[#8A9690]">المستفيد:</div>
              <div className="text-sm font-bold text-[#E8EDEA]">
                {pointsModalBeneficiary.fullName}
              </div>
              <div className="text-[#8A9690]">
                الرصيد الحالي:{' '}
                <strong className="text-[#E0B35A]">
                  {pointsModalBeneficiary.pointsBalance}
                </strong>{' '}
                نقطة
              </div>
            </div>

            {pointsSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pointsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddPointsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  عدد النقاط المراد إضافتها
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  required
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-base font-bold text-[#E0B35A] focus:outline-none focus:border-[#E0B35A]"
                />
              </div>

              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">سبب الشحن الإضافي</label>
                <select
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                >
                  <option value="دعم دوري للشهر الحالي">شحن شهري دوري للأسر المستحقة</option>
                  <option value="منحة موسمية استثنائية (رمضان/الأعياد)">
                    منحة موسمية استثنائية (موسم الخير)
                  </option>
                  <option value="تسوية رصيد بعد بحث ميداني جديد">
                    تسوية رصيد بناءً على توصية باحث ميداني
                  </option>
                  <option value="تبرع خاص ومخصص للأسرة">تبرع مخصص من فاعل خير</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-[#26312C]/40 text-[11px] text-[#8A9690] flex items-center justify-between">
                <span>الرصيد بعد الشحن سيكون:</span>
                <span className="font-bold text-[#34C38F] text-sm">
                  {pointsModalBeneficiary.pointsBalance + (pointsToAdd || 0)} نقطة
                </span>
              </div>

              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPointsModalBeneficiary(null)}
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0B35A] hover:bg-[#caa04e] text-[#0F1412] font-bold shadow-md transition"
                >
                  تأكيد شحن النقاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
