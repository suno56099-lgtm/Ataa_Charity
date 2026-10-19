import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyDeliveryCode,
  calculateCartTotal,
  canAuthorizeDelivery,
  generateSixDigitCode,
  formatMonthArabic,
  buildSmsLink,
  calculateFamilyPoints,
  checkLeftoverPointsWarning,
} from './deliveryRules.ts';

test('generates valid code with ataa prefix and YYMM and 6 digits', () => {
  const code = generateSixDigitCode('2026-10');
  assert.match(code, /^ataa2610\d{6}$/);
});

test('formats Arabic month names correctly', () => {
  assert.equal(formatMonthArabic('2026-10'), 'أكتوبر 2026');
  assert.equal(formatMonthArabic('2026-05'), 'مايو 2026');
});

test('verifies delivery code - success scenario', () => {
  const record = {
    code: 'ataa2610123456',
    monthKey: '2026-10',
    status: 'available' as const,
  };
  const result = verifyDeliveryCode('ataa2610123456', record, '2026-10');
  assert.equal(result.isValid, true);
});

test('verifies delivery code - wrong month scenario', () => {
  const record = {
    code: 'ataa2609123456',
    monthKey: '2026-09',
    status: 'available' as const,
  };
  const result = verifyDeliveryCode('ataa2609123456', record, '2026-10');
  assert.equal(result.isValid, false);
  assert.equal(result.errorCode, 'WRONG_MONTH');
});

test('verifies delivery code - already used scenario', () => {
  const record = {
    code: 'ataa2610123456',
    monthKey: '2026-10',
    status: 'used' as const,
  };
  const result = verifyDeliveryCode('ataa2610123456', record, '2026-10');
  assert.equal(result.isValid, false);
  assert.equal(result.errorCode, 'ALREADY_USED');
});

test('verifies delivery code - format error', () => {
  const result = verifyDeliveryCode('invalid-code', null, '2026-10');
  assert.equal(result.isValid, false);
  assert.equal(result.errorCode, 'INVALID_FORMAT');
});

test('calculates cart total and checks authorization', () => {
  const cart = [
    { productId: '1', productName: 'زيت طعام', pointsCost: 25, quantity: 2 },
    { productId: '2', productName: 'سكر ناعم', pointsCost: 15, quantity: 3 },
  ];
  // 2*25 + 3*15 = 50 + 45 = 95
  const total = calculateCartTotal(cart);
  assert.equal(total.totalPoints, 95);
  assert.equal(total.totalUnits, 5);

  // Beneficiary has 100 points
  const authSuccess = canAuthorizeDelivery(100, cart);
  assert.equal(authSuccess.canAuthorize, true);
  assert.equal(authSuccess.balanceAfter, 5);

  // Beneficiary has only 50 points
  const authFail = canAuthorizeDelivery(50, cart);
  assert.equal(authFail.canAuthorize, false);
  assert.equal(authFail.balanceAfter, -45);
});

test('builds correct SMS message and URL', () => {
  const { smsUrl, messageText } = buildSmsLink('01012345678', '887766', '2026-10');
  assert.ok(smsUrl.startsWith('sms:01012345678?body='));
  assert.ok(messageText.includes('887766'));
  assert.ok(messageText.includes('أكتوبر 2026'));
  assert.ok(messageText.includes('جمعية عطاء الخيرية'));
  assert.ok(messageText.includes('مقر الجمعية الرئيسي بالقرية'));
});

test('calculates tiered family points accurately from 1 to 7 members', () => {
  assert.equal(calculateFamilyPoints(1), 30);
  assert.equal(calculateFamilyPoints(2), 54);
  assert.equal(calculateFamilyPoints(3), 78);
  assert.equal(calculateFamilyPoints(4), 99);
  assert.equal(calculateFamilyPoints(5), 120);
  assert.equal(calculateFamilyPoints(6), 141);
  assert.equal(calculateFamilyPoints(7), 162);
});

test('warns when leftover points exceed or equal cheapest product price', () => {
  const prods = [
    { name: 'أرز 800 جرام - ماركت', pointsCost: 5, isActive: true },
    { name: 'مكرونة 350 جرام - ماركت', pointsCost: 2, isActive: true },
    { name: 'زيت طعام 500 مللي', pointsCost: 10, isActive: true },
  ];

  // Cheapest is 2 points. If balanceAfter is 2 or 3, warn!
  const warnResult = checkLeftoverPointsWarning(3, prods);
  assert.equal(warnResult.hasExcessLeftover, true);
  assert.equal(warnResult.cheapestProduct?.pointsCost, 2);

  // If balanceAfter is 1, no warning because cheapest is 2
  const noWarnResult = checkLeftoverPointsWarning(1, prods);
  assert.equal(noWarnResult.hasExcessLeftover, false);
});
