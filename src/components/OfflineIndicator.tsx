import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#E0B35A] px-4 py-2.5 text-xs font-semibold text-[#0F1412] shadow-2xl animate-fade-in"
    >
      <WifiOff className="w-4 h-4 text-[#0F1412]" />
      <span>وضع عدم الاتصال: يتم استخدام البيانات والذاكرة المحلية المؤقتة.</span>
    </div>
  );
};
