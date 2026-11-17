import { restoreBatch } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

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
    const batch = await restoreBatch(id);
    return apiSuccess(batch, "Batch berhasil dipulihkan");
  } catch (error) {
    return handleApiError(error);
  }
}

