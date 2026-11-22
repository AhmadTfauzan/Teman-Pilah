/**
 * Shared Eco Enzyme helpers used by the public hub tracker,
 * admin forms, and the QR batch detail page so progress and WIB date math stay in one place.
 */
import type { EnzymeSweetenerType, EnzymeType } from '@/types';

export const DEFAULT_FERMENTATION_DAYS = 90;
const WIB_TIMEZONE = 'Asia/Jakarta';
const MS_PER_DAY = 86_400_000;

export interface EnzymeTypeMeta {
  value: EnzymeType;
  label: string;
  shortDescription: string;
  badgeText: string;
  materialLabel: string;
  materialShortLabel: string;
  ingredientsTitle: string;
  ingredientsSubtitle: string;
  ingredientsPlaceholder: string;
  ingredientsHelper: string;
  defaultIngredients: string;
}

export interface EnzymeSweetenerMeta {
  value: EnzymeSweetenerType;
  label: string;
  description: string;
}

const ALLOWED_SWEETENERS_BY_ENZYME: Record<EnzymeType, readonly EnzymeSweetenerType[]> = {
  ECO_ENZYME: ['MOLASE', 'GULA'],
  CLASSIC_ENZYME: ['MADU', 'GULA'],
};

const DEFAULT_SWEETENER_BY_ENZYME: Record<EnzymeType, EnzymeSweetenerType> = {
  ECO_ENZYME: 'MOLASE',
  CLASSIC_ENZYME: 'MADU',
};

const FALLBACK_INGREDIENT_BY_ENZYME: Record<EnzymeType, string> = {
  ECO_ENZYME: 'Kulit Buah Campur',
  CLASSIC_ENZYME: 'Buah Segar Pilihan',
};

const ENZYME_TYPE_META: Record<EnzymeType, EnzymeTypeMeta> = {
  ECO_ENZYME: {
    value: 'ECO_ENZYME',
    label: 'Eco Enzyme',
    shortDescription: 'Dibuat dari sampah organik (kulit buah/sayur)',
    badgeText: 'Eco Enzyme (Non-Konsumsi)',
    materialLabel: 'Sampah Organik (BO)',
    materialShortLabel: 'Sampah BO',
    ingredientsTitle: 'Komponen Bahan Organik',
    ingredientsSubtitle: 'Bahan Kulit Buah & Sayur',
    ingredientsPlaceholder: 'cth. Kulit Jeruk, Kulit Nanas, Kulit Pepaya, Sisa Sayuran',
    ingredientsHelper:
      'Catat jenis sampah organik (kulit buah atau sisa sayuran) yang digunakan, pisahkan dengan koma.',
    defaultIngredients: 'Kulit Jeruk, Kulit Nanas, Kulit Pepaya, Kulit Semangka',
  },
  CLASSIC_ENZYME: {
    value: 'CLASSIC_ENZYME',
    label: 'Classic Enzyme',
    shortDescription:
      'Dibuat dari buah segar pilihan & madu/gula berkualitas (untuk dikonsumsi/diminum)',
    badgeText: 'Classic Enzyme (Konsumsi / Diminum)',
    materialLabel: 'Buah Segar Pilihan',
    materialShortLabel: 'Buah Segar',
    ingredientsTitle: 'Komponen Buah Segar Pilihan',
    ingredientsSubtitle: 'Buah Segar Pilihan Berkualitas',
    ingredientsPlaceholder: 'cth. Semangka, Melon, Nanas, Pepaya, Mangga',
    ingredientsHelper:
      'Catat jenis buah segar pilihan berkualitas yang digunakan untuk konsumsi/diminum, pisahkan dengan koma.',
    defaultIngredients: 'Semangka, Melon, Nanas, Pepaya, Mangga',
  },
};

const SWEETENER_META: Record<EnzymeSweetenerType, EnzymeSweetenerMeta> = {
  MOLASE: {
    value: 'MOLASE',
    label: 'Molase',
    description: 'Tetes tebu/molase untuk fermentasi Eco Enzyme non-konsumsi.',
  },
  GULA: {
    value: 'GULA',
    label: 'Gula',
    description: 'Gula merah/gula tebu sebagai sumber karbon fermentasi.',
  },
  MADU: {
    value: 'MADU',
    label: 'Madu',
    description: 'Madu murni berkualitas untuk fermentasi Classic Enzyme siap konsumsi.',
  },
};

export function normalizeEnzymeType(value?: string | null): EnzymeType {
  if (typeof value === 'string' && value.trim().toUpperCase() === 'CLASSIC_ENZYME') {
    return 'CLASSIC_ENZYME';
  }
  return 'ECO_ENZYME';
}

export function getAllowedSweetenersForEnzyme(
  enzymeType?: EnzymeType | string | null
): EnzymeSweetenerType[] {
  const normalized = normalizeEnzymeType(enzymeType);
  return [...ALLOWED_SWEETENERS_BY_ENZYME[normalized]];
}

export function getDefaultSweetenerForEnzyme(
  enzymeType?: EnzymeType | string | null
): EnzymeSweetenerType {
  return DEFAULT_SWEETENER_BY_ENZYME[normalizeEnzymeType(enzymeType)];
}

export function isSweetenerAllowedForEnzyme(
  enzymeType?: EnzymeType | string | null,
  sweetenerType?: EnzymeSweetenerType | string | null
): boolean {
  if (typeof sweetenerType !== 'string') return false;
  const candidate = sweetenerType.trim().toUpperCase();
  return ALLOWED_SWEETENERS_BY_ENZYME[normalizeEnzymeType(enzymeType)].includes(
    candidate as EnzymeSweetenerType
  );
}

export function normalizeSweetenerForEnzyme(
  sweetenerType?: string | null,
  enzymeType?: EnzymeType | string | null
): EnzymeSweetenerType {
  if (typeof sweetenerType === 'string') {
    const candidate = sweetenerType.trim().toUpperCase();
    if (isSweetenerAllowedForEnzyme(enzymeType, candidate)) {
      return candidate as EnzymeSweetenerType;
    }
  }
  return getDefaultSweetenerForEnzyme(enzymeType);
}

export function getEnzymeTypeMeta(enzymeType?: EnzymeType | string | null): EnzymeTypeMeta {
  return ENZYME_TYPE_META[normalizeEnzymeType(enzymeType)];
}

export function getSweetenerMeta(
  sweetenerType?: EnzymeSweetenerType | string | null,
  enzymeType?: EnzymeType | string | null
): EnzymeSweetenerMeta {
  if (enzymeType != null) {
    return SWEETENER_META[normalizeSweetenerForEnzyme(sweetenerType, enzymeType)];
  }
  if (typeof sweetenerType === 'string') {
    const candidate = sweetenerType.trim().toUpperCase() as EnzymeSweetenerType;
    if (candidate in SWEETENER_META) {
      return SWEETENER_META[candidate];
    }
  }
  return SWEETENER_META[getDefaultSweetenerForEnzyme(enzymeType)];
}

const wibDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: WIB_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function parseOrganicWasteTypes(
  value?: string | null,
  enzymeType?: EnzymeType | string | null
): string[] {
  const fallback = FALLBACK_INGREDIENT_BY_ENZYME[normalizeEnzymeType(enzymeType)];
  if (!value) return [fallback];
  const items = value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : [fallback];
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
