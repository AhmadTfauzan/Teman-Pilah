import { getProductsForAllocation } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const products = await getProductsForAllocation();
    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}

