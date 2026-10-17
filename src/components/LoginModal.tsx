import React, { useState } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { StaffAccount } from '../types/index.ts';

interface LoginModalProps {
  onSuccess: (user: StaffAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await dataService.login(username, password);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        setIsLoading(false);
        return;
      }

      onSuccess(res.user);
    } catch {
      setErrorMsg('تعذر الاتصال بخدمة التحقق من الهوية');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1412]/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#161D1A] border border-[#26312C] p-7 md:p-9 shadow-2xl text-[#E8EDEA] animate-fade-in space-y-6">
        {/* Brand Mark */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34C38F] to-[#10B981] text-[#0F1412] flex items-center justify-center mx-auto shadow-xl shadow-[#34C38F]/20">
            <HeartHandshake className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#E8EDEA] tracking-wide">
            جمعية عطاء الخيرية
          </h1>
          <p className="text-xs text-[#8A9690] leading-relaxed">
            بوابة تسجيل دخول الكادر الإداري ومسؤولي الصرف والتسجيل • قرية النسايمة (مقر الجمعية الرئيسي بالقرية)
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#F0707A]/15 border border-[#F0707A]/30 text-[#F0707A] text-xs flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#8A9690] mb-1 font-semibold">
              اسم المستخدم (المعين داخلياً)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin أو tarek_staff"
                className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-3 text-sm text-[#E8EDEA] focus:outline-none focus:border-[#34C38F] transition font-mono pr-10"
              />
              <User className="w-4 h-4 text-[#8A9690] absolute right-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-[#8A9690] mb-1 font-semibold">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1C2521] border border-[#26312C] rounded-xl px-3.5 py-3 text-sm text-[#E8EDEA] focus:outline-none focus:border-[#34C38F] transition font-mono pr-10"
              />
              <Lock className="w-4 h-4 text-[#8A9690] absolute right-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] active:scale-95 text-[#0F1412] font-bold text-sm shadow-lg shadow-[#34C38F]/15 transition flex items-center justify-center gap-2 mt-2"
          >
            <span>{isLoading ? 'جارٍ التحقق...' : 'تسجيل الدخول إلى المنظومة'}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-[#26312C] space-y-2">
          <div className="text-[11px] text-[#8A9690] flex items-center justify-between">
            <span>حسابات تجريبية سريعة:</span>
            <span className="text-[10px] text-[#34C38F] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>جاهزة للنقر</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin', 'admin123')}
              className="p-2.5 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-right transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#E0B35A]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>مدير النظام</span>
              </div>
              <div className="text-[10px] text-[#8A9690] font-mono mt-0.5">admin / admin123</div>
            </button>

            <button
              type="button"
              onClick={() => fillQuickDemo('tarek_staff', 'staff123')}
              className="p-2.5 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-right transition"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#34C38F]">
                <UserCheck className="w-3.5 h-3.5" />
                <span>مسؤول صرف</span>
              </div>
              <div className="text-[10px] text-[#8A9690] font-mono mt-0.5">
                tarek_staff / staff123
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
