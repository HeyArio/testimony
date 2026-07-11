// Persian digits for UI display; latin digits stay in code/URLs.
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}
