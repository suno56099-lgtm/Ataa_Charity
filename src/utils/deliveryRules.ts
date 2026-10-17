/**
 * Charity Delivery Business Rules & Verification
 * Handles code verification, atomic balance checks, cart calculations,
 * and SMS template formatting for Egyptian beneficiaries.
 */

export interface CartItem {
  productId: string;
  productName: string;
  pointsCost: number;
  quantity: number;
}

export interface VerificationResult {
  isValid: boolean;
  errorCode?: 'CODE_NOT_FOUND' | 'WRONG_MONTH' | 'ALREADY_USED' | 'INVALID_FORMAT';
  errorMessageArabic?: string;
}

export const ARABIC_MONTH_NAMES: Record<string, string> = {
  '01': 'يناير',
  '02': 'فبراير',
  '03': 'مارس',
  '04': 'أبريل',
  '05': 'مايو',
  '06': 'يونيو',
  '07': 'يوليو',
  '08': 'أغسطس',
  '09': 'سبتمبر',
  '10': 'أكتوبر',
  '11': 'نوفمبر',
  '12': 'ديسمبر',
};

/**
 * Format YYYY-MM into Arabic (e.g. '2026-10' -> 'أكتوبر 2026')
 */
export function formatMonthArabic(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [year, month] = monthKey.split('-');
  const monthName = ARABIC_MONTH_NAMES[month] || month;
  return `${monthName} ${year}`;
}

/**
 * Generates a cryptographically random 6-digit verification code
 */
export function generateSixDigitCode(): string {
  const min = 100000;
  const max = 999999;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Validates a beneficiary code for delivery
 */
export function verifyDeliveryCode(
  inputCode: string,
  record: {
    code: string;
    monthKey: string;
    status: 'available' | 'used';
  } | null | undefined,
  currentMonth: string
): VerificationResult {
  const cleanCode = (inputCode || '').trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      isValid: false,
      errorCode: 'INVALID_FORMAT',
      errorMessageArabic: 'كود الاستلام يجب أن يتكون من 6 أرقام',
    };
  }

  if (!record || record.code !== cleanCode) {
    return {
      isValid: false,
      errorCode: 'CODE_NOT_FOUND',
      errorMessageArabic: 'كود الاستلام غير صحيح أو غير مسجل في المنظومة',
    };
  }

  if (record.monthKey !== currentMonth) {
    return {
      isValid: false,
      errorCode: 'WRONG_MONTH',
      errorMessageArabic: `هذا الكود غير مخصص للشهر الحالي (${formatMonthArabic(currentMonth)}) بل لشهر (${formatMonthArabic(record.monthKey)})`,
    };
  }

  if (record.status === 'used') {
    return {
      isValid: false,
      errorCode: 'ALREADY_USED',
      errorMessageArabic: 'تم استخدام هذا الكود بالفعل مسبقاً ولا يمكن تكرار الصرف به',
    };
  }

  return { isValid: true };
}

/**
 * Calculates cart total points and item count
 */
export function calculateCartTotal(cart: CartItem[]): { totalPoints: number; totalUnits: number } {
  let totalPoints = 0;
  let totalUnits = 0;

  for (const item of cart) {
    const qty = Math.max(0, Math.floor(item.quantity || 0));
    totalPoints += (item.pointsCost || 0) * qty;
    totalUnits += qty;
  }

  return { totalPoints, totalUnits };
}

/**
 * Pre-checks whether the delivery can be authorized
 */
export function canAuthorizeDelivery(
  currentBalance: number,
  cart: CartItem[]
): { canAuthorize: boolean; errorMessageArabic?: string; balanceAfter: number } {
  const { totalPoints, totalUnits } = calculateCartTotal(cart);

  if (totalUnits === 0 || totalPoints === 0) {
    return {
      canAuthorize: false,
      errorMessageArabic: 'يرجى تحديد صنف واحد على الأقل لإتمام الصرف',
      balanceAfter: currentBalance,
    };
  }

  if (currentBalance < totalPoints) {
    return {
      canAuthorize: false,
      errorMessageArabic: `رصيد المستفيد غير كافٍ. المطلوب: ${totalPoints} نقطة، والرصيد المتوفر: ${currentBalance} نقطة`,
      balanceAfter: currentBalance - totalPoints,
    };
  }

  return {
    canAuthorize: true,
    balanceAfter: currentBalance - totalPoints,
  };
}

/**
 * Formats standard SMS message and link for Egyptian beneficiaries
 */
export function buildSmsLink(phone: string, code: string, monthKey: string): { smsUrl: string; messageText: string } {
  const monthName = formatMonthArabic(monthKey);
  const messageText = `مرحباً بك في جمعية عطاء الخيرية. كود استلام المساعدة الخاص بك لشهر ${monthName} هو: ${code}. يرجى التوجه إلى مقر الجمعية الرئيسي بالقرية مع بطاقة الرقم القومي للاستلام.`;
  // Clean phone
  const cleanPhone = (phone || '').replace(/[\s-]/g, '');
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(messageText)}`;
  return { smsUrl, messageText };
}
