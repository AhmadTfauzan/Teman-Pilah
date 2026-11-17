import { getProductsForAllocation } from "@/lib/server/eco-enzyme-service";
import { apiSuccess } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET() {
  try {
    const products = await getProductsForAllocation();
    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}
