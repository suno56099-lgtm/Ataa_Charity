import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Edit2,
  Check,
} from 'lucide-react';
import { DeliveryRecord } from '../types/index.ts';
import { dataService } from '../services/dataService.ts';
import { toPng } from 'html-to-image';

interface InvoiceModalProps {
  delivery: DeliveryRecord | null;
  onClose: () => void;
  isNewDeliverySuccess?: boolean;
  onNewDelivery?: () => void;
  isInline?: boolean;
}

/**
 * Format date & time with Western digits and Arabic AM/PM:
 * e.g. "19/10/2026 05:13 م"
 */
export function formatWesternDateTime(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${period}`;
}

/**
 * Clean staff name to show staff member's name ONLY:
 * Strips role designations like " (مدير النظام)", "المدير العام", etc.
 */
export function getCleanStaffName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/المدير العام|مدير النظام|مسؤول صرف|مسؤول الصرف/g, '')
    .trim() || rawName;
}

/**
 * High-fidelity HTML Canvas fallback generator.
 * Produces the exact clean invoice layout matching User Request 5 with white background.
 */
function generateInvoiceCanvasDataUrl(
  delivery: DeliveryRecord,
  associationPhone: string
): string {
  const canvas = document.createElement('canvas');
  const width = 600;
  const itemsCount = delivery.items.length;
  const height = 620 + itemsCount * 32;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Solid Pure White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // 2. Header: ONLY "جمعية عطاء الخيرية"
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('جمعية عطاء الخيرية', width / 2, 55);

  // Small gray line under header: "فاتورة تسليم"
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('فاتورة تسليم', width / 2, 78);

  // Association phone number under header
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText(`هاتف الجمعية: ${associationPhone}`, width / 2, 98);

  // Thin gray divider line
  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.moveTo(35, 115);
  ctx.lineTo(width - 35, 115);
  ctx.stroke();

  // 3. Details Block (Plain text, NO colored boxes, NO black rectangles)
  const formattedDate = formatWesternDateTime(delivery.createdAt);
  const cleanStaff = getCleanStaffName(delivery.staffName);
  const invoiceNum = `#${delivery.id.slice(0, 10).toUpperCase()}`;

  let y = 145;
  const drawDetailRow = (label: string, value: string, isBoldValue = false) => {
    ctx.textAlign = 'right';
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(label, width - 40, y);

    ctx.textAlign = 'left';
    ctx.font = isBoldValue ? 'bold 13px sans-serif' : '13px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(value, 40, y);
    y += 24;
  };

  drawDetailRow('رقم الفاتورة:', invoiceNum);
  drawDetailRow('التاريخ والوقت:', formattedDate);
  drawDetailRow('اسم المستفيد:', delivery.beneficiaryName, true);
  drawDetailRow('رقم الهاتف:', delivery.beneficiaryPhone);
  drawDetailRow('كود الاستلام:', delivery.deliveryCode, true); // normal bold text
  drawDetailRow('مسؤول الصرف:', cleanStaff);

  // Divider before table
  y += 6;
  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb';
  ctx.moveTo(35, y);
  ctx.lineTo(width - 35, y);
  ctx.stroke();

  // 4. Items table header (الصنف, السعر, الكمية, الإجمالي)
  y += 24;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('الصنف', width - 40, y);
  ctx.textAlign = 'center';
  ctx.fillText('السعر', width - 260, y);
  ctx.fillText('الكمية', width - 360, y);
  ctx.textAlign = 'left';
  ctx.fillText('الإجمالي', 40, y);

  y += 8;
  ctx.beginPath();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.moveTo(35, y);
  ctx.lineTo(width - 35, y);
  ctx.stroke();

  // Items rows - Plain numbers only (no currency symbol or unit)
  ctx.font = '13px sans-serif';
  delivery.items.forEach((item) => {
    y += 26;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#000000';
    ctx.fillText(item.productName, width - 40, y);
    ctx.textAlign = 'center';
    ctx.fillText(`${item.unitPoints}`, width - 260, y);
    ctx.fillText(`${item.quantity}`, width - 360, y);
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${item.subtotalPoints}`, 40, y);
    ctx.font = '13px sans-serif';

    y += 6;
    ctx.beginPath();
    ctx.strokeStyle = '#f3f4f6';
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();
  });

  // Divider before totals
  y += 14;
  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb';
  ctx.moveTo(35, y);
  ctx.lineTo(width - 35, y);
  ctx.stroke();

  // 5. Totals
  const voucherValue = delivery.balanceBefore;
  const invoiceTotal = delivery.totalPoints;
  const remainingPoints = delivery.expired_points ?? delivery.balanceAfter;

  y += 24;
  ctx.textAlign = 'right';
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText('قيمة القسيمة (رصيد الأسرة):', width - 40, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = '13px sans-serif';
  ctx.fillText(`${voucherValue}`, 40, y);

  // Emphasized line: إجمالي الفاتورة (المصروف)
  y += 26;
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('إجمالي الفاتورة (المصروف):', width - 40, y);
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${invoiceTotal}`, 40, y);

  y += 26;
  ctx.textAlign = 'right';
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText('النقاط المتبقية:', width - 40, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = '13px sans-serif';
  ctx.fillText(`${remainingPoints}`, 40, y);

  // 6. Short note under totals
  y += 28;
  ctx.textAlign = 'center';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('النقاط المتبقية تنتهي صلاحيتها بعد التسليم ولا ترحل للشهر القادم', width / 2, y);

  // Divider
  y += 14;
  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb';
  ctx.moveTo(35, y);
  ctx.lineTo(width - 35, y);
  ctx.stroke();

  // 7. Bottom: ONLY "يرجى الاحتفاظ بهذه الفاتورة كإثبات استلام رسمي"
  y += 24;
  ctx.textAlign = 'center';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#374151';
  ctx.fillText('يرجى الاحتفاظ بهذه الفاتورة كإثبات استلام رسمي', width / 2, y);

  return canvas.toDataURL('image/png');
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  delivery,
  onClose,
  isNewDeliverySuccess = false,
  onNewDelivery,
  isInline = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Association phone state (admin can edit from settings)
  const [associationPhone, setAssociationPhone] = useState<string>(() =>
    dataService.getAssociationPhone()
  );
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState(associationPhone);

  const currentUser = dataService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (!delivery) return null;

  const voucherValue = delivery.balanceBefore;
  const invoiceTotal = delivery.totalPoints;
  const remainingPoints = delivery.expired_points ?? delivery.balanceAfter;
  const formattedDateTime = formatWesternDateTime(delivery.createdAt);
  const cleanStaffName = getCleanStaffName(delivery.staffName);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = dataService.updateAssociationPhone(newPhoneInput);
    if (res.success) {
      setAssociationPhone(newPhoneInput.trim());
      setIsEditingPhone(false);
    }
  };

  const handleSaveAsImage = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      let dataUrl: string | null = null;

      // 1. Try html-to-image with skipFonts to avoid iframe sandboxing issues
      if (invoiceRef.current) {
        try {
          dataUrl = await toPng(invoiceRef.current, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            skipFonts: true,
            cacheBust: true,
          });
        } catch (e) {
          console.warn('html-to-image fallback to direct Canvas renderer:', e);
        }
      }

      // 2. Guaranteed fallback to direct HTML5 Canvas renderer with exact same layout
      if (!dataUrl) {
        dataUrl = generateInvoiceCanvasDataUrl(delivery, associationPhone);
      }

      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `فاتورة-تسليم-${delivery.deliveryCode}-${delivery.id.slice(0, 8)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to export invoice image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const content = (
    <div
      className={`w-full max-w-2xl bg-[#161D1A] border border-[#26312C] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
        isInline ? 'mx-auto my-4' : 'max-h-[95vh]'
      }`}
    >
      {/* Top Bar (Hidden in Print) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#26312C] bg-[#1C2521] no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#34C38F]/20 text-[#34C38F] flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#E8EDEA]">
              {isNewDeliverySuccess ? 'فاتورة تسليم الحصة التموينية' : 'استعراض فاتورة التسليم'}
            </h2>
            <span className="text-[11px] text-[#8A9690]">
              كود الاستلام: {delivery.deliveryCode} • رقم الفاتورة: #{delivery.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Bar if newly delivered */}
      {isNewDeliverySuccess && (
        <div className="bg-[#34C38F]/15 border-b border-[#34C38F]/30 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-[#34C38F] no-print">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>تم تأكيد التسليم بنجاح وإصدار الفاتورة الرسمية</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-[#8A9690]">
            جاهزة للطباعة أو التصدير كصورة
          </span>
        </div>
      )}

      {/* Scrollable Printable Area Container */}
      <div className="p-3 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-[#0F1412]">
        {/*
          THE INVOICE
          Layout strictly per specification:
          1. Header: "جمعية عطاء الخيرية" as the only title
          2. Small gray line under header: "فاتورة تسليم"
          3. Phone number line under header (editable from settings)
          4. Details block (plain text, NO colored boxes):
             - رقم الفاتورة
             - التاريخ والوقت (format 19/10/2026 05:13 م, Western digits)
             - اسم المستفيد
             - رقم الهاتف
             - كود الاستلام (normal bold text, NO black box)
             - مسؤول الصرف (name ONLY)
          5. Items table: الصنف, السعر, الكمية, الإجمالي (plain numbers, no symbols)
          6. Totals:
             - قيمة القسيمة (رصيد الأسرة)
             - إجمالي الفاتورة (المصروف) as emphasized line
             - النقاط المتبقية
          7. Short note: "النقاط المتبقية تنتهي صلاحيتها بعد التسليم ولا ترحل للشهر القادم"
          8. Bottom: ONLY "يرجى الاحتفاظ بهذه الفاتورة كإثبات استلام رسمي"
        */}
        <div
          id="charity-receipt"
          ref={invoiceRef}
          className="w-full max-w-[480px] bg-white text-black p-5 sm:p-7 rounded-xl shadow-lg border border-gray-200 transition-all font-['Cairo',sans-serif] select-text print-thermal-58"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        >
          {/* 1. Header: "جمعية عطاء الخيرية" as the ONLY title */}
          <div className="text-center pb-2.5 space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-wide">
              جمعية عطاء الخيرية
            </h1>

            {/* 2. Small gray line under the header: "فاتورة تسليم" */}
            <div className="text-xs sm:text-sm font-semibold text-gray-500">
              فاتورة تسليم
            </div>

            {/* 3. Small line with association phone number (editable from settings) */}
            <div className="text-[11px] sm:text-xs text-gray-600 flex items-center justify-center gap-1.5 pt-0.5">
              <span>هاتف الجمعية:</span>
              <span className="font-mono">{associationPhone}</span>

              {/* Admin quick inline edit toggle (hidden in print) */}
              {isAdmin && !isEditingPhone && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPhoneInput(associationPhone);
                    setIsEditingPhone(true);
                  }}
                  className="p-0.5 rounded text-gray-400 hover:text-black no-print transition"
                  title="تعديل هاتف الجمعية"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Admin phone edit form (hidden in print) */}
            {isEditingPhone && (
              <form
                onSubmit={handleSavePhone}
                className="flex items-center justify-center gap-1.5 pt-1 no-print"
              >
                <input
                  type="text"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  className="px-2 py-0.5 text-xs border border-gray-400 rounded w-28 text-center font-mono"
                  placeholder="رقم الهاتف"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-[#34C38F] text-[#0F1412] text-xs font-bold"
                  title="حفظ"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="p-1 rounded bg-gray-200 text-gray-700 text-xs"
                  title="إلغاء"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-gray-300 my-2.5"></div>

          {/* 4. Details Block (Plain text, NO colored boxes, NO black boxes) */}
          <div className="space-y-1.5 text-xs sm:text-[13px] text-gray-700">
            <div className="flex justify-between items-center">
              <span>رقم الفاتورة:</span>
              <span className="font-mono text-black font-semibold">
                #{delivery.id.slice(0, 10).toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>التاريخ والوقت:</span>
              <span className="font-mono text-black">
                {formattedDateTime}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>اسم المستفيد:</span>
              <strong className="text-black font-bold">
                {delivery.beneficiaryName}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span>رقم الهاتف:</span>
              <span className="font-mono text-black">
                {delivery.beneficiaryPhone}
              </span>
            </div>

            {/* كود الاستلام: Normal bold text. NO black rectangle or any box around it */}
            <div className="flex justify-between items-center">
              <span>كود الاستلام:</span>
              <span className="font-mono font-bold text-black text-sm">
                {delivery.deliveryCode}
              </span>
            </div>

            {/* مسؤول الصرف: show the staff member's name ONLY. No job title, no "المدير العام", no extra words */}
            <div className="flex justify-between items-center">
              <span>مسؤول الصرف:</span>
              <span className="text-black font-semibold">
                {cleanStaffName}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-300 my-2.5"></div>

          {/* 5. Items Table: الصنف, السعر, الكمية, الإجمالي. Plain numbers without any symbol or unit */}
          <div className="py-1">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-400 text-black font-bold text-[11px] sm:text-xs">
                  <th className="pb-1.5 text-right font-bold">الصنف</th>
                  <th className="pb-1.5 text-center font-bold">السعر</th>
                  <th className="pb-1.5 text-center font-bold">الكمية</th>
                  <th className="pb-1.5 text-left font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-black">
                {delivery.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="py-1.5 text-right font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="py-1.5 text-center font-mono">
                      {item.unitPoints}
                    </td>
                    <td className="py-1.5 text-center font-mono font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 text-left font-mono font-bold">
                      {item.subtotalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-300 my-2.5"></div>

          {/* 6. Totals */}
          <div className="space-y-1.5 text-xs sm:text-[13px]">
            {/* قيمة القسيمة (رصيد الأسرة) */}
            <div className="flex justify-between items-center text-gray-700">
              <span>قيمة القسيمة (رصيد الأسرة):</span>
              <span className="font-mono text-black font-semibold">
                {voucherValue}
              </span>
            </div>

            {/* إجمالي الفاتورة (المصروف) as the emphasized line */}
            <div className="flex justify-between items-center py-1 text-black font-extrabold text-sm sm:text-base border-y border-gray-300">
              <span>إجمالي الفاتورة (المصروف):</span>
              <span className="font-mono text-base sm:text-lg">
                {invoiceTotal}
              </span>
            </div>

            {/* النقاط المتبقية */}
            <div className="flex justify-between items-center text-gray-700">
              <span>النقاط المتبقية:</span>
              <span className="font-mono text-black font-semibold">
                {remainingPoints}
              </span>
            </div>
          </div>

          {/* 7. Short note under the totals */}
          <div className="pt-3 text-center text-[10px] sm:text-[11px] text-gray-500">
            النقاط المتبقية تنتهي صلاحيتها بعد التسليم ولا ترحل للشهر القادم
          </div>

          <div className="border-t border-gray-300 my-2.5"></div>

          {/* 8. Bottom: ONLY this line */}
          <div className="text-center text-[11px] sm:text-xs text-gray-700 font-medium">
            يرجى الاحتفاظ بهذه الفاتورة كإثبات استلام رسمي
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#161D1A] border border-[#26312C] hover:border-[#34C38F]/50 hover:bg-[#26312C] text-[#E8EDEA] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#34C38F]" />
            <span>{isExporting ? 'جاري التصدير...' : exportSuccess ? 'تم الحفظ كصورة بنجاح!' : 'حفظ كصورة'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isNewDeliverySuccess && onNewDelivery && (
            <button
              type="button"
              onClick={onNewDelivery}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C2521] border border-[#34C38F]/40 text-[#34C38F] hover:bg-[#34C38F]/10 text-xs font-bold transition cursor-pointer text-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تسليم حصة جديدة</span>
            </button>
          )}

          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#161D1A] hover:bg-[#26312C] text-[#8A9690] hover:text-[#E8EDEA] text-xs font-medium transition cursor-pointer text-center"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // If inline (inside DeliveryView step 3), render directly into DOM flow
  if (isInline) {
    return content;
  }

  // If modal (inside LogsView), render through portal to document.body
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto animate-fade-in no-print-backdrop">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full flex justify-center">
        {content}
      </div>
    </div>,
    document.body
  );
};
