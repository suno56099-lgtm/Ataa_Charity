import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Power,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StaffAccount } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';

interface StaffViewProps {
  staffList: StaffAccount[];
  currentUser: StaffAccount | null;
  onRefresh: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  currentUser,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'staff' as 'admin' | 'staff',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [resetModalInfo, setResetModalInfo] = useState<{
    staffName: string;
    tempPass: string;
  } | null>(null);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.username.trim() || !formData.fullName.trim() || !formData.email.trim()) {
      setFormError('يرجى ملء كافة الحقول المطلوبة');
      return;
    }

    const res = dataService.createStaffAccount(formData);
    if (!res.success) {
      setFormError(res.error || 'فشل إنشاء الحساب');
      return;
    }

    setFormSuccess('تم إنشاء حساب الموظف الجديد بنجاح');
    setTimeout(() => {
      setIsAddModalOpen(false);
      onRefresh();
    }, 900);
  };

  const [bannerNotification, setBannerNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleToggleActive = (id: string) => {
    const res = dataService.toggleStaffAccount(id);
    if (!res.success) {
      setBannerNotification({
        type: 'error',
        message: res.error || 'تعذر تغيير حالة الحساب',
      });
      setTimeout(() => setBannerNotification(null), 4000);
      return;
    }
    setBannerNotification({
      type: 'success',
      message: 'تم تحديث حالة الحساب بنجاح',
    });
    setTimeout(() => setBannerNotification(null), 3000);
    onRefresh();
  };

  const handleResetPassword = (staff: StaffAccount) => {
    const res = dataService.resetStaffPassword(staff.id);
    if (res.success && res.tempPassword) {
      setResetModalInfo({
        staffName: staff.fullName,
        tempPass: res.tempPassword,
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold text-[#E8EDEA]">إدارة فريق العمل والصلاحيات</h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            إدارة حسابات مسؤولي الصرف والباحثين الميدانيين وتعيين الصلاحيات وإعادة ضبط كلمات المرور.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              username: '',
              email: '',
              fullName: '',
              role: 'staff',
            });
            setFormError(null);
            setFormSuccess(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-sm shadow-md hover:bg-[#2bb27f] active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {bannerNotification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
            bannerNotification.type === 'success'
              ? 'bg-[#34C38F]/15 border-[#34C38F]/30 text-[#34C38F]'
              : 'bg-[#F0707A]/15 border-[#F0707A]/30 text-[#F0707A]'
          }`}
        >
          {bannerNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{bannerNotification.message}</span>
        </div>
      )}

      {/* Staff Accounts Table */}
      {/* Staff Accounts List */}
      <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden">
        {/* Mobile Cards (< 768px) */}
        <div className="md:hidden space-y-3">
          {staffList.map((staff) => {
            const isCurrent = currentUser?.id === staff.id;
            return (
              <div
                key={staff.id}
                className="p-4 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-2.5 shadow-sm text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[#E8EDEA] flex items-center gap-1.5">
                      <span>{staff.fullName}</span>
                      {isCurrent && (
                        <span className="text-[10px] text-[#34C38F] font-bold">(حسابك)</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[#E0B35A] mt-0.5">@{staff.username}</div>
                  </div>

                  <div>
                    {staff.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0B35A]/15 text-[#E0B35A] border border-[#E0B35A]/30 font-bold text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>مدير عام</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-semibold text-[10px]">
                        <UserCheck className="w-3 h-3" />
                        <span>مسؤول صرف</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#8A9690] flex items-center justify-between pt-1 border-t border-[#26312C]">
                  <span className="font-mono">{staff.email}</span>
                  <span className={staff.isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}>
                    {staff.isActive ? '● نشط' : '○ معطل'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#26312C]">
                  <button
                    onClick={() => handleResetPassword(staff)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] border border-[#26312C] text-xs font-semibold text-[#E8EDEA] transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#E0B35A]" />
                    <span>إعادة تعيين كلمة المرور</span>
                  </button>

                  {!isCurrent && (
                    <button
                      onClick={() => handleToggleActive(staff.id)}
                      className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                        staff.isActive
                          ? 'bg-[#161D1A] border-[#F0707A]/30 text-[#F0707A]'
                          : 'bg-[#34C38F]/15 border-[#34C38F]/30 text-[#34C38F]'
                      }`}
                      title={staff.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
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
                <th className="pb-3 pr-2">الموظف</th>
                <th className="pb-3">اسم المستخدم</th>
                <th className="pb-3">البريد الإلكتروني الداخلي</th>
                <th className="pb-3">الدور والصلاحية</th>
                <th className="pb-3">الحالة</th>
                <th className="pb-3">آخر تسجيل دخول</th>
                <th className="pb-3 text-center pl-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26312C]">
              {staffList.map((staff) => {
                const isCurrent = currentUser?.id === staff.id;
                return (
                  <tr key={staff.id} className="hover:bg-[#1C2521] transition">
                    <td className="py-3.5 pr-2">
                      <div className="font-semibold text-[#E8EDEA]">{staff.fullName}</div>
                      {isCurrent && (
                        <span className="text-[10px] text-[#34C38F] font-bold">
                          (حسابك الحالي)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-[#E0B35A]">{staff.username}</td>
                    <td className="py-3.5 font-mono text-xs text-[#8A9690]">{staff.email}</td>
                    <td className="py-3.5">
                      {staff.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0B35A]/15 text-[#E0B35A] border border-[#E0B35A]/30 font-bold text-[11px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>مدير عام</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-semibold text-[11px]">
                          <UserCheck className="w-3 h-3" />
                          <span>مسؤول صرف وتسجيل</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          staff.isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            staff.isActive ? 'bg-[#34C38F]' : 'bg-[#8A9690]'
                          }`}
                        />
                        <span>{staff.isActive ? 'نشط' : 'معطل'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-[#8A9690]">
                      {staff.lastLoginAt
                        ? new Intl.DateTimeFormat('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(staff.lastLoginAt))
                        : 'لم يسجل دخول بعد'}
                    </td>
                    <td className="py-3.5 pl-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(staff)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] text-xs transition cursor-pointer"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound className="w-3 h-3 text-[#E0B35A]" />
                          <span>إعادة تعيين</span>
                        </button>

                        {/* Disable / Enable toggle */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleActive(staff.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              staff.isActive
                                ? 'bg-[#1C2521] hover:bg-[#F0707A]/20 text-[#8A9690] hover:text-[#F0707A]'
                                : 'bg-[#34C38F]/15 text-[#34C38F] hover:bg-[#34C38F]/25'
                            }`}
                            title={staff.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            aria-label={staff.isActive ? `تعطيل حساب ${staff.fullName}` : `تفعيل حساب ${staff.fullName}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[#34C38F]" />
                <h3 className="text-base font-bold">إضافة حساب موظف جديد</h3>
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

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">الاسم الكامل للموظف</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: يوسف محمود النجار"
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">اسم المستخدم للدخول</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })
                  }
                  placeholder="مثال: youssef_staff"
                  className="w-full font-mono bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">البريد الإلكتروني الداخلي</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                  placeholder="youssef@ataa.org.eg"
                  className="w-full font-mono bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">الدور والصلاحية</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })
                  }
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-2.5 text-[#E8EDEA] focus:outline-none focus:border-[#34C38F]"
                >
                  <option value="staff">مسؤول صرف وتسجيل (Staff)</option>
                  <option value="admin">مدير النظام (Admin - كامل الصلاحيات)</option>
                </select>
              </div>

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
                  إنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Alert Modal */}
      {resetModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#E0B35A]/15 text-[#E0B35A] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#E8EDEA]">تم إنشاء كلمة مرور مؤقتة</h3>
              <p className="text-xs text-[#8A9690] mt-1">
                للموظف: <strong className="text-[#E8EDEA]">{resetModalInfo.staffName}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F1412] border border-[#26312C]">
              <div className="text-[11px] text-[#8A9690] mb-1">كلمة المرور المؤقتة:</div>
              <div className="font-mono font-extrabold text-lg text-[#34C38F] tracking-wider select-all">
                {resetModalInfo.tempPass}
              </div>
            </div>

            <button
              onClick={() => setResetModalInfo(null)}
              className="w-full py-2.5 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-xs font-semibold text-[#E8EDEA] transition"
            >
              تم النسخ والحفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
