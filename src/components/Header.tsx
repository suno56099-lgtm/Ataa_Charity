import React from 'react';
import { HeartHandshake, LogOut, ShieldCheck, UserCheck, Clock } from 'lucide-react';
import { StaffAccount } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  currentUser: StaffAccount | null;
  onLogout: () => void;
  inactivitySecondsRemaining: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  inactivitySecondsRemaining,
}) => {
  const isNearTimeout = inactivitySecondsRemaining <= 120; // 2 minutes or less

  return (
    <header className="sticky top-0 z-40 w-full bg-[#161D1A]/95 border-b border-[#26312C] px-4 lg:px-8 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34C38F] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#34C38F]/20 text-[#0F1412]">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-wide text-[#E8EDEA]">
              جمعية عطاء الخيرية
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Inactivity warning badge if close */}
          {isNearTimeout && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0B35A]/15 border border-[#E0B35A]/30 text-[#E0B35A] text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>انتهاء الجلسة بعد: {inactivitySecondsRemaining} ثانية</span>
            </div>
          )}

          {/* Install Button */}
          <PWAInstallButton />

          {/* Current User Card */}
          {currentUser && (
            <div className="flex items-center gap-2.5 bg-[#1C2521] border border-[#26312C] rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#26312C] flex items-center justify-center text-[#34C38F]">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-[#E0B35A]" />
                ) : (
                  <UserCheck className="w-4 h-4 text-[#34C38F]" />
                )}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-[#E8EDEA]">{currentUser.fullName}</div>
                <div className="text-[10px] text-[#8A9690]">
                  {currentUser.role === 'admin' ? 'مدير النظام' : 'مسؤول صرف وتسجيل'}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-[#26312C] text-[#8A9690] hover:text-[#F0707A] transition"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج من المنظومة"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
