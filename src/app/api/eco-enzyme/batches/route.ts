import { getAllBatches, createBatch } from "@/lib/server/eco-enzyme-service";
import { authenticateRequest } from "@/lib/server/auth";
import { redactPublicEcoEnzymeBatch } from "@/lib/server/form-payload";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const user = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get("status");
    const enzymeType = searchParams.get("enzymeType");
    const search = searchParams.get("search");
    const rawIncludeArchived = searchParams.get("includeArchived") === "true";
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    const status = !user && rawStatus === "ARCHIVED" ? null : rawStatus;
    const includeArchived = user ? rawIncludeArchived : false;

    const result = await getAllBatches({
      status,
      enzymeType,
      search,
      includeArchived,
      page,
      limit,
    });

    const batches = result.data as Record<string, unknown>[];
    const data = user
      ? batches
      : batches
          .filter((batch) => !batch.archivedAt)
          .map((batch) => redactPublicEcoEnzymeBatch(batch));

    return apiPaginated(data, result.meta);
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

