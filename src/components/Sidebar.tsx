import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  KeyRound,
  ClipboardList,
  UserCog,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Grid,
  X,
  MapPin,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

export type ActiveTab =
  | 'dashboard'
  | 'beneficiaries'
  | 'products'
  | 'delivery'
  | 'codes'
  | 'calculator'
  | 'logs'
  | 'staff';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onOpenMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isCollapsed,
  onToggleCollapse,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  onOpenMobileDrawer,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'لوحة التحكم',
      shortLabel: 'الرئيسية',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'beneficiaries' as ActiveTab,
      label: 'سجل المستفيدين',
      shortLabel: 'المستفيدين',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'products' as ActiveTab,
      label: 'السلع والمنتجات',
      shortLabel: 'السلع',
      icon: Package,
      adminOnly: false,
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'صرف وتسليم فوري',
      shortLabel: 'الصرف',
      icon: ShoppingBag,
      adminOnly: false,
      badge: 'فوري',
    },
    {
      id: 'codes' as ActiveTab,
      label: 'الأكواد الشهرية (OTP)',
      shortLabel: 'الأكواد',
      icon: KeyRound,
      adminOnly: false,
    },
    {
      id: 'calculator' as ActiveTab,
      label: 'حاسبة وشرائح النقاط',
      shortLabel: 'الحاسبة',
      icon: Calculator,
      adminOnly: false,
      badge: 'آلي',
    },
    {
      id: 'logs' as ActiveTab,
      label: 'سجل العمليات والتدقيق',
      shortLabel: 'السجل',
      icon: ClipboardList,
      adminOnly: false,
    },
    {
      id: 'staff' as ActiveTab,
      label: 'فريق العمل والصلاحيات',
      shortLabel: 'الموظفون',
      icon: UserCog,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || userRole === 'admin');

  // Check if active tab is one of the secondary tabs
  const primaryMobileIds: ActiveTab[] = ['dashboard', 'beneficiaries', 'products', 'delivery'];
  const isSecondaryActive = !primaryMobileIds.includes(activeTab);

  const handleSelectTab = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#161D1A] border-l border-[#26312C] transition-all duration-300 z-30 select-none flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-[#26312C]">
          {!isCollapsed && (
            <span className="text-xs font-semibold text-[#8A9690] tracking-wider uppercase">
              أقسام المنظومة
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] transition mx-auto md:mx-0 cursor-pointer"
            aria-label={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-semibold shadow-sm'
                    : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between text-right">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E0B35A]/20 text-[#E0B35A] font-bold flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Association Footer Note */}
        {!isCollapsed && (
          <div className="p-4 border-t border-[#26312C] text-center space-y-1">
            <div className="text-xs font-bold text-[#E8EDEA]">جمعية عطاء الخيرية</div>
            <div className="text-[10px] text-[#8A9690]">خدمة أهالي قرية النسايمة</div>
            <div className="text-[10px] text-[#E0B35A]">منفذ التوزيع: مقر الجمعية الرئيسي بالقرية</div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer (Slide-over from Right in RTL) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F1412]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-[#161D1A] border-r border-[#26312C] h-full shadow-2xl flex flex-col z-10 animate-fade-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#26312C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#34C38F] to-[#10B981] flex items-center justify-center text-[#0F1412]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#E8EDEA]">جمعية عطاء الخيرية</div>
                  <div className="text-[10px] text-[#8A9690]">قرية النسايمة</div>
                </div>
              </div>
              <button
                onClick={onCloseMobileDrawer}
                className="p-2 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* All Tabs Navigation */}
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="text-[11px] font-semibold text-[#8A9690] px-3 py-1 uppercase tracking-wider">
                جميع أقسام المنظومة
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition text-right cursor-pointer ${
                      isActive
                        ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-bold'
                        : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0B35A]/20 text-[#E0B35A] font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[#34C38F]" />}
                  </button>
                );
              })}
            </div>

            {/* Drawer Village Notice */}
            <div className="p-4 border-t border-[#26312C] bg-[#121815] space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#34C38F]">
                <MapPin className="w-3.5 h-3.5" />
                <span>منفذ توزيع قرية النسايمة</span>
              </div>
              <p className="text-[10px] text-[#8A9690]">
                منظومة الدعم الذكية للأسر المستحقة بقرية النسايمة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (RTL friendly, safe area padded) */}
      <nav
        aria-label="شريط التنقل السفلي للهواتف"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161D1A]/95 border-t border-[#26312C] backdrop-blur-lg px-2 pt-1 pb-safe flex items-center justify-around shadow-2xl"
      >
        {/* 1. Dashboard */}
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer min-w-[56px] ${
            activeTab === 'dashboard' ? 'text-[#34C38F]' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="لوحة التحكم"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">الرئيسية</span>
        </button>

        {/* 2. Beneficiaries */}
        <button
          onClick={() => handleSelectTab('beneficiaries')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer min-w-[56px] ${
            activeTab === 'beneficiaries' ? 'text-[#34C38F]' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="المستفيدون"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">المستفيدين</span>
        </button>

        {/* 3. Products */}
        <button
          onClick={() => handleSelectTab('products')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer min-w-[56px] ${
            activeTab === 'products' ? 'text-[#34C38F]' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="السلع التموينية"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">السلع</span>
        </button>

        {/* 4. Delivery (Highlight action) */}
        <button
          onClick={() => handleSelectTab('delivery')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer min-w-[56px] relative ${
            activeTab === 'delivery' ? 'text-[#34C38F]' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="صرف وتسليم"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">الصرف</span>
        </button>

        {/* 5. More / All Tabs */}
        <button
          onClick={() => onOpenMobileDrawer && onOpenMobileDrawer()}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer min-w-[56px] relative ${
            isSecondaryActive ? 'text-[#34C38F]' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="المزيد من الأقسام"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold">المزيد</span>
          {isSecondaryActive && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-[#34C38F] ring-2 ring-[#161D1A]" />
          )}
        </button>
      </nav>
    </>
  );
};
