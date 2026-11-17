import { enrichBatchDynamicStatus } from "@/lib/server/eco-enzyme-service";
import { handleApiError } from "@/lib/server/error";
import { getQrCodeDetailsByCode } from "@/lib/server/qr-code-service";
import { apiSuccess } from "@/lib/server/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code).trim();
    const details = await getQrCodeDetailsByCode(decodedCode);

    return apiSuccess({
      ...details,
      batch: details.batch ? enrichBatchDynamicStatus(details.batch) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
