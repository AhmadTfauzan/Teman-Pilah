import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { assertSafeImageDataUrl } from "@/lib/server/form-payload";
import { buildPaginationMeta, parsePagination } from "@/lib/server/pagination";
import {
  findQrByCodeOrEntity,
  QrEntityType,
  resolveOrCreateQrCode,
  saveQrImage,
} from "@/lib/server/qr-code-service";
import { apiError, apiPaginated, apiSuccess } from "@/lib/server/response";

const MAX_QR_DATA_URL_LENGTH = 200 * 1024;

function parseEntityType(value: unknown): QrEntityType | null {
  if (value === undefined || value === null || value === "") return null;
  if (value === "ECO_ENZYME_BATCH" || value === "PRODUCT") {
    return value;
  }
  throw new AppError("entityType harus ECO_ENZYME_BATCH atau PRODUCT", 400);
}

function validateQrDataUrl(qrDataUrl: unknown): string {
  if (typeof qrDataUrl !== "string" || !qrDataUrl.trim()) {
    throw new AppError("Data gambar QR wajib diisi", 400);
  }
  const trimmed = qrDataUrl.trim();
  if (trimmed.length > MAX_QR_DATA_URL_LENGTH) {
    throw new AppError("Ukuran data gambar QR melebihi batas maksimal 200KB", 400);
  }

  const lower = trimmed.toLowerCase();
  const isPng = lower.startsWith("data:image/png;base64,");
  const isSvg = lower.startsWith("data:image/svg+xml");
  if (!isPng && !isSvg) {
    throw new AppError(
      "Format qrDataUrl harus berupa data:image/png;base64,... atau data:image/svg+xml",
      400
    );
  }

  if (isSvg) {
    assertSafeImageDataUrl(trimmed, "Konten SVG QR tidak valid");
  }

  return trimmed;
}

function validateTargetUrl(targetUrl: unknown): string | null | undefined {
  if (targetUrl === undefined) return undefined;
  if (targetUrl === null || targetUrl === "") return null;
  if (typeof targetUrl !== "string") {
    throw new AppError("Format targetUrl tidak valid", 400);
  }
  const trimmed = targetUrl.trim();
  if (
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("http://") &&
    !(trimmed.startsWith("/") && !trimmed.startsWith("//"))
  ) {
    throw new AppError("Format targetUrl harus berupa URL http/https atau path relatif", 400);
  }
  return trimmed;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const entityType = parseEntityType(searchParams.get("entityType"));
    const entityId = searchParams.get("entityId");
    const entityKey = searchParams.get("entityKey");
    const entityName = searchParams.get("entityName");

    const hasLookupParams = Boolean(
      code?.trim() || entityId?.trim() || entityKey?.trim() || entityName?.trim()
    );

    if (hasLookupParams) {
      const qrCode = await findQrByCodeOrEntity({
        code,
        entityType,
        entityId,
        entityKey,
        entityName,
      });
      if (!qrCode) {
        return apiError("QR Code tidak ditemukan", 404);
      }
      return apiSuccess(qrCode);
    }

    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where = entityType ? { entityType } : {};
    const [data, total] = await Promise.all([
      prisma.qrCode.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.qrCode.count({ where }),
    ]);

    return apiPaginated(data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();

    const isSaveImageAction =
      body?.action === "save-image" ||
      (Boolean(body?.qrDataUrl) &&
        Boolean(body?.qrCodeId || body?.code || body?.entityId));

    if (isSaveImageAction) {
      const entityType = parseEntityType(body?.entityType);
      const qrDataUrl = validateQrDataUrl(body?.qrDataUrl);
      const targetUrl = validateTargetUrl(body?.targetUrl);

      const result = await saveQrImage({
        qrCodeId: body?.qrCodeId,
        code: body?.code,
        entityType,
        entityId: body?.entityId,
        targetUrl,
        qrDataUrl,
        force: Boolean(body?.force),
      });

      return apiSuccess(
        result,
        result.updated ? "Gambar QR berhasil disimpan" : "Gambar QR sudah tersimpan"
      );
    }

    const entityType = parseEntityType(body?.entityType);
    if (!entityType) {
      throw new AppError("entityType wajib diisi (ECO_ENZYME_BATCH atau PRODUCT)", 400);
    }

    const entityId = typeof body?.entityId === "string" ? body.entityId.trim() : null;

    const pathPrefix = body?.pathPrefix;
    if (pathPrefix !== undefined && pathPrefix !== null && pathPrefix !== "/b" && pathPrefix !== "/p") {
      throw new AppError("pathPrefix harus /b atau /p", 400);
    }

    const entityName = typeof body?.entityName === "string" ? body.entityName : "";
    if (!entityName.trim() && !entityId) {
      throw new AppError("entityName wajib diisi", 400);
    }

    const result = await resolveOrCreateQrCode({
      entityType,
      entityId,
      previousEntityId: typeof body?.previousEntityId === "string" ? body.previousEntityId.trim() : null,
      entityKey: typeof body?.entityKey === "string" ? body.entityKey : null,
      entityName,
      pathPrefix: pathPrefix ?? undefined,
    });

    return apiSuccess(
      result,
      result.reused ? "QR Code ditemukan dan digunakan kembali" : "QR Code baru berhasil dibuat",
      result.reused ? 200 : 201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
