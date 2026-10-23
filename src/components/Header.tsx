import React from 'react';
import { HeartHandshake, LogOut, ShieldCheck, UserCheck, Clock } from 'lucide-react';
import { StaffAccount } from '../types/index.ts';
import { cleanPersonName } from '../utils/egyptianValidation.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  currentUser: StaffAccount | null;
  onLogout: () => void;
  inactivitySecondsRemaining: number;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  inactivitySecondsRemaining,
}) => {
  const isNearTimeout = inactivitySecondsRemaining <= 120; // 2 minutes or less

  return (
    <header className="sticky top-0 z-40 w-full bg-[#161D1A]/95 border-b border-[#26312C] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 backdrop-blur-md">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Right side in RTL: Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#34C38F] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#34C38F]/20 text-[#0F1412] flex-shrink-0">
            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg md:text-xl font-extrabold tracking-wide text-[#E8EDEA] truncate">
              جمعية عطاء الخيرية
            </div>
            <div className="text-[10px] sm:text-xs text-[#8A9690] truncate hidden xs:block">
              قرية النسايمة • منظومة الدعم التمويني
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Inactivity warning badge if close */}
          {isNearTimeout && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>انتهاء الجلسة: {inactivitySecondsRemaining}ث</span>
            </div>
          )}

          {/* Install Button (hidden on phone to give space to user name) */}
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Current User Card: Displayed consistently on phone & computer */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#1C2521] border border-[#26312C] hover:border-[#34C38F]/40 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-1.5 transition-all shadow-sm">
              {/* User Avatar / Role Icon */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#26312C] flex items-center justify-center flex-shrink-0">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E0B35A]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#34C38F]" />
                )}
              </div>

              {/* User Name & Role: Visible on Phone & Computer */}
              <div className="text-right min-w-0">
                <div className="text-[11px] sm:text-xs font-bold text-[#E8EDEA] max-w-[90px] xs:max-w-[130px] sm:max-w-[170px] truncate leading-tight">
                  {cleanPersonName(currentUser.fullName) || currentUser.username}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#8A9690] leading-none mt-0.5 flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${
                      currentUser.role === 'admin' ? 'bg-[#E0B35A]' : 'bg-[#34C38F]'
                    }`}
                  />
                  <span className="truncate">
                    {currentUser.role === 'admin' ? 'مدير النظام' : 'مسؤول صرف'}
                  </span>
                </div>
              </div>

              {/* Vertical Separator */}
              <div className="h-4 sm:h-5 w-px bg-[#26312C] mx-0.5 sm:mx-1 flex-shrink-0" />

              {/* Logout Button: Right next to the user name */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg text-[#8A9690] hover:text-[#F0707A] hover:bg-[#F0707A]/15 active:scale-95 transition flex-shrink-0 cursor-pointer group"
                title="تسجيل الخروج من المنظومة"
                aria-label="تسجيل الخروج من المنظومة"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline text-xs font-semibold">خروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
