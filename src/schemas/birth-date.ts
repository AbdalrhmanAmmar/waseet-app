// Calendar validation without Date's automatic rollover (e.g. 31 February).
export function birthDateFromParts(
  day: number,
  month: number,
  year: number,
  today = new Date(),
): string | null {
  if (
    ![day, month, year].every(Number.isInteger) ||
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  const lastAllowed = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() <= lastAllowed ? date.toISOString() : null;
}
export function isValidBirthDate(value?: string) {
  if (!value) return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  return !!parts && !!birthDateFromParts(Number(parts[3]), Number(parts[2]), Number(parts[1]));
}
