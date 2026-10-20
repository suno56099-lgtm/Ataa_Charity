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
} from 'lucide-react';
import { MonthlyCode } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { formatMonthArabic, buildSmsLink } from '../utils/deliveryRules.ts';

interface MonthlyCodesViewProps {
  onRefresh: () => void;
}

export const MonthlyCodesView: React.FC<MonthlyCodesViewProps> = ({ onRefresh }) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Bulk SMS Modal state
  const [isBulkSmsOpen, setIsBulkSmsOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);

  const codes = dataService.getMonthlyCodes(selectedMonth);

  // Filtered codes based on search and status
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      if (statusFilter === 'available' && c.status !== 'available') return false;
      if (statusFilter === 'used' && c.status !== 'used') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        c.beneficiaryName.toLowerCase().includes(q) ||
        c.beneficiaryPhone.includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    });
  }, [codes, statusFilter, searchQuery]);

  // Copy code helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Generate Codes for Month
  const handleGenerateCodes = () => {
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
            <h1 className="text-lg sm:text-xl font-bold text-[#E8EDEA]">الأكواد الشهرية الأحادية (OTP)</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8A9690] mt-1">
            أكواد استلام موثقة ومؤمنة لكل مستفيد شهرياً مع إمكانية إرسال رسائل SMS.
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#1C2521] border border-[#26312C] rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-[#34C38F] flex-shrink-0" />
            <span className="text-[#8A9690] flex-shrink-0">الشهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#E8EDEA] font-semibold focus:outline-none flex-1 text-xs"
            >
              <option value="2026-10">أكتوبر 2026 (الحالي)</option>
              <option value="2026-11">نوفمبر 2026</option>
              <option value="2026-12">ديسمبر 2026</option>
              <option value="2026-09">سبتمبر 2026</option>
            </select>
          </div>

          <button
            onClick={handleGenerateCodes}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#34C38F] text-[#0F1412] font-bold text-xs shadow-md hover:bg-[#2bb27f] active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>توليد الأكواد لجميع المستفيدين</span>
          </button>

          <button
            onClick={() => setIsBulkSmsOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-[#E0B35A] text-xs font-semibold transition cursor-pointer"
          >
            <Send className="w-4 h-4 flex-shrink-0" />
            <span>إرسال للجميع (بوابة SMS)</span>
          </button>
        </div>
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
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
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
                        <h3 className="font-bold text-sm text-[#E8EDEA] truncate">{c.beneficiaryName}</h3>
                        <div className="font-mono text-xs text-[#8A9690] mt-0.5">{c.beneficiaryPhone}</div>
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
              <table className="w-full text-right text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#26312C] text-[#8A9690]">
                    <th className="pb-3 pr-2">اسم المستفيد</th>
                    <th className="pb-3">رقم الهاتف المحمول</th>
                    <th className="pb-3">كود الاستلام (6 أرقام)</th>
                    <th className="pb-3">حالة الصرف</th>
                    <th className="pb-3">تاريخ ووقت الصرف</th>
                    <th className="pb-3 text-center pl-2">إجراءات الإرسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C]">
                  {codes.map((c) => {
                    const isUsed = c.status === 'used';
                    const isCopied = copiedCodeId === c.id;
                    const { smsUrl } = buildSmsLink(c.beneficiaryPhone, c.code, c.monthKey);

                    return (
                      <tr key={c.id} className="hover:bg-[#1C2521] transition">
                        {/* Beneficiary */}
                        <td className="py-3 pr-2 font-semibold text-[#E8EDEA]">
                          {c.beneficiaryName}
                        </td>

                        {/* Phone */}
                        <td className="py-3 font-mono text-xs text-[#8A9690]">{c.beneficiaryPhone}</td>

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
                              aria-label={`نسخ كود ${c.beneficiaryName}`}
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

              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                {!isSendingBulk && (
                  <button
                    type="button"
                    onClick={() => setIsBulkSmsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#1C2521] hover:bg-[#26312C] text-[#8A9690] transition"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSendingBulk}
                  onClick={handleStartBulkSms}
                  className="px-5 py-2 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] disabled:opacity-50 text-[#0F1412] font-bold shadow-md transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingBulk ? 'جارٍ الإرسال السحابي...' : 'بدء الإرسال الفوري لجميع المستفيدين'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
