import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError, safeDecodeURIComponent } from "@/lib/server/error";
import { buildProductUpdateData, parseProductPayload } from "@/lib/server/product-payload";
import { resolveOrCreateQrCode } from "@/lib/server/qr-code-service";
import { apiError, apiSuccess } from "@/lib/server/response";

type ProductWithQr = Prisma.ProductGetPayload<{ include: { qrCode: true } }>;

async function findProductByIdentifier(identifier: string) {
  const raw = safeDecodeURIComponent(identifier).trim();
  if (!raw) return null;

  return prisma.product.findFirst({
    where: {
      OR: [
        { id: raw },
        { productCode: { equals: raw, mode: "insensitive" } },
        { qrCode: { code: { equals: raw, mode: "insensitive" } } },
      ],
    },
    include: { qrCode: true },
  });
}

/** Checks whether a QrCode record is referenced by any batch or product (optionally excluding one product). */
async function isQrCodeShared(
  tx: Prisma.TransactionClient,
  qrCodeId: string,
  excludeProductId?: string
): Promise<boolean> {
  const [productCount, batchCount] = await Promise.all([
    tx.product.count({
      where: {
        qrCodeId,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
    }),
    tx.ecoEnzymeBatch.count({
      where: { qrCodeId },
    }),
  ]);
  return productCount > 0 || batchCount > 0;
}

/** Keeps exclusive product QrCode metadata aligned when name or productCode changes without colliding on primaryKey. */
async function syncProductQrMetadata(
  tx: Prisma.TransactionClient,
  existing: ProductWithQr,
  nextName: string | undefined,
  nextProductCode: string | undefined
): Promise<void> {
  if (!existing.qrCodeId || existing.qrCode?.entityType !== "PRODUCT") return;

  const nameChanged = typeof nextName === "string" && nextName !== existing.name;
  const codeChanged =
    typeof nextProductCode === "string" && nextProductCode !== existing.productCode;
  if (!nameChanged && !codeChanged) return;

  if (await isQrCodeShared(tx, existing.qrCodeId, existing.id)) return;

  const qrUpdateData: Prisma.QrCodeUpdateInput = {};

  if (nameChanged) {
    const primaryName = nextName.trim().toLowerCase();
    if (primaryName) qrUpdateData.primaryName = primaryName;
  }

  if (codeChanged) {
    const primaryKey = nextProductCode.trim().toUpperCase();
    if (primaryKey) {
      const keyCollision = await tx.qrCode.findFirst({
        where: {
          id: { not: existing.qrCodeId },
          entityType: "PRODUCT",
          primaryKey: { equals: primaryKey, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (!keyCollision) {
        qrUpdateData.primaryKey = primaryKey;
      }
    }
  }

  if (Object.keys(qrUpdateData).length > 0) {
    await tx.qrCode.update({
      where: { id: existing.qrCodeId },
      data: qrUpdateData,
    });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await findProductByIdentifier(id);
    if (!product) throw new AppError("Produk tidak ditemukan", 404);
    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await findProductByIdentifier(id);
    if (!existing) throw new AppError("Produk tidak ditemukan", 404);

    const payload = await parseProductPayload(req);
    const updateData = buildProductUpdateData(payload);

    if (updateData.name !== undefined && !String(updateData.name).trim()) {
      throw new AppError("Nama produk tidak boleh kosong", 400);
    }

    if (updateData.productCode && updateData.productCode !== existing.productCode) {
      const codeCollision = await prisma.product.findUnique({
        where: { productCode: String(updateData.productCode) },
      });
      if (codeCollision && codeCollision.id !== existing.id) {
        throw new AppError(`Kode produk '${updateData.productCode}' sudah digunakan`, 409);
      }
    }

    if (!existing.qrCodeId) {
      const { qrCode } = await resolveOrCreateQrCode({
        entityType: "PRODUCT",
        entityId: existing.id,
        entityKey: typeof updateData.productCode === "string" ? updateData.productCode : existing.productCode,
        entityName: typeof updateData.name === "string" ? updateData.name : existing.name,
        pathPrefix: "/p",
      });
      updateData.qrCodeId = qrCode.id;
    }

    const nextName = typeof updateData.name === "string" ? updateData.name : undefined;
    const nextProductCode =
      typeof updateData.productCode === "string" ? updateData.productCode : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      await syncProductQrMetadata(tx, existing, nextName, nextProductCode);

      return tx.product.update({
        where: { id: existing.id },
        data: updateData,
        include: { qrCode: true },
      });
    });

    return apiSuccess(updated, "Produk berhasil diupdate");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await findProductByIdentifier(id);
    if (!existing) throw new AppError("Produk tidak ditemukan", 404);

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: existing.id } });

      if (existing.qrCodeId && !(await isQrCodeShared(tx, existing.qrCodeId))) {
        await tx.qrCode.deleteMany({
          where: {
            id: existing.qrCodeId,
            products: { none: {} },
            batches: { none: {} },
          },
        });
      }
    });

    return apiSuccess(null, "Produk berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}
