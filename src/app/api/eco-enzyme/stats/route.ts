import { getStats } from "@/lib/server/eco-enzyme-service";
import { apiSuccess } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET() {
  try {
    const stats = await getStats();
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

