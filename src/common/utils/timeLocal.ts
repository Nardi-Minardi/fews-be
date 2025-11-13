export function toLocalTimeString(
  utcDate: string | Date | undefined | null,
  timeZone: string = 'Asia/Jakarta'
): string | null {
  if (!utcDate) return null;
  const date = new Date(utcDate);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  };

  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);
  const mapping: Record<string, string> = {};
  parts.forEach(p => (mapping[p.type] = p.value));

  return `${mapping.year}-${mapping.month}-${mapping.day} ${mapping.hour}:${mapping.minute}:${mapping.second}`;
}
