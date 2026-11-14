const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Whole number in the Indian system: 150000 → "one lakh fifty thousand" */
function wholeInWords(n: number): string {
  if (n === 0) return 'zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${wholeInWords(crore)} crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(' ');
}

/** "Five thousand rupees" / "Two hundred rupees and fifty paise", so a mistyped amount stands out */
export function amountInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let text = `${wholeInWords(rupees)} rupee${rupees === 1 ? '' : 's'}`;
  if (paise) text += ` and ${belowHundred(paise)} paise`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Rupee amount typed by an admin: digits with at most 2 decimals, commas allowed; NaN if invalid */
export function parseRupees(input: string): number {
  const t = input.trim().replace(/,/g, '');
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
}

export const formatRupees = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
