/**
 * Same rule as PhoneNumbers on the server: an Indian mobile number with or without +91 / 91 / 0,
 * or any other country's number written with a leading +.
 */
export function isValidPhone(input: string | undefined | null): boolean {
  const value = (input ?? '').replace(/[\s().-]/g, '');
  const international = value.startsWith('+');
  const digits = international ? value.slice(1) : value;
  if (!/^\d+$/.test(digits)) return false;
  const indianMobile = (d: string) => /^[6-9]\d{9}$/.test(d);
  if (international) {
    return digits.startsWith('91') ? indianMobile(digits.slice(2)) : /^[1-9]\d{7,14}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith('91')) return indianMobile(digits.slice(2));
  if (digits.length === 11 && digits.startsWith('0')) return indianMobile(digits.slice(1));
  return indianMobile(digits);
}
