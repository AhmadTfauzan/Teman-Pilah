import { ContentStatus, NewsStatus, NewsVisibility, Prisma } from "@prisma/client";
import slugify from "slug";
import { AppError } from "./error";

export const DEFAULT_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const DANGEROUS_SVG_PATTERNS: RegExp[] = [
  /<script\b/i,
  /<\s*foreignobject\b/i,
  /<\s*(iframe|embed|object)\b/i,
  /\bon\w+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
];

const UNSAFE_URL_SCHEME_PATTERN = /^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i;
const ALLOWED_IMAGE_DATA_URI_PREFIX =
  /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp|x-icon|svg\+xml)(?:;|,)/i;

export type ParsedPayload =
  | { kind: "formData"; formData: FormData }
  | { kind: "json"; body: Record<string, unknown> };

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);?/g, (match, dec: string) => {
      const code = Number(dec);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    })
    .replace(/&#x([0-9a-f]+);?/gi, (match, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    })
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&colon;/gi, ":")
    .replace(/&amp;/gi, "&");
}

function tryDecodeUriComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

/**
 * Validates raw SVG markup against XSS vectors (scripts, foreignObject,
 * active embeds, inline event handlers, and javascript:/vbscript: URIs).
 */
export function assertSafeSvgContent(
  svgMarkup: string,
  errorMessage: string = "Konten SVG tidak aman atau mengandung elemen berbahaya"
): void {
  const sanitizedNulls = svgMarkup.replace(/\u0000/g, "");
  const candidates = [
    sanitizedNulls,
    decodeHtmlEntities(sanitizedNulls),
    tryDecodeUriComponent(sanitizedNulls),
    decodeHtmlEntities(tryDecodeUriComponent(sanitizedNulls)),
  ];

  for (const candidate of candidates) {
    for (const pattern of DANGEROUS_SVG_PATTERNS) {
      if (pattern.test(candidate)) {
        throw new AppError(errorMessage, 400);
      }
    }
    // Catch whitespace/control-char obfuscated javascript: or vbscript: inside SVG attributes
    const compact = candidate.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
    if (compact.includes("javascript:") || compact.includes("vbscript:") || compact.includes("data:text/html")) {
      throw new AppError(errorMessage, 400);
    }
  }
}

/**
 * Validates an image URL or data URI string, blocking unsafe schemes and dangerous SVG payloads
 * in both plain and base64-encoded data URIs.
 */
export function assertSafeImageDataUrl(
  value: string,
  errorMessage: string = "Format gambar atau konten SVG tidak aman"
): string {
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\u0000-\u0020]+/g, "");

  if (UNSAFE_URL_SCHEME_PATTERN.test(compact)) {
    throw new AppError(errorMessage, 400);
  }

  if (compact.toLowerCase().startsWith("data:")) {
    if (!ALLOWED_IMAGE_DATA_URI_PREFIX.test(compact)) {
      throw new AppError("Format data URI gambar tidak didukung", 400);
    }

    if (compact.toLowerCase().startsWith("data:image/svg+xml")) {
      assertSafeSvgContent(trimmed, errorMessage);

      const commaIndex = trimmed.indexOf(",");
      if (commaIndex !== -1) {
        const meta = trimmed.slice(0, commaIndex).toLowerCase();
        const payload = trimmed.slice(commaIndex + 1);
        if (meta.includes(";base64")) {
          const decoded = Buffer.from(payload, "base64").toString("utf8");
          assertSafeSvgContent(decoded, errorMessage);
        } else {
          assertSafeSvgContent(payload, errorMessage);
        }
      }
    }
  }

  return trimmed;
}

/**
 * Validates non-image URL fields (e.g. linkUrl, videoUrl) against executable schemes.
 */
export function assertSafeWebUrl(value: string, fieldLabel: string = "URL"): string {
  const trimmed = value.trim();
  const compact = trimmed.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  if (
    compact.startsWith("javascript:") ||
    compact.startsWith("vbscript:") ||
    compact.startsWith("data:")
  ) {
    throw new AppError(`${fieldLabel} mengandung skema URL yang tidak diizinkan`, 400);
  }
  return trimmed;
}

function bufferLooksLikeSvg(buffer: Buffer, file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("svg") || file.name.toLowerCase().endsWith(".svg")) {
    return true;
  }
  const head = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml") || head.startsWith("<!doctype svg")) {
    return true;
  }
  if (head.startsWith("<!--") && buffer.subarray(0, 1024).toString("utf8").toLowerCase().includes("<svg")) {
    return true;
  }
  return false;
}

