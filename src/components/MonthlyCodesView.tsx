import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  Calendar,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Search,
  Filter,
  Lock,
  Unlock,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { MonthlyCode } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { formatMonthArabic, buildSmsLink } from '../utils/deliveryRules.ts';
import { cleanPersonName } from '../utils/egyptianValidation.ts';

interface MonthlyCodesViewProps {
  onRefresh: () => void;
}

export const MonthlyCodesView: React.FC<MonthlyCodesViewProps> = ({ onRefresh }) => {
  const activeMonth = dataService.getActiveMonth();
  const distributionMonths = dataService.getDistributionMonths();
  const [selectedMonth, setSelectedMonth] = useState(activeMonth);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Month cycle management state
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState(() => {
    const [yStr, mStr] = activeMonth.split('-');
    let y = parseInt(yStr || '2026', 10);
    let m = parseInt(mStr || '10', 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
  });
  const [autoGenerateForNewMonth, setAutoGenerateForNewMonth] = useState(true);
  const [showAllMonthsDrawer, setShowAllMonthsDrawer] = useState(false);

  // Current selected month details
  const currentMonthInfo = dataService.getMonthInfo(selectedMonth);
  const isClosed = currentMonthInfo?.status === 'closed';
  const isActiveMonth = activeMonth === selectedMonth;

  // Bulk SMS Modal state
  const [isBulkSmsOpen, setIsBulkSmsOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);

  const codes = dataService.getMonthlyCodes(selectedMonth);

  // Filtered codes based on search and status
  const safeCodes = Array.isArray(codes) ? codes : [];
  const filteredCodes = useMemo(() => {
    return safeCodes.filter((c) => {
      if (!c) return false;
      if (statusFilter === 'available' && c.status !== 'available') return false;
      if (statusFilter === 'used' && c.status !== 'used') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (c.beneficiaryName || '').toLowerCase().includes(q) ||
        (c.beneficiaryPhone || '').includes(q) ||
        (c.code || '').toLowerCase().includes(q)
      );
    });
  }, [safeCodes, statusFilter, searchQuery]);

  // Copy code helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Month Actions
  const handleCloseMonth = () => {
    const res = dataService.closeMonth(selectedMonth);
    if (res.success) {
      setNotification({
        type: 'success',
        message: `تم إغلاق دورة صرف شهر ${formatMonthArabic(selectedMonth)} بنجاح وتم تسجيله كـ (تم تسليمه بالكامل).`,
      });
      onRefresh();
    }
  };

  const handleReopenMonth = () => {
    const res = dataService.reopenMonth(selectedMonth);
    if (res.success) {
      setNotification({
        type: 'success',
        message: `تمت إعادة فتح دورة صرف شهر ${formatMonthArabic(selectedMonth)} بنجاح، وأصبح الصرف متاحاً الآن.`,
      });
      onRefresh();
    }
  };

  const handleSetActiveMonth = () => {
    dataService.setActiveMonth(selectedMonth);
    setNotification({
      type: 'success',
      message: `تم تعيين دورة شهر ${formatMonthArabic(selectedMonth)} كالشهر النشط المعتمد للصرف بالمنظومة.`,
    });
    onRefresh();
  };

  const handleConfirmOpenNewMonth = () => {
    const trimmed = newMonthInput.trim();
    if (!trimmed) return;
    const res = dataService.openNewMonth(trimmed, autoGenerateForNewMonth);
    if (res.success) {
      setSelectedMonth(trimmed);
      setIsNewMonthModalOpen(false);
      setNotification({
        type: 'success',
        message: `تم فتح دورة شهر جديد (${formatMonthArabic(trimmed)}) بنجاح${
          res.createdCodesCount ? ` وتوليد ${res.createdCodesCount} كود استلام للأسر` : ''
        }.`,
      });
      onRefresh();
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'فشل فتح الشهر الجديد',
      });
    }
  };

  // Generate Codes for Month
  const handleGenerateCodes = () => {
    if (isClosed) {
      setNotification({
        type: 'error',
        message: `دورة شهر ${formatMonthArabic(selectedMonth)} مغلقة (تم تسليمه بالكامل). يرجى إعادة فتح الشهر أولاً في حال الرغبة بتوليد أكواد جديدة.`,
      });
      return;
    }

    const res = dataService.generateCodesForMonth(selectedMonth);
    if (res.success) {
      if (res.createdCount === 0) {
        setNotification({
          type: 'success',
          message: `جميع المستفيدين النشطين لديهم بالفعل أكواد مسجلة لشهر ${formatMonthArabic(selectedMonth)}.`,
        });
      } else {
        setNotification({
          type: 'success',
          message: `تم توليد ${res.createdCount} كود شهري جديد بنجاح لشهر ${formatMonthArabic(selectedMonth)}.`,
        });
      }
      onRefresh();
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'فشل توليد الأكواد',
      });
    }

    setTimeout(() => setNotification(null), 4000);
  };

  // Bulk SMS Send simulation (Edge Function architecture)
  const handleStartBulkSms = () => {
    const availableCodes = codes.filter((c) => c.status === 'available');
    if (availableCodes.length === 0) {
      setNotification({
        type: 'error',
        message: 'لا توجد أكواد متاحة لم يتم إرسالها بعد في هذا الشهر.',
      });
      setIsBulkSmsOpen(false);
      return;
    }

    setIsSendingBulk(true);
    setBulkProgress({ sent: 0, total: availableCodes.length });

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBulkProgress({ sent: count, total: availableCodes.length });
      if (count >= availableCodes.length) {
        clearInterval(interval);
        setIsSendingBulk(false);
        setNotification({
          type: 'success',
          message: `تم بنجاح إرسال ${availableCodes.length} رسالة نصية عبر بوابة الرسائل السحابية (Supabase Edge Function).`,
        });
        setIsBulkSmsOpen(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#E0B35A] flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-[#E8EDEA]">الأكواد الشهرية المعتمدة</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8A9690] mt-1">
            إدارة دورات الصرف الشهرية، فتح وإغلاق الأشهر التموينية وتوليد وإرسال أكواد الاستلام للأسر المستحقة.
          </p>
        </div>

        {/* Quick Month Actions: New Month Button & Overview Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAllMonthsDrawer((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-xs font-semibold text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#34C38F]" />
            <span>سجل الدورات ({distributionMonths.length})</span>
            {showAllMonthsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsNewMonthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>فتح شهر جديد</span>
          </button>
        </div>
      </div>

      {/* Month Cycle Control & Status Banner */}
      <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Selector & Status Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-[#8A9690]">دورة الصرف:</span>
              <div className="flex items-center gap-2 bg-[#1C2521] border border-[#26312C] rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-4 h-4 text-[#34C38F] flex-shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-[#E8EDEA] font-bold focus:outline-none text-xs cursor-pointer"
                >
                  {distributionMonths.map((m) => (
                    <option key={m.monthKey} value={m.monthKey} className="bg-[#161D1A] text-[#E8EDEA]">
                      {formatMonthArabic(m.monthKey)}{' '}
                      {m.status === 'closed' ? '🔒 [مغلق - تم تسليمه]' : '● [دورة مفتوحة]'}{' '}
                      {m.monthKey === activeMonth ? '⭐ (النشط)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Badge */}
              {isClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] font-bold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>شهر مغلق (تم تسليمه بالكامل)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#34C38F] animate-pulse"></span>
                  <span>دورة مفتوحة للصرف</span>
                </span>
              )}

              {isActiveMonth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C38F] text-[#0F1412] font-extrabold text-[10px]">
                  الشهر النشط حالياً
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#8A9690] leading-relaxed">
              {isClosed
                ? `هذا الشهر مغلق وتم تسليمه بالكامل للأسر، ولا يمكن إجراء عمليات تسليم جديدة له ما لم تتم إعادة فتحه.`
                : `هذا الشهر مفتوح ويقبل صرف الحصص التموينية والسلعية للمستفيدين المسجلين.`}
            </p>
          </div>

          {/* Action Buttons for Current Month */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* Close / Reopen Toggle Button */}
            {isClosed ? (
              <button
                type="button"
                onClick={handleReopenMonth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#34C38F]/15 hover:bg-[#34C38F]/25 border border-[#34C38F]/40 text-[#34C38F] font-bold text-xs transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>إعادة فتح الشهر</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseMonth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E0B35A]/15 hover:bg-[#E0B35A]/25 border border-[#E0B35A]/40 text-[#E0B35A] font-bold text-xs transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>قفل الشهر (تم التسليم)</span>
              </button>
            )}

            {/* Set as Active Month Button */}
            {!isActiveMonth && (
              <button
                type="button"
                onClick={handleSetActiveMonth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-[#E8EDEA] font-semibold text-xs transition cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#34C38F]" />
                <span>تعيين كشهر نشط للصرف</span>
              </button>
            )}

            {/* Generate Codes */}
            <button
              type="button"
              onClick={handleGenerateCodes}
              disabled={isClosed}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-xs shadow-md hover:bg-[#2bb27f] disabled:opacity-40 disabled:hover:bg-[#34C38F] disabled:cursor-not-allowed active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>توليد الأكواد</span>
            </button>

            {/* SMS Gateway */}
            <button
              type="button"
              onClick={() => setIsBulkSmsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-[#E0B35A] text-xs font-semibold transition cursor-pointer"
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              <span>إرسال SMS</span>
            </button>
          </div>
        </div>

        {/* Collapsible All Months Overview Table */}
        {showAllMonthsDrawer && (
          <div className="pt-4 border-t border-[#26312C] space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-[#8A9690]">
              <span className="font-bold text-[#E8EDEA]">سجل جميع الدورات التموينية المسجلة بالمنظومة:</span>
              <span>إجمالي: {distributionMonths.length} أشهر</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#26312C]">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#1C2521] text-[#8A9690] border-b border-[#26312C]">
                    <th className="py-2.5 px-3">الشهر والدورة</th>
                    <th className="py-2.5 px-3">حالة الصرف</th>
                    <th className="py-2.5 px-3">الأكواد الصادرة</th>
                    <th className="py-2.5 px-3">إجراءات التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C] bg-[#161D1A]">
                  {distributionMonths.map((m) => {
                    const mCodes = dataService.getMonthlyCodes(m.monthKey) || [];
                    const usedCount = mCodes.filter((c) => c.status === 'used').length;
                    const isMClosed = m.status === 'closed';
                    const isMActive = m.monthKey === activeMonth;
                    return (
                      <tr key={m.monthKey} className="hover:bg-[#1C2521]/60 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#E8EDEA] flex items-center gap-1.5">
                            <span>{formatMonthArabic(m.monthKey)}</span>
                            {isMActive && (
                              <span className="px-1.5 py-0.5 rounded bg-[#34C38F] text-[#0F1412] text-[9px] font-bold">
                                النشط
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#8A9690]">{m.monthKey}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isMClosed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E0B35A]">
                              <Lock className="w-3 h-3" />
                              <span>مغلق (تم تسليمه)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#34C38F]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#34C38F]"></span>
                              <span>مفتوح للصرف</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[#E8EDEA] font-bold">{mCodes.length}</span>{' '}
                          <span className="text-[10px] text-[#8A9690]">
                            (تم تسليم: <strong className="text-[#34C38F]">{usedCount}</strong>)
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedMonth(m.monthKey)}
                              className="px-2 py-1 rounded-lg bg-[#1C2521] hover:bg-[#26312C] text-[#E8EDEA] text-[11px] transition cursor-pointer"
                            >
                              عرض الأكواد
                            </button>
                            {isMClosed ? (
                              <button
                                type="button"
                                onClick={() => {
                                  dataService.reopenMonth(m.monthKey);
                                  onRefresh();
                                }}
                                className="px-2 py-1 rounded-lg bg-[#34C38F]/15 hover:bg-[#34C38F]/25 text-[#34C38F] text-[11px] font-semibold transition cursor-pointer"
                              >
                                إعادة فتح
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  dataService.closeMonth(m.monthKey);
                                  onRefresh();
                                }}
                                className="px-2 py-1 rounded-lg bg-[#E0B35A]/15 hover:bg-[#E0B35A]/25 text-[#E0B35A] text-[11px] font-semibold transition cursor-pointer"
                              >
                                قفل (تم التسليم)
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
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-[#34C38F]/15 border-[#34C38F]/30 text-[#34C38F]'
              : 'bg-[#F0707A]/15 border-[#F0707A]/30 text-[#F0707A]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Codes Container Card */}
      <div className="bg-[#161D1A] border border-[#26312C] rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
        {/* Stats & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="text-[#8A9690] leading-relaxed">
            أكواد شهر <strong className="text-[#E8EDEA]">{formatMonthArabic(selectedMonth)}</strong> •{' '}
            إجمالي: <strong className="text-[#34C38F]">{codes.length}</strong> كود (
            <span className="text-[#34C38F] font-bold">{codes.filter((c) => c.status === 'used').length} تم</span>،{' '}
            <span className="text-[#E0B35A] font-bold">{codes.filter((c) => c.status === 'available').length} متاح</span>)
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#34C38F]/20 text-[#34C38F] border border-[#34C38F]/40'
                  : 'bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]'
              }`}
            >
              الكل ({codes.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'available'
                  ? 'bg-[#E0B35A]/20 text-[#E0B35A] border border-[#E0B35A]/40'
                  : 'bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]'
              }`}
            >
              متاح ({codes.filter((c) => c.status === 'available').length})
            </button>
            <button
              onClick={() => setStatusFilter('used')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                statusFilter === 'used'
                  ? 'bg-[#34C38F]/20 text-[#34C38F] border border-[#34C38F]/40'
                  : 'bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]'
              }`}
            >
              تم الصرف ({codes.filter((c) => c.status === 'used').length})
            </button>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8A9690] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو رقم الهاتف أو كود الاستلام..."
            className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl pr-9 pl-3 py-2 text-xs text-[#E8EDEA] placeholder:text-[#8A9690] focus:outline-none focus:border-[#34C38F] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9690] hover:text-[#E8EDEA]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {codes.length === 0 ? (
          <div className="py-14 text-center text-[#8A9690] text-sm space-y-3">
            <KeyRound className="w-8 h-8 text-[#8A9690]/40 mx-auto" />
            <p>لم يتم توليد أي أكواد بعد لهذا الشهر ({formatMonthArabic(selectedMonth)}).</p>
            <button
              onClick={handleGenerateCodes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-xs hover:bg-[#2bb27f] transition shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>توليد الأكواد لجميع المستفيدين الآن</span>
            </button>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="py-10 text-center text-[#8A9690] text-xs space-y-2">
            <p>لا توجد نتائج مطابقة لبحثك في هذا الشهر.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-[#34C38F] underline hover:no-underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards for Phones (< 768px): 100% Responsive, Perfectly Sized */}
            <div className="md:hidden space-y-2.5">
              {filteredCodes.map((c) => {
                const isUsed = c.status === 'used';
                const isCopied = copiedCodeId === c.id;
                const { smsUrl } = buildSmsLink(c.beneficiaryPhone, c.code, c.monthKey);

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-2.5 shadow-sm"
                  >
                    {/* Header: Beneficiary Name, Phone & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-[#E8EDEA] truncate">
                          {cleanPersonName(c.beneficiaryName)}
                        </h3>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#8A9690] mt-0.5">
                          <span className="text-[10px] text-[#8A9690]/80">الهاتف:</span>
                          <span dir="ltr">{c.beneficiaryPhone}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C38F]/15 text-[#34C38F] font-bold text-[10px] border border-[#34C38F]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تم الصرف</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0B35A]/15 text-[#E0B35A] font-semibold text-[10px] border border-[#E0B35A]/30">
                            <span>متاح للصرف</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dedicated Full-Width Code Display Bar */}
                    <div className="bg-[#161D1A] px-3 py-2 rounded-xl border border-[#26312C] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <KeyRound className="w-3.5 h-3.5 text-[#E0B35A] flex-shrink-0" />
                        <span className="text-[10px] text-[#8A9690] flex-shrink-0">الكود:</span>
                        <span className="font-mono font-extrabold text-xs sm:text-sm text-[#E0B35A] tracking-wider truncate select-all">
                          {c.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.id, c.code)}
                        className="p-1 rounded-lg text-[#8A9690] hover:text-[#34C38F] hover:bg-[#1C2521] transition flex-shrink-0 cursor-pointer"
                        title="نسخ الكود"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#34C38F]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Action Buttons: 2 Equal-Width Touch Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#26312C]/60">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.id, c.code)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] border border-[#26312C] text-xs font-semibold text-[#E8EDEA] transition active:scale-95 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#34C38F]" />
                            <span className="text-[#34C38F] font-bold">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#8A9690]" />
                            <span>نسخ الكود</span>
                          </>
                        )}
                      </button>

                      <a
                        href={smsUrl}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#34C38F]/15 hover:bg-[#34C38F]/25 border border-[#34C38F]/30 text-[#34C38F] text-xs font-bold transition active:scale-95 text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>إرسال SMS</span>
                      </a>
                    </div>

                    {/* Used Date Info if used */}
                    {isUsed && c.usedAt && (
                      <div className="text-[10px] text-[#8A9690] flex items-center justify-between pt-1 border-t border-[#26312C]/40">
                        <span>وقت وتاريخ الصرف:</span>
                        <span className="font-mono text-[#E8EDEA]">
                          {new Intl.DateTimeFormat('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(c.usedAt))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop & Tablet Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#26312C] text-[#8A9690]">
                    <th className="pb-3 pr-2 whitespace-nowrap font-semibold">اسم المستفيد</th>
                    <th className="pb-3 whitespace-nowrap font-semibold">رقم الهاتف المحمول</th>
                    <th className="pb-3 whitespace-nowrap font-semibold">كود الاستلام (6 أرقام)</th>
                    <th className="pb-3 whitespace-nowrap font-semibold">حالة الصرف</th>
                    <th className="pb-3 whitespace-nowrap font-semibold">تاريخ ووقت الصرف</th>
                    <th className="pb-3 text-center pl-2 whitespace-nowrap font-semibold">إجراءات الإرسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C]">
                  {filteredCodes.map((c) => {
                    const isUsed = c.status === 'used';
                    const isCopied = copiedCodeId === c.id;
                    const { smsUrl } = buildSmsLink(c.beneficiaryPhone, c.code, c.monthKey);

                    return (
                      <tr key={c.id} className="hover:bg-[#1C2521] transition">
                        {/* Beneficiary */}
                        <td className="py-3.5 pr-2 font-bold text-sm text-[#E8EDEA] tracking-wide">
                          {cleanPersonName(c.beneficiaryName)}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 font-mono text-xs text-[#E8EDEA] whitespace-nowrap font-medium" dir="ltr">
                          {c.beneficiaryPhone}
                        </td>

                        {/* 6-Digit Code */}
                        <td className="py-3">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#1C2521] border border-[#26312C]">
                            <span className="font-mono font-extrabold text-sm tracking-wider text-[#E0B35A]">
                              {c.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(c.id, c.code)}
                              className="p-1 rounded hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                              title="نسخ الكود"
                              aria-label={`نسخ كود ${cleanPersonName(c.beneficiaryName)}`}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-[#34C38F]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          {isUsed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C38F]/15 text-[#34C38F] font-bold text-[11px] border border-[#34C38F]/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم الصرف</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0B35A]/15 text-[#E0B35A] font-semibold text-[11px] border border-[#E0B35A]/30">
                              <span>متاح للصرف</span>
                            </span>
                          )}
                        </td>

                        {/* Used Info */}
                        <td className="py-3 text-[#8A9690]">
                          {c.usedAt
                            ? new Intl.DateTimeFormat('ar-EG', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              }).format(new Date(c.usedAt))
                            : '—'}
                        </td>

                        {/* SMS Action */}
                        <td className="py-3 pl-2 text-center">
                          <a
                            href={smsUrl}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-xs font-semibold text-[#E8EDEA] transition"
                            title="فتح تطبيق الرسائل وإرسال الكود"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#34C38F]" />
                            <span>إرسال SMS</span>
                          </a>
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

      {/* Bulk SMS Modal */}
      {isBulkSmsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA] animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C] mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#34C38F]" />
                <h3 className="text-base font-bold">إرسال جماعي عبر بوابة الرسائل السحابية</h3>
              </div>
              {!isSendingBulk && (
                <button
                  onClick={() => setIsBulkSmsOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#8A9690] leading-relaxed">
                يتم الإرسال عبر دالة سحابية مؤمنة (Supabase Edge Function) لحماية مفتاح واجهة برمجة
                تطبيقات بوابة الرسائل (SMS Gateway API Key) على الخادم فقط، دون تعريضه في المتصفح.
              </p>

              <div className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-2">
                <div className="text-[#8A9690]">صيغة نص الرسالة:</div>
                <div className="p-2.5 rounded-lg bg-[#0F1412] text-[#E8EDEA] leading-relaxed font-sans border border-[#26312C]">
                  مرحباً بك في جمعية عطاء الخيرية. كود استلام المساعدة الخاص بك لشهر {formatMonthArabic(selectedMonth)} هو: [XXXXXX]. يرجى التوجه إلى مقر الجمعية الرئيسي بالقرية مع بطاقة الرقم القومي للاستلام.
                </div>
              </div>

              {bulkProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8A9690]">تقدم عملية الإرسال:</span>
                    <span className="font-mono font-bold text-[#34C38F]">
                      {bulkProgress.sent} / {bulkProgress.total} رسالة
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1C2521] rounded-full overflow-hidden border border-[#26312C]">
                    <div
                      className="h-full bg-[#34C38F] transition-all duration-300"
                      style={{
                        width: `${(bulkProgress.sent / (bulkProgress.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#26312C] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                {!isSendingBulk && (
                  <button
                    type="button"
                    onClick={() => setIsBulkSmsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] transition text-center"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSendingBulk}
                  onClick={handleStartBulkSms}
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] disabled:opacity-50 text-[#0F1412] font-bold shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingBulk ? 'جارٍ الإرسال السحابي...' : 'بدء الإرسال الفوري لجميع المستفيدين'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Month Cycle Modal */}
      {isNewMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-fade-in no-print">
          <div className="w-full max-w-md rounded-2xl bg-[#161D1A] border border-[#34C38F]/50 p-5 sm:p-6 shadow-2xl text-[#E8EDEA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#26312C]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#E8EDEA]">فتح دورة شهر جديد</h3>
                  <div className="text-[11px] text-[#8A9690]">بدء دورة تموينية وتوليد أكواد الاستلام للأسر</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMonthModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#8A9690] mb-1 font-medium">
                  حدد الشهر والسنة (YYYY-MM):
                </label>
                <input
                  type="month"
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3 py-2.5 text-sm text-[#E8EDEA] font-semibold focus:outline-none focus:border-[#34C38F]"
                />
              </div>

              {/* Quick Suggestion Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#8A9690]">أشهر مقترحة سريعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['2026-11', '2026-12', '2027-01', '2027-02'].map((mKey) => (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => setNewMonthInput(mKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        newMonthInput === mKey
                          ? 'bg-[#34C38F] text-[#0F1412] font-bold'
                          : 'bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690]'
                      }`}
                    >
                      {formatMonthArabic(mKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Generate Codes Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-[#1C2521] rounded-xl border border-[#26312C] cursor-pointer hover:border-[#34C38F]/40 transition">
                <input
                  type="checkbox"
                  checked={autoGenerateForNewMonth}
                  onChange={(e) => setAutoGenerateForNewMonth(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#34C38F] focus:ring-0 bg-[#161D1A] border-[#26312C]"
                />
                <div>
                  <div className="font-bold text-[#E8EDEA]">توليد أكواد الاستلام فوراً لجميع الأسر النشطة</div>
                  <div className="text-[10px] text-[#8A9690] mt-0.5 leading-relaxed">
                    يتم احتساب رصيد النقاط تلقائياً حسب عدد أفراد كل أسرة وتجهيز الأكواد للإرسال الفوري
                  </div>
                </div>
              </label>

              <div className="p-3 bg-[#1C2521] rounded-xl border border-[#26312C] text-[#8A9690] text-[11px] leading-relaxed">
                * عند فتح الشهر الجديد، سيتم تعيينه كـ <strong className="text-[#34C38F]">الشهر النشط للصرف</strong> تلقائياً ويمكنك قفله في أي وقت عند اكتمال التسليم.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewMonthModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOpenNewMonth}
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وفتح الشهر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
