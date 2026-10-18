import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Save,
  Users,
  Info,
} from 'lucide-react';
import { PointsTierConfig, DEFAULT_POINTS_TIERS, calculateFamilyPoints } from '../utils/deliveryRules.ts';
import { dataService } from '../services/dataService.ts';

interface PointsCalculatorViewProps {
  isAdmin: boolean;
  onRefresh: () => void;
}

export const PointsCalculatorView: React.FC<PointsCalculatorViewProps> = ({
  isAdmin,
  onRefresh,
}) => {
  const [currentTiers, setCurrentTiers] = useState<PointsTierConfig>(() =>
    dataService.getPointsTiers()
  );
  const [editTiers, setEditTiers] = useState<PointsTierConfig>(() =>
    dataService.getPointsTiers()
  );
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Interactive Calculator State
  const [testFamilySize, setTestFamilySize] = useState<number>(4);

  // Calculate live results based on currently edited or saved tiers
  const activeTiersForSim = isAdmin ? editTiers : currentTiers;
  const calculatedPoints = calculateFamilyPoints(testFamilySize, activeTiersForSim);

  const handleSaveTiers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaveError(null);
    setSaveSuccess(null);

    const t1 = Math.floor(Number(editTiers.tier1));
    const t2 = Math.floor(Number(editTiers.tier2));
    const t3 = Math.floor(Number(editTiers.tier3));

    if (t1 <= 0 || t2 <= 0 || t3 <= 0) {
      setSaveError('جميع قيم الشرائح يجب أن تكون أعداداً صحيحة أكبر من الصفر');
      return;
    }

    const newTiers: PointsTierConfig = { tier1: t1, tier2: t2, tier3: t3 };
    const res = dataService.updatePointsTiers(newTiers);
    if (!res.success) {
      setSaveError(res.error || 'فشل حفظ إعدادات الشرائح');
      return;
    }

    setCurrentTiers(newTiers);
    setSaveSuccess('تم تحديث جدول شرائح النقاط بنجاح وتسجيل العملية في سجل التدقيق');
    onRefresh();

    setTimeout(() => {
      setSaveSuccess(null);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (!isAdmin) return;
    setEditTiers({ ...DEFAULT_POINTS_TIERS });
    setSaveError(null);
  };

  // Precomputed breakdown for family sizes 1 through 7
  const familySizes = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6 animate-fade-in text-[#E8EDEA]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161D1A] border border-[#26312C] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#34C38F]" />
            <h1 className="text-xl font-bold">حاسبة النقاط وإعدادات الشرائح التموينية</h1>
          </div>
          <p className="text-xs text-[#8A9690] mt-1">
            احتساب نقاط الدعم التمويني للأسر المستفيدة تلقائياً حسب عدد الأفراد (من 1 إلى 7 أفراد) وتعديل قيم الشرائح بدون تعديل الكود البرمجي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-[#34C38F]" />
              <span>استعراض فقط (تعديل الشرائح للمدير فقط)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#34C38F]/10 border border-[#34C38F]/30 text-[#34C38F] text-xs font-bold">
              <Sliders className="w-3.5 h-3.5" />
              <span>لوحة ضبط الإدارة العامة</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#34C38F]/15 border border-[#34C38F]/30 text-[#34C38F] text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 rounded-xl bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Grid: Live Interactive Calculator + Settings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (7 Cols): Admin-Editable Settings Table */}
        <div className="lg:col-span-7 bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#26312C]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#34C38F]" />
              <h2 className="text-sm sm:text-base font-bold text-[#E8EDEA]">
                جدول شرائح احتساب النقاط (Admin-Editable Settings)
              </h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 text-[11px] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
                title="استعادة القيم الافتراضية"
              >
                <RotateCcw className="w-3 h-3" />
                <span>القيم الافتراضية</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[#8A9690] leading-relaxed">
            وفقاً للمعادلة المعتمدة، يتم احتساب نقاط الأسرة تلقائياً بدون كتابة يدوية. يمكنك كمسؤول نظام تعديل قيم أي شريحة وسيتم تطبيقها فوراً على تسجيل المستفيدين الجدد وإعادة الاحتساب.
          </p>

          <form onSubmit={handleSaveTiers} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#26312C] text-[#8A9690]">
                    <th className="py-2.5 px-3">الشريحة</th>
                    <th className="py-2.5 px-3">نطاق الأفراد</th>
                    <th className="py-2.5 px-3">النقاط لكل فرد</th>
                    <th className="py-2.5 px-3">القيمة الافتراضية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26312C]/60">
                  {/* Tier 1 */}
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#E8EDEA]">
                      الشريحة الأولى
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">
                      الفرد الأول (رب الأسرة)
                    </td>
                    <td className="py-3 px-3">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={editTiers.tier1}
                            onChange={(e) =>
                              setEditTiers({
                                ...editTiers,
                                tier1: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-20 bg-[#1C2521] border border-[#26312C] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#E0B35A] focus:outline-none focus:border-[#34C38F]"
                          />
                          <span className="text-[11px] text-[#8A9690]">نقطة</span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-[#E0B35A]">
                          {currentTiers.tier1} نقطة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">30 نقطة</td>
                  </tr>

                  {/* Tier 2 */}
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#E8EDEA]">
                      الشريحة الثانية
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">
                      الفرد الثاني والثالث (لكل فرد)
                    </td>
                    <td className="py-3 px-3">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={editTiers.tier2}
                            onChange={(e) =>
                              setEditTiers({
                                ...editTiers,
                                tier2: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-20 bg-[#1C2521] border border-[#26312C] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#E0B35A] focus:outline-none focus:border-[#34C38F]"
                          />
                          <span className="text-[11px] text-[#8A9690]">نقطة</span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-[#E0B35A]">
                          {currentTiers.tier2} نقطة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">24 نقطة</td>
                  </tr>

                  {/* Tier 3 */}
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#E8EDEA]">
                      الشريحة الثالثة
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">
                      من الفرد الرابع حتى السابع (لكل فرد)
                    </td>
                    <td className="py-3 px-3">
                      {isAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={editTiers.tier3}
                            onChange={(e) =>
                              setEditTiers({
                                ...editTiers,
                                tier3: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-20 bg-[#1C2521] border border-[#26312C] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#E0B35A] focus:outline-none focus:border-[#34C38F]"
                          />
                          <span className="text-[11px] text-[#8A9690]">نقطة</span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-[#E0B35A]">
                          {currentTiers.tier3} نقطة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#8A9690]">21 نقطة</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-[#26312C] flex items-center justify-end gap-2.5">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ إعدادات الشرائح</span>
                </button>
              </div>
            )}
          </form>

          {/* Detailed Reference Table */}
          <div className="pt-4 border-t border-[#26312C] space-y-2">
            <h3 className="text-xs font-bold text-[#8A9690]">
              جدول النتائج المحسوبة لعدد الأفراد (1 - 7):
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {familySizes.map((size) => {
                const pts = calculateFamilyPoints(size, activeTiersForSim);
                return (
                  <div
                    key={size}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      testFamilySize === size
                        ? 'bg-[#34C38F]/15 border-[#34C38F] text-[#34C38F]'
                        : 'bg-[#1C2521] border-[#26312C] text-[#E8EDEA]'
                    }`}
                  >
                    <div className="text-[11px] text-[#8A9690]">
                      {size} {size === 1 ? 'فرد' : size === 2 ? 'فردين' : 'أفراد'}
                    </div>
                    <div className="text-base font-extrabold mt-1 text-[#E0B35A]">
                      {pts}
                    </div>
                    <div className="text-[9px] text-[#8A9690]">نقطة</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Live Interactive Simulator */}
        <div className="lg:col-span-5 bg-[#161D1A] border border-[#26312C] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#26312C]">
            <Calculator className="w-4 h-4 text-[#E0B35A]" />
            <h2 className="text-base font-bold text-[#E8EDEA]">
              محاكي الاحتساب الفوري للأسرة
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-[#1C2521] border border-[#26312C] space-y-3">
            <label className="block text-xs font-semibold text-[#8A9690]">
              اختر عدد أفراد الأسرة للتجربة (1 إلى 7 أفراد):
            </label>

            {/* Size selector buttons */}
            <div className="grid grid-cols-7 gap-1.5">
              {familySizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setTestFamilySize(sz)}
                  className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    testFamilySize === sz
                      ? 'bg-[#34C38F] text-[#0F1412] shadow-sm'
                      : 'bg-[#161D1A] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={testFamilySize}
              onChange={(e) => setTestFamilySize(parseInt(e.target.value, 10))}
              className="w-full accent-[#34C38F] cursor-pointer mt-2"
            />
          </div>

          {/* Big Result Card */}
          <div className="p-5 rounded-2xl bg-[#0F1412] border border-[#26312C] text-center space-y-2">
            <div className="text-xs text-[#8A9690] font-medium">
              النقاط المستحقة لأسرة مكونة من {testFamilySize} أفراد:
            </div>
            <div className="text-4xl font-black text-[#E0B35A] tracking-tight">
              {calculatedPoints} <span className="text-base font-normal text-[#8A9690]">نقطة</span>
            </div>
            <div className="text-[11px] text-[#34C38F] font-semibold">
              حساب تلقائي حسب الشرائح المعتمدة
            </div>
          </div>

          {/* Breakdown Explanation */}
          <div className="space-y-2 text-xs">
            <div className="text-[#8A9690] font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#34C38F]" />
              <span>تفصيل عملية الحساب:</span>
            </div>

            <div className="space-y-1.5 bg-[#1C2521] p-3 rounded-xl border border-[#26312C] text-[11px]">
              <div className="flex items-center justify-between">
                <span>الفرد الأول (رب الأسرة):</span>
                <span className="font-bold text-[#E8EDEA]">
                  {activeTiersForSim.tier1} نقطة
                </span>
              </div>
              {testFamilySize >= 2 && (
                <div className="flex items-center justify-between text-[#8A9690]">
                  <span>الفرد الثاني والثالث:</span>
                  <span className="font-bold text-[#E8EDEA]">
                    {Math.min(2, testFamilySize - 1)} × {activeTiersForSim.tier2} ={' '}
                    {Math.min(2, testFamilySize - 1) * activeTiersForSim.tier2} نقطة
                  </span>
                </div>
              )}
              {testFamilySize >= 4 && (
                <div className="flex items-center justify-between text-[#8A9690]">
                  <span>من الفرد 4 إلى {testFamilySize}:</span>
                  <span className="font-bold text-[#E8EDEA]">
                    {testFamilySize - 3} × {activeTiersForSim.tier3} ={' '}
                    {(testFamilySize - 3) * activeTiersForSim.tier3} نقطة
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-[#26312C] flex items-center justify-between font-bold text-[#34C38F]">
                <span>المجموع الكلي:</span>
                <span>{calculatedPoints} نقطة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
