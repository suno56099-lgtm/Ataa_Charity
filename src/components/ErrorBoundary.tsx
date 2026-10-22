import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, DatabaseBackup } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear all ataa keys to recover from corrupted client data
        Object.keys(window.localStorage).forEach((key) => {
          if (key.startsWith('ataa_')) {
            window.localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#0F1412] text-[#E8EDEA] flex items-center justify-center p-4 font-['Cairo',sans-serif]"
        >
          <div className="max-w-md w-full bg-[#161D1A] border border-[#26312C] rounded-2xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#F0707A]/15 text-[#F0707A] flex items-center justify-center mx-auto border border-[#F0707A]/30 shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#E8EDEA]">
                حدث استثناء غير متوقع في العرض
              </h1>
              <p className="text-xs text-[#8A9690] leading-relaxed">
                تم احتواء الخطأ تلقائياً لمنع ظهور الشاشة البيضاء. يمكنك إعادة تحميل الصفحة، أو إصلاح البيانات المؤقتة واستعادة الإعدادات السليمة بنقرة واحدة.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الصفحة الآن</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1C2521] hover:bg-[#26312C] border border-[#26312C] text-[#E0B35A] font-semibold text-xs transition active:scale-95 cursor-pointer"
              >
                <DatabaseBackup className="w-4 h-4" />
                <span>إصلاح البيانات واستعادة الوضع الافتراضي</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-right text-[11px] text-[#8A9690] bg-[#121815] p-3 rounded-xl border border-[#26312C]/60 overflow-x-auto">
                <summary className="cursor-pointer font-medium text-[#A6B2AC]">تفاصيل تقنية للتشخيص</summary>
                <p className="mt-2 text-[#F0707A] font-mono text-[10px] break-all">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
