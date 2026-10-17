import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEgyptianNationalId,
  validateEgyptianPhone,
  maskNationalId,
} from './egyptianValidation.ts';

test('validates correct 14-digit Egyptian National ID for century 2 (1900-1999)', () => {
  // Born 1985-05-15, governorate 01 (Cairo), male (odd sequence: 123)
  const nid = '28505150101234';
  const result = validateEgyptianNationalId(nid);
  assert.equal(result.isValid, true);
  assert.equal(result.birthDate, '1985-05-15');
  assert.equal(result.gender, 'ذكر');
  assert.equal(result.governorate, 'القاهرة');
});

test('validates correct 14-digit Egyptian National ID for century 3 (2000-2099)', () => {
  // Born 2002-11-20, governorate 24 (Minya), female (even sequence: 042)
  const nid = '30211202400428';
  const result = validateEgyptianNationalId(nid);
  assert.equal(result.isValid, true);
  assert.equal(result.birthDate, '2002-11-20');
  assert.equal(result.gender, 'أنثى');
  assert.equal(result.governorate, 'المنيا');
});

test('rejects Egyptian National ID with invalid century', () => {
  const nid = '18505150101234';
  const result = validateEgyptianNationalId(nid);
  assert.equal(result.isValid, false);
});

test('rejects Egyptian National ID with invalid length', () => {
  const result1 = validateEgyptianNationalId('2850515010123'); // 13 digits
  const result2 = validateEgyptianNationalId('285051501012345'); // 15 digits
  assert.equal(result1.isValid, false);
  assert.equal(result2.isValid, false);
});

test('validates Egyptian mobile numbers', () => {
  assert.equal(validateEgyptianPhone('01012345678').isValid, true);
  assert.equal(validateEgyptianPhone('01198765432').isValid, true);
  assert.equal(validateEgyptianPhone('01234567890').isValid, true);
  assert.equal(validateEgyptianPhone('01555555555').isValid, true);
  assert.equal(validateEgyptianPhone('+201012345678').isValid, true);

  // Invalid: 013 prefix, or 10 digits
  assert.equal(validateEgyptianPhone('01312345678').isValid, false);
  assert.equal(validateEgyptianPhone('0101234567').isValid, false);
  assert.equal(validateEgyptianPhone('010123456789').isValid, false);
});

test('masks national ID correctly', () => {
  const masked = maskNationalId('29901011234567');
  // First 4 digits: 2990, masked 4: ****, last 6 digits: 234567
  assert.equal(masked, '2990****234567');
});
