export function toLocalTimeString(
  utcDate: string | Date,
  timeZone: string = "Asia/Jakarta"
): string {
  const date = new Date(utcDate);

  // Opsi untuk menampilkan sesuai timezone
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  };

  // format: "DD/MM/YYYY, HH:MM:SS"
  const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(date);
  const mapping: Record<string, string> = {};
  parts.forEach((p) => (mapping[p.type] = p.value));

  return `${mapping.year}-${mapping.month}-${mapping.day} ${mapping.hour}:${mapping.minute}:${mapping.second}`;
}