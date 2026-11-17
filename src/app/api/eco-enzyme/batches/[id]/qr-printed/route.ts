import { markQrPrinted } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    const batch = await markQrPrinted(id);
    return apiSuccess(batch, "Label QR berhasil ditandai telah dicetak");
  } catch (error) {
    return handleApiError(error);
  }
}
