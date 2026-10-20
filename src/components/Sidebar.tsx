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
      {/* Desktop & Tablet Floating Compact Sidebar with Rounded Edges */}
      <aside
        className={`hidden md:flex flex-col my-3.5 mr-3 mb-3.5 bg-[#161D1A]/95 border border-[#26312C] rounded-2xl lg:rounded-3xl shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 z-30 select-none flex-shrink-0 overflow-hidden ${
          isCollapsed ? 'w-14' : 'w-44 lg:w-48'
        }`}
      >
        {/* Toggle Collapse Button */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#26312C]/80">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-[#8A9690] tracking-wider uppercase px-1">
              أقسام المنظومة
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] transition mx-auto md:mx-0 cursor-pointer"
            aria-label={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-bold shadow-sm'
                    : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521] border border-transparent hover:translate-x-[-1px]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between text-right min-w-0">
                    <span className="truncate text-xs">{item.shortLabel || item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 py-0.2 rounded-full bg-[#E0B35A]/20 text-[#E0B35A] font-bold flex-shrink-0 mr-1">
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
          <div className="p-2.5 border-t border-[#26312C]/80 text-center space-y-0.5 bg-[#121815]/50">
            <div className="text-[11px] font-bold text-[#E8EDEA] truncate">جمعية عطاء الخيرية</div>
            <div className="text-[9px] text-[#8A9690] truncate">قرية النسايمة</div>
          </div>
        )}
      </aside>

      {/* Slide-over Drawer from the RIGHT: Floating rounded card */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F1412]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer Sheet: Floating rounded card anchored on the right */}
          <div className="fixed top-2 bottom-2 right-2 w-[calc(100%-1rem)] max-w-xs sm:max-w-sm bg-[#161D1A]/98 border border-[#26312C] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#26312C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#34C38F] to-[#10B981] flex items-center justify-center text-[#0F1412] shadow-md shadow-[#34C38F]/20">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#E8EDEA]">جمعية عطاء الخيرية</div>
                  <div className="text-[10px] text-[#8A9690]">قرية النسايمة</div>
                </div>
              </div>
              <button
                onClick={onCloseMobileDrawer}
                className="p-2 rounded-xl bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
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
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-right cursor-pointer ${
                      isActive
                        ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-bold shadow-sm'
                        : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521] border border-transparent'
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
            <div className="p-3.5 border-t border-[#26312C] bg-[#121815]/80 space-y-1 text-center">
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

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav
        aria-label="شريط التنقل السفلي للهواتف"
        className="md:hidden fixed bottom-2.5 left-2.5 right-2.5 z-40 bg-[#161D1A]/95 border border-[#26312C] rounded-2xl backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl shadow-black/50"
      >
        {/* 1. Dashboard */}
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer min-w-[60px] active:scale-95 ${
            activeTab === 'dashboard' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="الرئيسية"
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">الرئيسية</span>
        </button>

        {/* 2. Beneficiaries */}
        <button
          onClick={() => handleSelectTab('beneficiaries')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer min-w-[60px] active:scale-95 ${
            activeTab === 'beneficiaries' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="المستفيدون"
        >
          <Users className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">المستفيدين</span>
        </button>

        {/* 3. Products */}
        <button
          onClick={() => handleSelectTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer min-w-[60px] active:scale-95 ${
            activeTab === 'products' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="السلع التموينية"
        >
          <Package className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">السلع</span>
        </button>

        {/* 4. Delivery (Highlight action) */}
        <button
          onClick={() => handleSelectTab('delivery')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer min-w-[60px] relative active:scale-95 ${
            activeTab === 'delivery' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="صرف وتسليم"
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          <span className="text-[10px] mt-0.5">الصرف</span>
        </button>
      </nav>
    </>
  );
};