/**
 * Converts an uploaded image File into a validated base64 data URI.
 */
export async function uploadedFileToDataUrl(
  file: File,
  maxBytes: number = DEFAULT_MAX_UPLOAD_BYTES
): Promise<string> {
  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    throw new AppError(`Ukuran file gambar maksimal ${maxMb}MB`, 400);
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new AppError("File yang diunggah harus berupa gambar", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isSvg = bufferLooksLikeSvg(buffer, file);

  if (isSvg) {
    assertSafeSvgContent(
      buffer.toString("utf8"),
      "Konten file SVG tidak valid atau mengandung elemen berbahaya"
    );
  }

  const fallbackMime = isSvg ? "image/svg+xml" : "image/png";
  const mimeType = file.type || fallbackMime;
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

  return assertSafeImageDataUrl(dataUrl);
}

/**
 * Parses an incoming Request body supporting both multipart/form-data and application/json.
 */
export async function parseRequestPayload(req: Request): Promise<ParsedPayload> {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      return { kind: "formData", formData };
    } catch {
      throw new AppError("Payload multipart/form-data tidak valid", 400);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("Payload JSON tidak valid", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("Payload JSON harus berupa objek", 400);
  }

  return { kind: "json", body: body as Record<string, unknown> };
}

export function hasField(payload: ParsedPayload, key: string): boolean {
  if (payload.kind === "formData") {
    return payload.formData.has(key);
  }
  return (
    Object.prototype.hasOwnProperty.call(payload.body, key) &&
    payload.body[key] !== undefined
  );
}

export function getStringField(
  payload: ParsedPayload,
  key: string,
  options?: { trim?: boolean }
): string | undefined {
  if (!hasField(payload, key)) return undefined;
  const trim = options?.trim ?? true;

  if (payload.kind === "formData") {
    const entry = payload.formData.get(key);
    if (entry === null) return undefined;
    if (entry instanceof File) {
      throw new AppError(`Field '${key}' tidak boleh berupa file`, 400);
    }
    return trim ? entry.trim() : entry;
  }

  const raw = payload.body[key];
  if (raw === null) return "";
  if (typeof raw !== "string") {
    throw new AppError(`Format field '${key}' harus berupa teks`, 400);
  }
  return trim ? raw.trim() : raw;
}

export function getNullableStringField(
  payload: ParsedPayload,
  key: string
): string | null | undefined {
  if (!hasField(payload, key)) return undefined;

  if (payload.kind === "formData") {
    const entry = payload.formData.get(key);
    if (entry === null) return null;
    if (entry instanceof File) {
      throw new AppError(`Field '${key}' tidak boleh berupa file`, 400);
    }
    const trimmed = entry.trim();
    return trimmed === "" ? null : trimmed;
  }

  const raw = payload.body[key];
  if (raw === null) return null;
  if (typeof raw !== "string") {
    throw new AppError(`Format field '${key}' harus berupa teks`, 400);
  }
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function getIntField(
  payload: ParsedPayload,
  key: string,
  fieldLabel: string = key
): number | undefined {
  if (!hasField(payload, key)) return undefined;

  let raw: unknown;
  if (payload.kind === "formData") {
    const entry = payload.formData.get(key);
    if (entry === null) return undefined;
    if (entry instanceof File) {
      throw new AppError(`${fieldLabel} tidak boleh berupa file`, 400);
    }
    raw = entry;
  } else {
    raw = payload.body[key];
  }

  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "boolean" || typeof raw === "object") {
    throw new AppError(`${fieldLabel} harus berupa bilangan bulat`, 400);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed)) {
      throw new AppError(`${fieldLabel} harus berupa bilangan bulat`, 400);
    }
    return parsed;
  }

  if (typeof raw === "number") {
    if (!Number.isInteger(raw)) {
      throw new AppError(`${fieldLabel} harus berupa bilangan bulat`, 400);
    }
    return raw;
  }

  throw new AppError(`${fieldLabel} harus berupa bilangan bulat`, 400);
}

