import { getAllBatches, createBatch } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const includeArchived = searchParams.get("includeArchived") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    const result = await getAllBatches({
      status,
      search,
      includeArchived,
      page,
      limit,
    });

    return apiPaginated(result.data, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const batch = await createBatch(body);
    return apiSuccess(batch, "Batch berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

