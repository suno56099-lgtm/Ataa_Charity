import React from 'react';
import {
  Users,
  ShoppingBag,
  KeyRound,
  Coins,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import { DashboardMetrics, DeliveryRecord } from '../types/index.ts';
import { ActiveTab } from './Sidebar.tsx';
import { formatArabicCurrencyOrPoints } from '../utils/egyptianValidation.ts';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentDeliveries: DeliveryRecord[];
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentDeliveries = [],
  onNavigate,
}) => {
  const weeklyDeliveries = Array.isArray(metrics?.weeklyDeliveries) ? metrics.weeklyDeliveries : [];
  const maxWeeklyCount = Math.max(
    ...weeklyDeliveries.map((w) => w?.deliveryCount || 0),
    5
  );
  const totalCodes = metrics?.codesThisMonthTotal || 0;
  const usedCodes = metrics?.codesThisMonthUsed || 0;
  const completionPercentage =
    totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Beneficiaries */}
        <div className="rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 shadow-sm hover:border-[#34C38F]/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A9690]">إجمالي المستفيدين المسجلين</span>
            <div className="w-9 h-9 rounded-xl bg-[#34C38F]/15 text-[#34C38F] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#E8EDEA]">
              {formatArabicCurrencyOrPoints(metrics.totalBeneficiaries)}
            </span>
            <span className="text-xs text-[#8A9690]">أسرة مستحقة</span>
          </div>
          <div className="mt-2 text-xs text-[#34C38F] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>بيانات موثقة بالرقم القومي</span>
          </div>
        </div>

        {/* Card 2: Deliveries This Month */}
        <div className="rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 shadow-sm hover:border-[#34C38F]/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A9690]">عمليات التسليم هذا الشهر</span>
            <div className="w-9 h-9 rounded-xl bg-[#34C38F]/15 text-[#34C38F] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#E8EDEA]">
              {formatArabicCurrencyOrPoints(metrics.deliveriesThisMonth)}
            </span>
            <span className="text-xs text-[#8A9690]">عملية ناجحة</span>
          </div>
          <div className="mt-2 text-xs text-[#8A9690]">
            النقاط المصروفة:{' '}
            <strong className="text-[#E0B35A]">
              {formatArabicCurrencyOrPoints(metrics.pointsDistributedThisMonth)}
            </strong>{' '}
            نقطة
          </div>
        </div>

        {/* Card 3: Codes Used vs Available */}
        <div className="rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 shadow-sm hover:border-[#E0B35A]/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A9690]">الأكواد الشهرية (أكتوبر)</span>
            <div className="w-9 h-9 rounded-xl bg-[#E0B35A]/15 text-[#E0B35A] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#E0B35A]">
              {formatArabicCurrencyOrPoints(metrics.codesThisMonthUsed)}
            </span>
            <span className="text-xs text-[#8A9690]">
              تم صرفها من أصل {formatArabicCurrencyOrPoints(metrics.codesThisMonthTotal)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#26312C] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-[#34C38F] to-[#E0B35A]"
                style={{
                  width: `${
                    metrics.codesThisMonthTotal > 0
                      ? (metrics.codesThisMonthUsed / metrics.codesThisMonthTotal) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-[11px] text-[#8A9690]">
              {metrics.codesThisMonthAvailable} متاح
            </span>
          </div>
        </div>

        {/* Card 4: Total Remaining Points */}
        <div className="rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 shadow-sm hover:border-[#34C38F]/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A9690]">إجمالي النقاط المتبقية</span>
            <div className="w-9 h-9 rounded-xl bg-[#34C38F]/15 text-[#34C38F] flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#E0B35A]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#E8EDEA]">
              {formatArabicCurrencyOrPoints(metrics.totalPointsRemaining)}
            </span>
            <span className="text-xs text-[#E0B35A]">نقطة عطاء</span>
          </div>
          <div className="mt-2 text-xs text-[#8A9690]">
            جاهزة للصرف التمويني والسلعي
          </div>
        </div>
      </div>

      {/* Grid: Food Basket Distribution Overview + Weekly Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Distribution Progress Card (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <PackageCheck className="w-5 h-5 text-[#34C38F] flex-shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-[#E8EDEA] leading-snug truncate">
                  مؤشرات التوزيع لشهر أكتوبر 2026
                </h2>
              </div>
              <span className="whitespace-nowrap inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-semibold flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C38F] animate-pulse"></span>
                <span>نشط</span>
              </span>
            </div>

            <p className="text-xs text-[#8A9690] leading-relaxed mb-5">
              متابعة حية لنسبة استلام الأسر المستحقة لحصصها الشهرية عبر مقر الجمعية الرئيسي بالقرية.
            </p>

            {/* Completion Progress Bar */}
            <div className="p-4 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#8A9690]">نسبة إنجاز الصرف بالقرية:</span>
                <span className="text-sm font-bold text-[#34C38F]">{completionPercentage}%</span>
              </div>
              <div className="w-full h-3 bg-[#0F1412] rounded-full overflow-hidden border border-[#26312C]">
                <div
                  className="h-full bg-gradient-to-l from-[#34C38F] to-[#10B981] rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(completionPercentage, 8)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8A9690]">
                <span>تم صرف: {metrics.codesThisMonthUsed} أسرة</span>
                <span>المتبقي: {metrics.codesThisMonthAvailable} أسرة</span>
              </div>
            </div>

            {/* Single Official Distribution Outlet */}
            <div className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34C38F]/15 text-[#34C38F] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#34C38F]" />
                </div>
                <div>
                  <div className="font-bold text-[#E8EDEA] text-xs">
                    مقر الجمعية الرئيسي بالقرية
                  </div>
                  <div className="text-[11px] text-[#8A9690] mt-0.5">
                    المنفذ الوحيد المعتمد لتسليم وصرف الحصص والسلع التموينية بقرية النسايمة
                  </div>
                </div>
              </div>
              <span className="self-start sm:self-center text-[10px] px-2.5 py-1 rounded-full bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-bold whitespace-nowrap">
                منفذ الصرف الوحيد
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#26312C] flex items-center justify-between text-xs text-[#8A9690]">
            <span className="flex items-center gap-1 text-[#34C38F]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مطابق لمعايير البحث الاجتماعي الدورية</span>
            </span>
            <button
              onClick={() => onNavigate('beneficiaries')}
              className="text-[#34C38F] hover:underline font-semibold"
            >
              عرض سجل الأسر ←
            </button>
          </div>
        </div>

        {/* Right: Deliveries Trend Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#34C38F]" />
                <h2 className="text-sm font-bold text-[#E8EDEA]">معدل التسليم الأسبوعي</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1C2521] border border-[#26312C] text-[#8A9690]">
                أكتوبر 2026
              </span>
            </div>
            <p className="text-xs text-[#8A9690] leading-relaxed mb-6">
              توزيع وتيرة صرف الحصص التموينية على مدار أسابيع الشهر الحالي.
            </p>

            {/* Custom Responsive SVG Bar Chart */}
            <div className="space-y-4">
              {metrics.weeklyDeliveries.map((week, idx) => {
                const percentage = Math.round((week.deliveryCount / maxWeeklyCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#E8EDEA]">{week.weekLabel}</span>
                      <span className="text-[#8A9690]">
                        <strong className="text-[#34C38F]">{week.deliveryCount}</strong> تسليم •{' '}
                        <strong className="text-[#E0B35A]">{week.pointsCount}</strong> نقطة
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#1C2521] rounded-full overflow-hidden border border-[#26312C]">
                      <div
                        className="h-full bg-gradient-to-l from-[#34C38F] to-[#10B981] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 12)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#26312C] flex items-center justify-between text-xs text-[#8A9690]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#34C38F]" />
              <span>مواعيد الصرف: يومياً من ٩ ص حتى ٥ م</span>
            </span>
            <button
              onClick={() => onNavigate('logs')}
              className="text-[#34C38F] hover:underline font-semibold"
            >
              عرض السجل الكامل ←
            </button>
          </div>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="rounded-2xl bg-[#161D1A] border border-[#26312C] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#34C38F]" />
            <h2 className="text-base font-bold text-[#E8EDEA]">أحدث عمليات التسليم والصرف</h2>
          </div>
          <button
            onClick={() => onNavigate('logs')}
            className="text-xs text-[#34C38F] hover:underline font-semibold"
          >
            عرض كافة العمليات
          </button>
        </div>

        {recentDeliveries.length === 0 ? (
          <div className="py-12 text-center text-[#8A9690] text-sm space-y-2">
            <ShoppingBag className="w-8 h-8 text-[#8A9690]/40 mx-auto" />
            <p>لا توجد عمليات صرف مسجلة حتى الآن لهذا اليوم.</p>
            <button
              onClick={() => onNavigate('delivery')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#34C38F] text-[#0F1412] text-xs font-bold hover:bg-[#2bb27f] transition mt-2"
            >
              بدء تسليم أول حصة
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards (< 768px) */}
            <div className="md:hidden space-y-2.5">
              {recentDeliveries.slice(0, 5).map((del) => (
                <div
                  key={del.id}
                  className="p-3.5 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#E8EDEA]">{del.beneficiaryName}</div>
                      <div className="text-[10px] text-[#8A9690]">
                        {del.staffName} • {new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric' }).format(new Date(del.createdAt))}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#E0B35A] px-2 py-0.5 rounded-lg bg-[#161D1A] border border-[#26312C]">
                      {del.deliveryCode}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8A9690] bg-[#161D1A] p-2 rounded-lg border border-[#26312C]">
                    {del.items.map((i) => `${i.productName} (×${i.quantity})`).join('، ')}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div>
                      <span>النقاط: </span>
                      <strong className="text-[#34C38F]">{del.totalPoints} نقطة</strong>
                    </div>
                    <div>
                      <span>المتبقي: </span>
                      <strong className="text-[#E0B35A]">{del.balanceAfter} نقطة</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#26312C] text-[#8A9690]">
                    <th className="pb-3 pr-2">كود الصرف</th>
                    <th className="pb-3">اسم المستفيد</th>
                    <th className="pb-3">مسؤول الصرف</th>
                    <th className="pb-3">الأصناف المصروفة</th>
                    <th className="pb-3">إجمالي النقاط</th>
                    <th className="pb-3">الرصيد المتبقي</th>
                    <th className="pb-3 pl-2">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C]">
                  {recentDeliveries.slice(0, 5).map((del) => (
                    <tr key={del.id} className="hover:bg-[#1C2521] transition">
                      <td className="py-3 pr-2 font-mono font-bold text-[#E0B35A]">
                        {del.deliveryCode}
                      </td>
                      <td className="py-3 font-semibold text-[#E8EDEA]">{del.beneficiaryName}</td>
                      <td className="py-3 text-[#8A9690]">{del.staffName}</td>
                      <td className="py-3 text-[#8A9690]">
                        {del.items.map((i) => `${i.productName} (×${i.quantity})`).join('، ')}
                      </td>
                      <td className="py-3 font-bold text-[#34C38F]">
                        {del.totalPoints} نقطة
                      </td>
                      <td className="py-3 text-[#8A9690]">{del.balanceAfter} نقطة</td>
                      <td className="py-3 pl-2 text-[#8A9690]">
                        {new Intl.DateTimeFormat('ar-EG', {
                          hour: 'numeric',
                          minute: 'numeric',
                        }).format(new Date(del.createdAt))}
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
  );
};
