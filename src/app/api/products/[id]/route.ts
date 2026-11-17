import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { buildProductUpdateData, parseProductPayload } from "@/lib/server/product-payload";
import { resolveOrCreateQrCode } from "@/lib/server/qr-code-service";
import { apiError, apiSuccess } from "@/lib/server/response";

async function findProductByIdentifier(identifier: string) {
  const raw = decodeURIComponent(identifier).trim();
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

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
      include: { qrCode: true },
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

    await prisma.product.delete({ where: { id: existing.id } });
    return apiSuccess(null, "Produk berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}
