import { getBatchByPublicCode } from "@/lib/server/eco-enzyme-service";
import { apiSuccess } from "@/lib/server/response";
import { handleApiError, safeDecodeURIComponent } from "@/lib/server/error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const batch = await getBatchByPublicCode(safeDecodeURIComponent(code));
    return apiSuccess(batch);
  } catch (error) {
    return handleApiError(error);
  }
}

