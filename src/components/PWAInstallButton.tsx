import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-[#34C38F] px-3.5 py-1.5 text-xs font-semibold text-[#0F1412] shadow-md hover:bg-[#2bb27f] active:scale-95 transition"
        title="تثبيت تطبيق جمعية عطاء على جهازك"
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-[#26312C] bg-[#161D1A] px-3 py-1.5 text-xs font-medium text-[#E8EDEA] hover:bg-[#1C2521] active:scale-95 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-[#34C38F]" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#161D1A] border border-[#26312C] p-6 shadow-2xl text-[#E8EDEA]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#E8EDEA]">تثبيت تطبيق عطاء على iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-[#1C2521] text-[#8A9690] hover:text-[#E8EDEA]"
                  aria-label="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#8A9690] leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center font-bold text-[11px]">1</span>
                  <span>اضغط على زر المشاركة <strong className="text-[#E8EDEA]">مشاركة (Share)</strong> في شريط متصفح سفاري بالأسفل.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center font-bold text-[11px]">2</span>
                  <span>مرر القائمة لأسفل ثم اختر <strong className="text-[#E8EDEA]">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#1C2521] hover:bg-[#26312C] py-2 text-xs font-semibold text-[#E8EDEA] transition"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
