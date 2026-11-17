import { deleteLog } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { logId } = await params;
    await deleteLog(logId);
    return apiSuccess(null, "Log inspeksi berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