export function getBooleanField(
  payload: ParsedPayload,
  key: string,
  fieldLabel: string = key
): boolean | undefined {
  if (!hasField(payload, key)) return undefined;

  let raw: unknown;
  if (payload.kind === "formData") {
    const entry = payload.formData.get(key);
    if (entry === null) return undefined;
    if (entry instanceof File) {
      throw new AppError(`${fieldLabel} tidak boleh berupa file`, 400);
    }
    raw = entry;
  } else {
    raw = payload.body[key];
  }

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "") return undefined;
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }

  throw new AppError(`${fieldLabel} harus berupa boolean (true/false)`, 400);
}

export function getDateField(
  payload: ParsedPayload,
  key: string,
  fieldLabel: string = key
): Date | null | undefined {
  if (!hasField(payload, key)) return undefined;

  let raw: unknown;
  if (payload.kind === "formData") {
    const entry = payload.formData.get(key);
    if (entry === null) return null;
    if (entry instanceof File) {
      throw new AppError(`${fieldLabel} tidak boleh berupa file`, 400);
    }
    raw = entry;
  } else {
    raw = payload.body[key];
  }

  if (raw === null) return null;
  if (typeof raw !== "string") {
    throw new AppError(`Format ${fieldLabel} tidak valid`, 400);
  }

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Format ${fieldLabel} tidak valid`, 400);
  }
  return parsed;
}

export function getStringArrayField(
  payload: ParsedPayload,
  key: string,
  fieldLabel: string = key
): string[] | undefined {
  if (!hasField(payload, key)) return undefined;

  if (payload.kind === "formData") {
    const entries = payload.formData.getAll(key);
    const items: string[] = [];
    for (const entry of entries) {
      if (entry instanceof File) {
        throw new AppError(`${fieldLabel} tidak boleh berupa file`, 400);
      }
      for (const part of entry.split(",")) {
        const trimmed = part.trim();
        if (trimmed) items.push(trimmed);
      }
    }
    return items;
  }

  const raw = payload.body[key];
  if (raw === null) return [];
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    const items: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") {
        throw new AppError(`Setiap elemen ${fieldLabel} harus berupa teks`, 400);
      }
      const trimmed = item.trim();
      if (trimmed) items.push(trimmed);
    }
    return items;
  }

  throw new AppError(`Format ${fieldLabel} tidak valid`, 400);
}

/**
 * Extracts an image File (converted to safe data URL) or image URL string from FormData or JSON.
 * Empty File inputs (size === 0) are treated as omitted so PATCH calls do not erase existing images.
 */
export async function getImageField(
  payload: ParsedPayload,
  keys: string | string[],
  options?: {
    maxBytes?: number;
    required?: boolean;
    fieldLabel?: string;
  }
): Promise<string | null | undefined> {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  const required = options?.required ?? false;
  const fieldLabel = options?.fieldLabel ?? keyList[0];

  if (payload.kind === "formData") {
    for (const key of keyList) {
      if (!payload.formData.has(key)) continue;
      const entries = payload.formData.getAll(key);
      for (const entry of entries) {
        if (entry instanceof File && entry.size > 0) {
          return uploadedFileToDataUrl(entry, maxBytes);
        }
      }
    }

    for (const key of keyList) {
      if (!payload.formData.has(key)) continue;
      const entries = payload.formData.getAll(key);
      for (const entry of entries) {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          if (trimmed !== "") {
            return assertSafeImageDataUrl(trimmed);
          }
          if (required) {
            throw new AppError(`${fieldLabel} tidak boleh kosong`, 400);
          }
          return null;
        }
      }
    }

    return undefined;
  }

  for (const key of keyList) {
    if (!hasField(payload, key)) continue;
    const raw = payload.body[key];
    if (raw === null) {
      if (required) {
        throw new AppError(`${fieldLabel} tidak boleh kosong`, 400);
      }
      return null;
    }
    if (typeof raw !== "string") {
      throw new AppError(`Format ${fieldLabel} tidak valid`, 400);
    }
    const trimmed = raw.trim();
    if (trimmed === "") {
      if (required) {
        throw new AppError(`${fieldLabel} tidak boleh kosong`, 400);
      }
      return null;
    }
    return assertSafeImageDataUrl(trimmed);
  }

  return undefined;
}

const VALID_NEWS_STATUSES = new Set<string>(Object.values(NewsStatus));
const VALID_NEWS_VISIBILITIES = new Set<string>(Object.values(NewsVisibility));
const VALID_CONTENT_STATUSES = new Set<string>(Object.values(ContentStatus));

function buildSlug(title: string, providedSlug?: string): string {
  const cleanProvided = providedSlug?.trim();
  if (cleanProvided) return cleanProvided;
  const base = slugify(title) || "item";
  return `${base}-${Date.now()}`;
}

function parseEnumValue<T extends string>(
  raw: string | undefined,
  validSet: Set<string>,
  errorMessage: string
): T | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (!validSet.has(trimmed)) {
    throw new AppError(errorMessage, 400);
  }
  return trimmed as T;
}

export async function parseHeroCreatePayload(
  req: Request
): Promise<Prisma.HeroSlideCreateInput> {
  const payload = await parseRequestPayload(req);
  const imageUrl = await getImageField(payload, ["image", "imageUrl"], {
    maxBytes: 3 * 1024 * 1024,
    required: false,
    fieldLabel: "Gambar slide hero",
  });
  if (!imageUrl) {
    throw new AppError("Gambar slide hero wajib diisi", 400);
  }

  const rawLinkUrl = getNullableStringField(payload, "linkUrl");
  const linkUrl = rawLinkUrl ? assertSafeWebUrl(rawLinkUrl, "linkUrl") : null;

  return {
    imageUrl,
    altText: getNullableStringField(payload, "altText") ?? null,
    caption: getNullableStringField(payload, "caption") ?? null,
    linkUrl,
    linkLabel: getNullableStringField(payload, "linkLabel") ?? null,
    sortOrder: getIntField(payload, "sortOrder", "sortOrder") ?? 0,
    isActive: getBooleanField(payload, "isActive", "isActive") ?? true,
  };
}

export async function parseHeroUpdatePayload(
  req: Request
): Promise<Prisma.HeroSlideUpdateInput> {
  const payload = await parseRequestPayload(req);
  const data: Prisma.HeroSlideUpdateInput = {};

  const imageUrl = await getImageField(payload, ["image", "imageUrl"], {
    maxBytes: 3 * 1024 * 1024,
    required: false,
    fieldLabel: "Gambar slide hero",
  });
  if (imageUrl !== undefined && imageUrl !== null) {
    data.imageUrl = imageUrl;
  }

  const altText = getNullableStringField(payload, "altText");
  if (altText !== undefined) data.altText = altText;

  const caption = getNullableStringField(payload, "caption");
  if (caption !== undefined) data.caption = caption;

  const linkUrl = getNullableStringField(payload, "linkUrl");
  if (linkUrl !== undefined) {
    data.linkUrl = linkUrl ? assertSafeWebUrl(linkUrl, "linkUrl") : null;
  }

  const linkLabel = getNullableStringField(payload, "linkLabel");
  if (linkLabel !== undefined) data.linkLabel = linkLabel;

  const sortOrder = getIntField(payload, "sortOrder", "sortOrder");
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const isActive = getBooleanField(payload, "isActive", "isActive");
  if (isActive !== undefined) data.isActive = isActive;

  return data;
}

export async function parseNewsCreatePayload(
  req: Request
): Promise<Prisma.NewsCreateInput> {
  const payload = await parseRequestPayload(req);
  const title = getStringField(payload, "title");
  if (!title) {
    throw new AppError("Judul program wajib diisi", 400);
  }

  const content = getStringField(payload, "content");
  if (!content) {
    throw new AppError("Konten program wajib diisi", 400);
  }

  const slug = buildSlug(title, getStringField(payload, "slug"));
  const summary = getNullableStringField(payload, "summary") ?? null;
  const imageUrl =
    (await getImageField(payload, ["imageUrl", "image"], {
      fieldLabel: "Banner program",
    })) ?? null;
  const category = getStringField(payload, "category") || "Umum";
  const rawAuthors = getStringArrayField(payload, "authors", "authors");
  const authors = rawAuthors && rawAuthors.length > 0 ? rawAuthors : ["Admin"];
  const tags = getStringArrayField(payload, "tags", "tags") ?? [];
  const status =
    parseEnumValue<NewsStatus>(
      getStringField(payload, "status"),
      VALID_NEWS_STATUSES,
      "Status program tidak valid"
    ) ?? "PUBLISHED";
  const visibility =
    parseEnumValue<NewsVisibility>(
      getStringField(payload, "visibility"),
      VALID_NEWS_VISIBILITIES,
      "Visibility program tidak valid"
    ) ?? "PUBLIC";
  const publishDate =
    getDateField(payload, "publishDate", "Tanggal publikasi") ?? new Date();
  const endDate = getDateField(payload, "endDate", "Tanggal selesai") ?? null;
  const partnership = getNullableStringField(payload, "partnership") ?? null;

  return {
    title,
    slug,
    content,
    summary,
    imageUrl,
    category,
    authors,
    tags,
    status,
    visibility,
    publishDate,
    endDate,
    partnership,
  };
}

export async function parseNewsUpdatePayload(
  req: Request
): Promise<Prisma.NewsUpdateInput> {
  const payload = await parseRequestPayload(req);
  const data: Prisma.NewsUpdateInput = {};

  const title = getStringField(payload, "title");
  if (title !== undefined) {
    if (!title) throw new AppError("Judul program tidak boleh kosong", 400);
    data.title = title;
  }

  const slug = getStringField(payload, "slug");
  if (slug !== undefined) {
    if (!slug) throw new AppError("Slug program tidak boleh kosong", 400);
    data.slug = slug;
  }

  const content = getStringField(payload, "content");
  if (content !== undefined) {
    if (!content) throw new AppError("Konten program tidak boleh kosong", 400);
    data.content = content;
  }

  const summary = getNullableStringField(payload, "summary");
  if (summary !== undefined) data.summary = summary;

  const imageUrl = await getImageField(payload, ["imageUrl", "image"], {
    fieldLabel: "Banner program",
  });
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  const category = getStringField(payload, "category");
  if (category !== undefined) {
    data.category = category || "Umum";
  }

  const authors = getStringArrayField(payload, "authors", "authors");
  if (authors !== undefined) data.authors = authors;

  const tags = getStringArrayField(payload, "tags", "tags");
  if (tags !== undefined) data.tags = tags;

  const status = parseEnumValue<NewsStatus>(
    getStringField(payload, "status"),
    VALID_NEWS_STATUSES,
    "Status program tidak valid"
  );
  if (status !== undefined) data.status = status;

  const visibility = parseEnumValue<NewsVisibility>(
    getStringField(payload, "visibility"),
    VALID_NEWS_VISIBILITIES,
    "Visibility program tidak valid"
  );
  if (visibility !== undefined) data.visibility = visibility;

  const publishDate = getDateField(payload, "publishDate", "Tanggal publikasi");
  if (publishDate !== undefined) data.publishDate = publishDate;

  const endDate = getDateField(payload, "endDate", "Tanggal selesai");
  if (endDate !== undefined) data.endDate = endDate;

  const partnership = getNullableStringField(payload, "partnership");
  if (partnership !== undefined) data.partnership = partnership;

  return data;
}

export async function parseEducationCreatePayload(
  req: Request
): Promise<Prisma.EducationContentCreateInput> {
  const payload = await parseRequestPayload(req);
  const title = getStringField(payload, "title");
  if (!title) {
    throw new AppError("Judul konten edukasi wajib diisi", 400);
  }

  const slug = buildSlug(title, getStringField(payload, "slug"));
  const overview = getStringField(payload, "overview") ?? "";
  const description = getStringField(payload, "description") ?? "";
  const thumbnail =
    (await getImageField(payload, "thumbnail", {
      fieldLabel: "Thumbnail edukasi",
    })) ?? null;
  const tags = getStringArrayField(payload, "tags", "tags") ?? [];
  const status =
    parseEnumValue<ContentStatus>(
      getStringField(payload, "status"),
      VALID_CONTENT_STATUSES,
      "Status konten edukasi tidak valid"
    ) ?? "PUBLISHED";
  const publishDate =
    getDateField(payload, "publishDate", "Tanggal publikasi") ?? new Date();

  return {
    title,
    slug,
    overview,
    description,
    thumbnail,
    tags,
    status,
    publishDate,
  };
}

export async function parseEducationUpdatePayload(
  req: Request
): Promise<Prisma.EducationContentUpdateInput> {
  const payload = await parseRequestPayload(req);
  const data: Prisma.EducationContentUpdateInput = {};

  const title = getStringField(payload, "title");
  if (title !== undefined) {
    if (!title) throw new AppError("Judul konten edukasi tidak boleh kosong", 400);
    data.title = title;
  }

  const slug = getStringField(payload, "slug");
  if (slug !== undefined) {
    if (!slug) throw new AppError("Slug konten edukasi tidak boleh kosong", 400);
    data.slug = slug;
  }

  const overview = getStringField(payload, "overview");
  if (overview !== undefined) data.overview = overview;

  const description = getStringField(payload, "description");
  if (description !== undefined) data.description = description;

  const thumbnail = await getImageField(payload, "thumbnail", {
    fieldLabel: "Thumbnail edukasi",
  });
  if (thumbnail !== undefined) data.thumbnail = thumbnail;

  const tags = getStringArrayField(payload, "tags", "tags");
  if (tags !== undefined) data.tags = tags;

  const status = parseEnumValue<ContentStatus>(
    getStringField(payload, "status"),
    VALID_CONTENT_STATUSES,
    "Status konten edukasi tidak valid"
  );
  if (status !== undefined) data.status = status;

  const publishDate = getDateField(payload, "publishDate", "Tanggal publikasi");
  if (publishDate !== undefined) data.publishDate = publishDate;

  return data;
}

export async function parseGalleryCreatePayload(
  req: Request
): Promise<Prisma.GalleryCreateInput> {
  const payload = await parseRequestPayload(req);
  const image = await getImageField(payload, "image", {
    required: false,
    fieldLabel: "Foto galeri",
  });
  if (!image) {
    throw new AppError("Foto galeri wajib diisi", 400);
  }

  return {
    title: getNullableStringField(payload, "title") ?? null,
    category: getNullableStringField(payload, "category") ?? null,
    image,
    description: getNullableStringField(payload, "description") ?? null,
  };
}

export async function parseGalleryUpdatePayload(
  req: Request
): Promise<Prisma.GalleryUpdateInput> {
  const payload = await parseRequestPayload(req);
  const data: Prisma.GalleryUpdateInput = {};

  const title = getNullableStringField(payload, "title");
  if (title !== undefined) data.title = title;

  const category = getNullableStringField(payload, "category");
  if (category !== undefined) data.category = category;

  const image = await getImageField(payload, "image", {
    required: false,
    fieldLabel: "Foto galeri",
  });
  if (image !== undefined && image !== null) {
    data.image = image;
  }

  const description = getNullableStringField(payload, "description");
  if (description !== undefined) data.description = description;

  return data;
}

export type VideoPayloadVariant = "bankSampah" | "ecoEnzyme";

export interface VideoCreatePayloadData {
  title: string;
  videoUrl: string;
  platform: string;
  thumbnail: string | null;
  duration: string | null;
  description: string | null;
  category: string | null;
  aspect: string;
  sortOrder: number;
}

export interface BankSampahVideoCreatePayloadData extends VideoCreatePayloadData {
  date: string | null;
}

export interface EcoEnzymeVideoCreatePayloadData extends VideoCreatePayloadData {
  tags: string[];
  isActive: boolean;
}

export interface VideoUpdatePayloadData {
  title?: string;
  videoUrl?: string;
  platform?: string;
  thumbnail?: string | null;
  duration?: string | null;
  description?: string | null;
  category?: string | null;
  aspect?: string | null;
  date?: string | null;
  tags?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

async function extractBaseVideoCreatePayload(
  payload: ParsedPayload,
  defaultAspect: string
): Promise<VideoCreatePayloadData> {
  const title = getStringField(payload, "title");
  if (!title) {
    throw new AppError("Judul video wajib diisi", 400);
  }

  const rawVideoUrl = getStringField(payload, "videoUrl");
  if (!rawVideoUrl) {
    throw new AppError("Link video wajib diisi", 400);
  }
  const videoUrl = assertSafeWebUrl(rawVideoUrl, "Link video");

  const thumbnail =
    (await getImageField(payload, "thumbnail", {
      fieldLabel: "Thumbnail video",
    })) ?? null;

  return {
    title,
    videoUrl,
    platform: getStringField(payload, "platform") || "YouTube",
    thumbnail,
    duration: getNullableStringField(payload, "duration") ?? null,
    description: getNullableStringField(payload, "description") ?? null,
    category: getNullableStringField(payload, "category") ?? null,
    aspect: getStringField(payload, "aspect") || defaultAspect,
    sortOrder: getIntField(payload, "sortOrder", "sortOrder") ?? 0,
  };
}

export async function parseVideoCreatePayload(
  req: Request,
  defaultAspect: string = "wide"
): Promise<VideoCreatePayloadData> {
  const payload = await parseRequestPayload(req);
  return extractBaseVideoCreatePayload(payload, defaultAspect);
}

/**
 * Parses Bank Sampah video creation payload including optional `date` label.
 */
export async function parseBankSampahVideoCreatePayload(
  req: Request
): Promise<BankSampahVideoCreatePayloadData> {
  const payload = await parseRequestPayload(req);
  const base = await extractBaseVideoCreatePayload(payload, "wide");
  return {
    ...base,
    date: getNullableStringField(payload, "date") ?? null,
  };
}

/**
 * Parses Eco Enzyme video creation payload including optional `tags` and `isActive`.
 */
export async function parseEcoEnzymeVideoCreatePayload(
  req: Request
): Promise<EcoEnzymeVideoCreatePayloadData> {
  const payload = await parseRequestPayload(req);
  const base = await extractBaseVideoCreatePayload(payload, "tall");
  return {
    ...base,
    tags: getStringArrayField(payload, "tags", "tags") ?? [],
    isActive: getBooleanField(payload, "isActive", "isActive") ?? true,
  };
}

function resolveVideoVariant(
  req: Request,
  explicit?: VideoPayloadVariant
): VideoPayloadVariant | undefined {
  if (explicit) return explicit;
  if (req.url.includes("/eco-enzyme/videos")) return "ecoEnzyme";
  if (req.url.includes("/api/videos")) return "bankSampah";
  return undefined;
}

export async function parseVideoUpdatePayload(
  req: Request,
  variant?: VideoPayloadVariant
): Promise<VideoUpdatePayloadData> {
  const payload = await parseRequestPayload(req);
  const data: VideoUpdatePayloadData = {};
  const resolvedVariant = resolveVideoVariant(req, variant);

  const title = getStringField(payload, "title");
  if (title !== undefined) {
    if (!title) throw new AppError("Judul video tidak boleh kosong", 400);
    data.title = title;
  }

  const rawVideoUrl = getStringField(payload, "videoUrl");
  if (rawVideoUrl !== undefined) {
    if (!rawVideoUrl) throw new AppError("Link video tidak boleh kosong", 400);
    data.videoUrl = assertSafeWebUrl(rawVideoUrl, "Link video");
  }

  const platform = getStringField(payload, "platform");
  if (platform !== undefined) {
    if (!platform) throw new AppError("Platform video tidak boleh kosong", 400);
    data.platform = platform;
  }

  const thumbnail = await getImageField(payload, "thumbnail", {
    fieldLabel: "Thumbnail video",
  });
  if (thumbnail !== undefined) data.thumbnail = thumbnail;

  const duration = getNullableStringField(payload, "duration");
  if (duration !== undefined) data.duration = duration;

  const description = getNullableStringField(payload, "description");
  if (description !== undefined) data.description = description;

  const category = getNullableStringField(payload, "category");
  if (category !== undefined) data.category = category;

  const aspect = getNullableStringField(payload, "aspect");
  if (aspect !== undefined) data.aspect = aspect;

  if (resolvedVariant !== "ecoEnzyme") {
    const date = getNullableStringField(payload, "date");
    if (date !== undefined) data.date = date;
  }

  if (resolvedVariant !== "bankSampah") {
    const tags = getStringArrayField(payload, "tags", "tags");
    if (tags !== undefined) data.tags = tags;

    const isActive = getBooleanField(payload, "isActive", "isActive");
    if (isActive !== undefined) data.isActive = isActive;
  }

  const sortOrder = getIntField(payload, "sortOrder", "sortOrder");
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  return data;
}

const REDACTED_BATCH_FIELDS = [
  "notes",
  "failureReason",
  "failureNotes",
  "residueNotes",
  "efficiencyRatePercent",
  "allocatedProduct",
  "allocatedProductId",
  "allocatedUnitsAdded",
] as const;

const REDACTED_BATCH_LOG_FIELDS = ["actionTaken", "notes", "imageUrl"] as const;

/**
 * Strips internal admin fields from EcoEnzymeBatch (and nested inspectionLogs) for unauthenticated callers.
 */
export function redactPublicEcoEnzymeBatch<T extends Record<string, unknown>>(
  batch: T
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...batch };
  for (const field of REDACTED_BATCH_FIELDS) {
    delete sanitized[field];
  }

  if (Array.isArray(sanitized.inspectionLogs)) {
    sanitized.inspectionLogs = sanitized.inspectionLogs.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const sanitizedLog: Record<string, unknown> = { ...(entry as Record<string, unknown>) };
      for (const logField of REDACTED_BATCH_LOG_FIELDS) {
        delete sanitizedLog[logField];
      }
      return sanitizedLog;
    });
  }

  return sanitized;
}
