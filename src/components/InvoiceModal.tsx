import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Receipt,
  FileText,
  Clock,
  Phone,
  Coins,
  Store,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { DeliveryRecord } from '../types/index.ts';
import { toPng } from 'html-to-image';

interface InvoiceModalProps {
  delivery: DeliveryRecord | null;
  onClose: () => void;
  isNewDeliverySuccess?: boolean;
  onNewDelivery?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  delivery,
  onClose,
  isNewDeliverySuccess = false,
  onNewDelivery,
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal58' | 'a5'>('thermal58');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!delivery) return null;

  const voucherValue = delivery.balanceBefore;
  const invoiceTotal = delivery.totalPoints;
  const remainingPoints = delivery.expired_points ?? delivery.balanceAfter;

  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(delivery.createdAt));

  const shortDate = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(delivery.createdAt));

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsImage = async () => {
    if (!invoiceRef.current || isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Allow DOM to settle, then capture with clean independent white background
      const dataUrl = await toPng(invoiceRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          margin: '0',
          boxShadow: 'none',
        },
      });

      const link = document.createElement('a');
      link.download = `فاتورة-جمعية-عطاء-${delivery.deliveryCode}-${delivery.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export invoice image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto animate-fade-in no-print-backdrop">
      <div className="relative w-full max-w-2xl bg-[#161D1A] border border-[#26312C] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#26312C] bg-[#1C2521] no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#E8EDEA]">
                {isNewDeliverySuccess ? 'فاتورة صرف الحصة التموينية' : 'استعراض فاتورة الصرف'}
              </h2>
              <span className="text-[11px] text-[#8A9690]">
                كود العملية: {delivery.deliveryCode} • رقم المعاملة: #{delivery.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Switcher */}
            <div className="hidden sm:flex items-center bg-[#161D1A] border border-[#26312C] rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  printFormat === 'thermal58'
                    ? 'bg-[#34C38F] text-[#0F1412] font-bold shadow-sm'
                    : 'text-[#8A9690] hover:text-[#E8EDEA]'
                }`}
              >
                طابعة حرارية (58mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  printFormat === 'a5'
                    ? 'bg-[#34C38F] text-[#0F1412] font-bold shadow-sm'
                    : 'text-[#8A9690] hover:text-[#E8EDEA]'
                }`}
              >
                فاتورة كاملة (A5)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner if newly delivered */}
        {isNewDeliverySuccess && (
          <div className="bg-[#34C38F]/15 border-b border-[#34C38F]/30 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-[#34C38F] no-print">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>تم إتمام وتأكيد تسليم الحصة بنجاح وحفظ السجل ذرّياً</span>
            </div>
            <span className="hidden sm:inline text-[11px] text-[#8A9690]">
              جاهزة للطباعة أو الإرسال
            </span>
          </div>
        )}

        {/* Scrollable Printable Area Container */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-[#0F1412]">
          {/* THE INVOICE (White Background Independent of Dark Theme for Printing & Image Export) */}
          <div
            id="charity-receipt"
            ref={invoiceRef}
            className={`w-full bg-white text-black p-4 sm:p-6 rounded-xl shadow-lg border border-gray-300 transition-all font-['Cairo',sans-serif] ${
              printFormat === 'thermal58'
                ? 'max-w-[320px] text-[11px] leading-snug font-mono select-text print-thermal-58'
                : 'max-w-[500px] text-xs leading-normal select-text print-a5'
            }`}
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          >
            {/* 1. Header: Association Name & Info */}
            <div className="text-center pb-3 border-b-2 border-dashed border-black space-y-1">
              <div className="inline-block px-2.5 py-0.5 rounded border border-black font-extrabold text-sm sm:text-base tracking-wide bg-gray-50">
                جمعية عطاء
              </div>
              <div className="text-[11px] font-bold text-gray-800">
                مشروع المساعدات والدعم التمويني الذكي
              </div>
              <div className="text-[9px] text-gray-600">
                قرية النسايمة • هاتف الجمعية: 01012345678
              </div>
              <div className="text-[10px] font-semibold text-gray-700 pt-0.5">
                فاتورة تسليم حصة تموينية معتمدة
              </div>
            </div>

            {/* 2. Metadata Box: Invoice Date, Time, Invoice Number, Beneficiary info */}
            <div className="my-2.5 py-2 px-2.5 border border-dashed border-black rounded bg-gray-50/70 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">رقم الفاتورة:</span>
                <strong className="font-mono font-bold text-black">
                  #{delivery.id.slice(0, 10).toUpperCase()}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">التاريخ والوقت:</span>
                <span className="font-mono text-[10px] text-black">
                  {shortDate}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-300 my-1"></div>

              {/* Beneficiary Details: Name, Phone, Code (NO National ID) */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">اسم المستفيد:</span>
                <strong className="font-bold text-black">{delivery.beneficiaryName}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">رقم الهاتف:</span>
                <span className="font-mono text-black">{delivery.beneficiaryPhone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">كود الاستلام:</span>
                <span className="font-mono font-black text-sm text-black tracking-wider px-1.5 py-0.5 bg-black text-white rounded">
                  {delivery.deliveryCode}
                </span>
              </div>

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-gray-700">مسؤول الصرف:</span>
                <span className="font-semibold text-black">{delivery.staffName}</span>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="py-2 border-b-2 border-dashed border-black">
              <div className="font-bold text-[10px] text-gray-700 pb-1">الأصناف المسلمة:</div>
              <table className="w-full text-right text-[10px] sm:text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-black text-black font-bold">
                    <th className="pb-1 text-right">الصنف</th>
                    <th className="pb-1 text-center">السعر</th>
                    <th className="pb-1 text-center">الكمية</th>
                    <th className="pb-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-gray-300 text-black">
                  {delivery.items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="py-1 text-right font-medium">{item.productName}</td>
                      <td className="py-1 text-center font-mono">{item.unitPoints}ن</td>
                      <td className="py-1 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-1 text-left font-mono font-bold">{item.subtotalPoints}ن</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Voucher Value, Invoice Total, and Remaining Points */}
            <div className="my-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-700">قيمة القسيمة (رصيد الأسرة):</span>
                <span className="font-mono font-bold text-black text-xs">
                  {voucherValue} نقطة
                </span>
              </div>

              <div className="flex justify-between items-center py-1 px-1.5 bg-gray-100 rounded border border-black font-extrabold text-xs">
                <span>إجمالي الفاتورة (المصروف):</span>
                <span className="font-mono text-black text-sm">
                  {invoiceTotal} نقطة
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 text-gray-800">
                <span>النقاط المتبقية (منتهية الصلاحية):</span>
                <span className="font-mono font-extrabold text-black text-xs">
                  {remainingPoints} نقطة
                </span>
              </div>

              <div className="text-[9px] text-gray-500 text-center italic pt-0.5">
                * ملاحظة: النقاط المتبقية بعد التسليم تنتهي صلاحيتها ولا ترحل للشهر القادم
              </div>
            </div>

            {/* 5. Barcode & Verification Footer */}
            <div className="pt-2 text-center border-t-2 border-dashed border-black space-y-1">
              <div className="font-mono text-[10px] tracking-widest select-none leading-none opacity-80 pt-1">
                |||||| | |||| |||||| | ||||| || |||||| | ||||
              </div>
              <div className="text-[9px] font-mono text-gray-600">
                معاملة ذرية موثقة برقم #{delivery.deliveryCode}
              </div>
              <div className="text-[10px] font-bold text-black pt-1">
                جمعية عطاء • جزاكم الله خيراً
              </div>
              <div className="text-[8px] text-gray-500">
                يرجى الاحتفاظ بهذه الفاتورة كإثبات استلام رسمي
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons (Hidden in Print) */}
        <div className="p-3 sm:p-5 border-t border-[#26312C] bg-[#1C2521] flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#34C38F] hover:bg-[#2bb27f] text-[#0F1412] text-xs font-bold transition shadow-md cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>

            {/* Save as Image Button */}
            <button
              type="button"
              onClick={handleSaveAsImage}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#161D1A] border border-[#26312C] hover:bg-[#26312C] text-[#E8EDEA] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#34C38F]" />
              <span>{isExporting ? 'جاري التصدير...' : exportSuccess ? 'تم الحفظ بنجاح!' : 'حفظ كصورة'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isNewDeliverySuccess && onNewDelivery && (
              <button
                type="button"
                onClick={onNewDelivery}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#1C2521] border border-[#34C38F]/40 text-[#34C38F] hover:bg-[#34C38F]/10 text-xs font-bold transition cursor-pointer text-center"
              >
                تسليم حصة جديدة
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] text-xs font-medium transition cursor-pointer text-center"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
