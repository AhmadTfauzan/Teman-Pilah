import { getBatchById, updateBatch, deleteBatch } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { redactPublicEcoEnzymeBatch } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const batch = (await getBatchById(id)) as Record<string, unknown>;

    if (!user) {
      if (batch.archivedAt) {
        return apiError("Batch Eco Enzyme tidak ditemukan", 404);
      }
      return apiSuccess(redactPublicEcoEnzymeBatch(batch));
    }

    return apiSuccess(batch);
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
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await updateBatch(id, body);
    return apiSuccess(updated, "Batch berhasil diupdate");
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
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    await deleteBatch(id);
    return apiSuccess(null, "Batch berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

