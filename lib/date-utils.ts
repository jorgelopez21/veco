/**
 * Parses a date string from an HTML input[type="date"] (yyyy-MM-dd)
 * without timezone shifts. It returns a Date object at noon local time.
 */
export function parseInputDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Using noon local time avoids potential day shifts when converting to UTC
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a Date object to yyyy-MM-dd using local time.
 */
export function formatToInputDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
