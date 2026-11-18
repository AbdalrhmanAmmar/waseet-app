export const asciiDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));

// Keep the user's input intact while typing. Normalize only for validation/submission.
export function registrationPhone(value: string, callingCode: string) {
  const cleaned = asciiDigits(value)
    .trim()
    .replace(/[\s()\-.]/g, '');
  const prefix = callingCode.replace(/^\+/, '');
  if (!/^\d{1,4}$/.test(prefix))
    return { error: 'اختر كود دولة صحيحًا لرقم الهاتف.', international: '' };
  if (!cleaned) return { error: 'رقم الهاتف مطلوب', international: '' };
  if (!/^(?:\+|00)?\d+$/.test(cleaned))
    return { error: 'اكتب رقم الهاتف بالأرقام فقط، مع كود الدولة عند الحاجة.', international: '' };
  const international = cleaned.startsWith('+') || cleaned.startsWith('00');
  const digits = cleaned.replace(/^(?:\+|00)/, '');
  if (international && !digits.startsWith(prefix))
    return {
      error: 'كود الرقم مختلف عن الدولة المختارة. اختر كود الدولة المناسب.',
      international: '',
    };
  const national = international ? digits.slice(prefix.length) : digits;
  if (national.length < 7 || prefix.length + national.length > 15)
    return {
      error: 'أدخل رقم هاتف صحيحًا؛ الحد الأقصى ١٥ رقمًا شاملًا كود الدولة.',
      international: '',
    };
  return { error: null, international: `+${prefix}${national}` };
}
export function countryFlag(code: string) {
  return /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
    : '';
}
