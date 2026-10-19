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
 * Extract YYMM prefix from month key (e.g. '2026-10' -> 'ataa2610')
 */
export function getMonthCodePrefix(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return 'ataa2610';
  const [year, month] = monthKey.split('-');
  const yy = year.slice(-2);
  const mm = month.padStart(2, '0');
  return `ataa${yy}${mm}`;
}

/**
 * Generates a cryptographically secure beneficiary code matching:
 * fixed prefix "ataa" + 2-digit year + 2-digit month (YYMM) + 6 random digits
 * Example for October 2026: ataa2610384957
 */
export function generateBeneficiaryCode(monthKey: string): string {
  const prefix = getMonthCodePrefix(monthKey);
  const randomBuffer = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBuffer);
  } else {
    randomBuffer[0] = Math.floor(Math.random() * 1000000000);
  }
  const digits = (100000 + (randomBuffer[0] % 900000)).toString();
  return `${prefix}${digits}`;
}

export function generateSixDigitCode(monthKey: string = '2026-10'): string {
  return generateBeneficiaryCode(monthKey);
}

/**
 * Validates a beneficiary code for delivery:
 * Accepts full code, ignores spaces and letter case, and rejects wrong YYMM or non-matching records.
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
  // Normalize: remove all whitespace and convert to lowercase
  const cleanCode = (inputCode || '').replace(/\s+/g, '').toLowerCase();

  if (!cleanCode) {
    return {
      isValid: false,
      errorCode: 'INVALID_FORMAT',
      errorMessageArabic: 'يرجى إدخال كود الاستلام (مثال: ataa2610482915)',
    };
  }

  // Handle case where user types or pastes full code or 6 random digits
  let effectiveCode = cleanCode;
  if (/^\d{6}$/.test(cleanCode)) {
    effectiveCode = `${getMonthCodePrefix(currentMonth)}${cleanCode}`;
  }

  // Regex check: starts with 'ataa' followed by 4 digits (YYMM) then 6 digits
  const codeRegex = /^ataa(\d{2})(\d{2})\d{6}$/;
  const match = effectiveCode.match(codeRegex);

  if (!match) {
    return {
      isValid: false,
      errorCode: 'INVALID_FORMAT',
      errorMessageArabic: 'صيغة كود الاستلام غير صحيحة. يجب أن يبدأ بـ ataa متبوعاً بسنة وشهر الصرف و6 أرقام (مثال: ataa2610482915)',
    };
  }

  // Check YYMM matches current month
  const expectedPrefix = getMonthCodePrefix(currentMonth);
  if (!effectiveCode.startsWith(expectedPrefix)) {
    const codeYear = '20' + match[1];
    const codeMonth = match[2];
    const codeMonthName = ARABIC_MONTH_NAMES[codeMonth] || codeMonth;
    const currentMonthName = formatMonthArabic(currentMonth);
    return {
      isValid: false,
      errorCode: 'WRONG_MONTH',
      errorMessageArabic: `هذا الكود مخصص لشهر (${codeMonthName} ${codeYear}) ولا يطابق شهر الصرف الحالي (${currentMonthName})`,
    };
  }

  // Check matching database record (case-insensitive)
  if (!record) {
    return {
      isValid: false,
      errorCode: 'CODE_NOT_FOUND',
      errorMessageArabic: 'كود الاستلام غير صحيح أو غير مسجل في المنظومة',
    };
  }

  // Check if record belongs to a different month
  if (record.monthKey && record.monthKey !== currentMonth) {
    const recordMonthName = formatMonthArabic(record.monthKey);
    const currentMonthName = formatMonthArabic(currentMonth);
    return {
      isValid: false,
      errorCode: 'WRONG_MONTH',
      errorMessageArabic: `هذا الكود مخصص لشهر (${recordMonthName}) ولا يطابق شهر الصرف الحالي (${currentMonthName})`,
    };
  }

  const recordCodeNorm = (record.code || '').replace(/\s+/g, '').toLowerCase();
  if (recordCodeNorm !== effectiveCode && !recordCodeNorm.endsWith(cleanCode)) {
    return {
      isValid: false,
      errorCode: 'CODE_NOT_FOUND',
      errorMessageArabic: 'كود الاستلام غير صحيح أو غير مسجل في المنظومة',
    };
  }

  if (record.status === 'used') {
    return {
      isValid: false,
      errorCode: 'ALREADY_USED',
      errorMessageArabic: 'تم استخدام هذا الكود بالفعل مسبقاً ولا يمكن تكرار الصرف به لهذا الشهر',
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

export interface PointsTierConfig {
  tier1: number; // 1st member points (default 30)
  tier2: number; // 2nd and 3rd members each (default 24)
  tier3: number; // 4th to 7th members each (default 21)
}

export const DEFAULT_POINTS_TIERS: PointsTierConfig = {
  tier1: 30,
  tier2: 24,
  tier3: 21,
};

/**
 * Calculates family points automatically based on tiered formula (1 to 7 members)
 * 1st member: tier1 (30)
 * 2nd & 3rd members: tier2 (24 each)
 * 4th to 7th members: tier3 (21 each)
 * Results for defaults: 1=30, 2=54, 3=78, 4=99, 5=120, 6=141, 7=162
 */
export function calculateFamilyPoints(
  familySize: number,
  tiers: PointsTierConfig = DEFAULT_POINTS_TIERS
): number {
  const size = Math.max(1, Math.min(7, Math.floor(familySize || 1)));
  let total = 0;
  for (let i = 1; i <= size; i++) {
    if (i === 1) {
      total += (tiers.tier1 ?? 30);
    } else if (i === 2 || i === 3) {
      total += (tiers.tier2 ?? 24);
    } else {
      total += (tiers.tier3 ?? 21);
    }
  }
  return total;
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

/**
 * Checks if the remaining points balance is higher than or equal to the cheapest available product.
 * Returns a warning to prevent leaving unspent points behind.
 */
export function checkLeftoverPointsWarning(
  remainingBalance: number,
  products: { name: string; pointsCost: number; isActive: boolean; isDeleted?: boolean }[]
): {
  hasExcessLeftover: boolean;
  cheapestProduct?: { name: string; pointsCost: number };
  warningMessageArabic?: string;
} {
  const activeProducts = (products || []).filter((p) => p.isActive && !p.isDeleted);
  if (activeProducts.length === 0 || remainingBalance <= 0) {
    return { hasExcessLeftover: false };
  }

  let cheapest = activeProducts[0];
  for (const prod of activeProducts) {
    if (prod.pointsCost < cheapest.pointsCost) {
      cheapest = prod;
    }
  }

  if (remainingBalance >= cheapest.pointsCost) {
    return {
      hasExcessLeftover: true,
      cheapestProduct: {
        name: cheapest.name,
        pointsCost: cheapest.pointsCost,
      },
      warningMessageArabic: `تنبيه: الرصيد المتبقي للمستفيد (${remainingBalance} نقطة) يكفي لصرف سلع تموينية إضافية (مثل: ${cheapest.name} بتكلفة ${cheapest.pointsCost} نقطة). يرجى توجيه المستفيد لاختيار سلع إضافية لتفادي تبقي نقاط دون استغلال.`,
    };
  }

  return {
    hasExcessLeftover: false,
    cheapestProduct: {
      name: cheapest.name,
      pointsCost: cheapest.pointsCost,
    },
  };
}
