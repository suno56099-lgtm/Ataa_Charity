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
  Menu,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { UserRole, StaffAccount } from '../types/index.ts';
import { cleanPersonName } from '../utils/egyptianValidation.ts';

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
  currentUser?: StaffAccount | null;
  onLogout?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onOpenMobileDrawer?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly: boolean;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  onOpenMobileDrawer,
}) => {
  const navItems: NavItem[] = [
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
      label: 'صرف وتسليم المستفيد',
      shortLabel: 'الصرف',
      icon: ShoppingBag,
      adminOnly: false,
    },
    {
      id: 'codes' as ActiveTab,
      label: 'الأكواد الشهرية',
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

      {/* Slide-over Drawer from the LEFT in phone mode: Floating rounded card */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F1412]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer Sheet: Compact floating rounded card anchored on the left */}
          <div className="fixed top-2 bottom-2 left-2 w-52 max-w-[65vw] sm:w-60 bg-[#161D1A]/98 border border-[#26312C] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl animate-slide-in-left">
            {/* Drawer Header */}
            <div className="p-3 border-b border-[#26312C] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#34C38F] to-[#10B981] flex items-center justify-center text-[#0F1412] shadow-sm shadow-[#34C38F]/20 flex-shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#E8EDEA] truncate">جمعية عطاء الخيرية</div>
                  <div className="text-[9px] text-[#8A9690] truncate">قرية النسايمة</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-1.5 rounded-lg bg-[#1C2521] border border-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer flex-shrink-0"
                aria-label="إغلاق القائمة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* All Tabs Navigation */}
            <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              <div className="text-[10px] font-semibold text-[#8A9690] px-2 py-1 uppercase tracking-wider">
                أقسام المنظومة
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-right cursor-pointer ${
                      isActive
                        ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-bold shadow-sm'
                        : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#E0B35A]/20 text-[#E0B35A] font-bold flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[#34C38F] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* User Info & Logout inside Drawer for mobile convenience */}
            {currentUser && (
              <div className="p-2.5 border-t border-[#26312C] bg-[#1C2521]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#26312C] flex items-center justify-center flex-shrink-0">
                      {currentUser.role === 'admin' ? (
                        <ShieldCheck className="w-4 h-4 text-[#E0B35A]" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-[#34C38F]" />
                      )}
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-xs font-bold text-[#E8EDEA] truncate">
                        {cleanPersonName(currentUser.fullName) || currentUser.username}
                      </div>
                      <div className="text-[10px] text-[#8A9690] truncate">
                        {currentUser.role === 'admin' ? 'مدير النظام' : 'مسؤول صرف'}
                      </div>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onCloseMobileDrawer) onCloseMobileDrawer();
                        onLogout();
                      }}
                      className="p-1.5 rounded-lg bg-[#26312C] text-[#8A9690] hover:text-[#F0707A] hover:bg-[#F0707A]/15 active:scale-95 transition cursor-pointer flex-shrink-0"
                      title="تسجيل الخروج"
                      aria-label="تسجيل الخروج"
                    >
                      <LogOut className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Drawer Village Notice */}
            <div className="p-2 border-t border-[#26312C] bg-[#121815]/80 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] text-[#8A9690]">
                <MapPin className="w-3 h-3 text-[#34C38F] flex-shrink-0" />
                <span className="truncate">قرية النسايمة • عطاء 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav
        aria-label="شريط التنقل السفلي للهواتف"
        className="md:hidden fixed bottom-2 left-2 right-2 z-40 bg-[#161D1A]/95 border border-[#26312C] rounded-2xl backdrop-blur-xl px-1.5 py-1 flex items-center justify-around shadow-2xl shadow-black/50"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer flex-1 min-w-0 active:scale-95 ${
            activeTab === 'dashboard' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="الرئيسية"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate">الرئيسية</span>
        </button>

        {/* 2. Beneficiaries */}
        <button
          type="button"
          onClick={() => handleSelectTab('beneficiaries')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer flex-1 min-w-0 active:scale-95 ${
            activeTab === 'beneficiaries' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="المستفيدون"
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate">المستفيدين</span>
        </button>

        {/* 3. Products */}
        <button
          type="button"
          onClick={() => handleSelectTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer flex-1 min-w-0 active:scale-95 ${
            activeTab === 'products' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="السلع التموينية"
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate">السلع</span>
        </button>

        {/* 4. Delivery */}
        <button
          type="button"
          onClick={() => handleSelectTab('delivery')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer flex-1 min-w-0 relative active:scale-95 ${
            activeTab === 'delivery' ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="صرف وتسليم"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate">الصرف</span>
        </button>

        {/* 5. More / Drawer */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer flex-1 min-w-0 active:scale-95 ${
            isMobileDrawerOpen ? 'text-[#34C38F] font-bold' : 'text-[#8A9690] hover:text-[#E8EDEA]'
          }`}
          title="المزيد من الأقسام"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate">المزيد</span>
        </button>
      </nav>
    </>
  );
};
