/**
 * Shared Eco Enzyme helpers used by the public hub tracker,
 * admin forms, and the QR batch detail page so progress and WIB date math stay in one place.
 */

export const DEFAULT_FERMENTATION_DAYS = 90;
const WIB_TIMEZONE = 'Asia/Jakarta';
const MS_PER_DAY = 86_400_000;

const wibDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: WIB_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function parseOrganicWasteTypes(value?: string | null): string[] {
  if (!value) return ['Kulit Buah Campur'];
  const items = value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : ['Kulit Buah Campur'];
}

export function getFermentationProgress(
  startDateStr: string,
  estimateDateStr: string,
  status?: string | null
): number {
  if (status === 'HARVESTED') return 100;
  if (status === 'FAILED') return 0;

  const start = new Date(startDateStr).getTime();
  const end = new Date(estimateDateStr).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;

  const totalDuration = end - start;
  if (totalDuration <= 0) return 100;
  return Math.min(99, Math.max(0, Math.round(((now - start) / totalDuration) * 100)));
}

export function getDaysRemaining(estimateDateStr: string): number {
  const end = new Date(estimateDateStr).getTime();
  if (Number.isNaN(end)) return 0;
  const now = Date.now();
  const diff = Math.ceil((end - now) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

export function getDayPassed(startDateStr: string): number {
  const start = new Date(startDateStr).getTime();
  if (Number.isNaN(start)) return 1;
  const diffTime = Math.max(0, Date.now() - start);
  return Math.floor(diffTime / MS_PER_DAY) + 1;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    !Number.isNaN(probe.getTime()) &&
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/**
 * Mengubah Date/ISO string menjadi format input tanggal `YYYY-MM-DD` pada zona waktu WIB (Asia/Jakarta).
 */
export function formatDateInputWib(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return '';

  if (typeof isoOrDate === 'string') {
    const trimmed = isoOrDate.trim();
    if (!trimmed) return '';
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      return isValidCalendarDate(year, month, day) ? trimmed : '';
    }
  }

  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  const parts = wibDateFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) return '';
  return `${year}-${month}-${day}`;
}

/**
 * Menghasilkan tanggal hari ini dalam format `YYYY-MM-DD` sesuai zona waktu WIB (Asia/Jakarta).
 */
export function getTodayWibDateInput(): string {
  return formatDateInputWib(new Date());
}

/**
 * Menambahkan sejumlah hari kalender ke string tanggal `YYYY-MM-DD` (atau ISO/WIB date) secara deterministik.
 * Default menambah `DEFAULT_FERMENTATION_DAYS` (90 hari).
 */
export function addDaysToDateInput(
  dateStr: string,
  days: number = DEFAULT_FERMENTATION_DAYS
): string {
  if (!Number.isFinite(days)) return '';
  const normalized = formatDateInputWib(dateStr);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return '';

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return '';

  const baseUtcMs = Date.UTC(year, month - 1, day);
  const target = new Date(baseUtcMs + Math.trunc(days) * MS_PER_DAY);
  if (Number.isNaN(target.getTime())) return '';

  const outYear = target.getUTCFullYear();
  const outMonth = String(target.getUTCMonth() + 1).padStart(2, '0');
  const outDay = String(target.getUTCDate()).padStart(2, '0');
  return `${outYear}-${outMonth}-${outDay}`;
}
