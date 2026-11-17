/**
 * Shared Eco Enzyme helpers used by the public hub tracker
 * and the QR batch detail page so progress math stays in one place.
 */

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
  estimateDateStr: string
): number {
  const start = new Date(startDateStr).getTime();
  const end = new Date(estimateDateStr).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
}

export function getDaysRemaining(estimateDateStr: string): number {
  const end = new Date(estimateDateStr).getTime();
  const now = Date.now();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function getDayPassed(startDateStr: string): number {
  const start = new Date(startDateStr).getTime();
  const diffTime = Math.max(0, Date.now() - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
