/**
 * Egyptian National ID & Phone Validation Utilities
 * Follows Egyptian Civil Registry standards for 14-digit National IDs
 * and Telecom Egypt / Vodafone / Orange / e& mobile prefixes.
 */

export interface NationalIdParsed {
  isValid: boolean;
  errorMessage?: string;
  birthDate?: string;
  gender?: 'ذكر' | 'أنثى';
  governorate?: string;
}

const GOVERNORATES: Record<string, string> = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '11': 'دمياط',
  '12': 'الدقهلية',
  '13': 'الشرقية',
  '14': 'القليوبية',
  '15': 'كفر الشيخ',
  '16': 'الغربية',
  '17': 'المنوفية',
  '18': 'البحيرة',
  '19': 'الإسماعيلية',
  '21': 'الجيزة',
  '22': 'بني سويف',
  '23': 'الفيوم',
  '24': 'المنيا',
  '25': 'أسيوط',
  '26': 'سوهاج',
  '27': 'قنا',
  '28': 'أسوان',
  '29': 'الأقصر',
  '31': 'البحر الأحمر',
  '32': 'الوادي الجديد',
  '33': 'مطروح',
  '34': 'شمال سيناء',
  '35': 'جنوب سيناء',
  '88': 'مواليد خارج الجمهورية',
};

/**
 * Validates and decodes a 14-digit Egyptian National ID.
 */
export function validateEgyptianNationalId(nid: string): NationalIdParsed {
  const cleaned = (nid || '').trim();

  if (!/^\d{14}$/.test(cleaned)) {
    return {
      isValid: false,
      errorMessage: 'يجب أن يتكون الرقم القومي من 14 رقماً بالضبط',
    };
  }

  const centuryDigit = parseInt(cleaned[0], 10);
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return {
      isValid: false,
      errorMessage: 'الرقم القومي غير صحيح (رقم القرن يجب أن يبدأ بـ 2 أو 3)',
    };
  }

  const century = centuryDigit === 2 ? 1900 : 2000;
  const year = century + parseInt(cleaned.substring(1, 3), 10);
  const month = parseInt(cleaned.substring(3, 5), 10);
  const day = parseInt(cleaned.substring(5, 7), 10);

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      errorMessage: 'الرقم القومي يحتوي على شهر ميلاد غير صالح',
    };
  }

  // Days in month check
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      isValid: false,
      errorMessage: 'الرقم القومي يحتوي على يوم ميلاد غير صالح',
    };
  }

  const govCode = cleaned.substring(7, 9);
  const governorate = GOVERNORATES[govCode] || 'محافظة غير معروفة';

  const genderDigit = parseInt(cleaned[12], 10);
  const gender = genderDigit % 2 === 1 ? 'ذكر' : 'أنثى';

  const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    isValid: true,
    birthDate,
    gender,
    governorate,
  };
}

/**
 * Validates an 11-digit Egyptian mobile number (010, 011, 012, 015)
 */
export function validateEgyptianPhone(phone: string): { isValid: boolean; errorMessage?: string } {
  const cleaned = (phone || '').replace(/[\s-]/g, '').trim();

  if (!cleaned) {
    return { isValid: false, errorMessage: 'رقم الهاتف مطلوب' };
  }

  // Accepts either 01xxxxxxxxx or +201xxxxxxxxx
  let normalized = cleaned;
  if (normalized.startsWith('+2')) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('002')) {
    normalized = normalized.substring(3);
  }

  if (!/^01[0125]\d{8}$/.test(normalized)) {
    return {
      isValid: false,
      errorMessage: 'رقم المحمول المصري غير صالح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)',
    };
  }

  return { isValid: true };
}

/**
 * Masks the 14-digit National ID: e.g. "2990****12345"
 */
export function maskNationalId(nid: string): string {
  if (!nid || nid.length !== 14) return nid || '';
  return `${nid.substring(0, 4)}****${nid.substring(8)}`;
}

/**
 * Formats Western digits into clean Arabic number representation if needed,
 * while keeping codes and phones in legible 0-9 for easy copying.
 */
export function formatArabicCurrencyOrPoints(amount: number): string {
  return new Intl.NumberFormat('ar-EG').format(amount);
}
