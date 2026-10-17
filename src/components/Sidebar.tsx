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
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

export type ActiveTab =
  | 'dashboard'
  | 'beneficiaries'
  | 'products'
  | 'delivery'
  | 'codes'
  | 'logs'
  | 'staff';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'beneficiaries' as ActiveTab,
      label: 'المستفيدون',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'products' as ActiveTab,
      label: 'السلع والمنتجات',
      icon: Package,
      adminOnly: false,
    },
    {
      id: 'delivery' as ActiveTab,
      label: 'صرف وتسليم',
      icon: ShoppingBag,
      adminOnly: false,
      badge: 'فوري',
    },
    {
      id: 'codes' as ActiveTab,
      label: 'الأكواد الشهرية',
      icon: KeyRound,
      adminOnly: false,
    },
    {
      id: 'logs' as ActiveTab,
      label: 'سجل العمليات والتدقيق',
      icon: ClipboardList,
      adminOnly: false,
    },
    {
      id: 'staff' as ActiveTab,
      label: 'فريق العمل والصلاحيات',
      icon: UserCog,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || userRole === 'admin');

  return (
    <>
      {/* Desktop Right-Side Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#161D1A] border-l border-[#26312C] transition-all duration-300 z-30 select-none ${
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
            className="p-1.5 rounded-xl hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA] transition mx-auto md:mx-0"
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
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#34C38F]/15 text-[#34C38F] border border-[#34C38F]/30 font-semibold shadow-sm'
                    : 'text-[#8A9690] hover:text-[#E8EDEA] hover:bg-[#1C2521]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E0B35A]/20 text-[#E0B35A] font-bold">
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

      {/* Mobile Bottom Navigation Bar (RTL mirrored) */}
      <nav
        aria-label="شريط التنقل السفلي للهواتف"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161D1A]/95 border-t border-[#26312C] backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
      >
        {visibleItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive ? 'text-[#34C38F]' : 'text-[#8A9690]'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}

        {/* If more items, show more or sixth item */}
        {visibleItems.length > 5 && (
          <button
            onClick={() => onSelectTab(visibleItems[5].id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === visibleItems[5].id ? 'text-[#34C38F]' : 'text-[#8A9690]'
            }`}
            title={visibleItems[5].label}
          >
            {React.createElement(visibleItems[5].icon, { className: 'w-5 h-5' })}
            <span className="text-[10px] mt-1 font-medium">{visibleItems[5].label.split(' ')[0]}</span>
          </button>
        )}
      </nav>
    </>
  );
};
