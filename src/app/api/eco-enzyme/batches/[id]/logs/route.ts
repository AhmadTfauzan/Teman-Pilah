import { addLog } from "@/lib/server/eco-enzyme-service";
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
    const body = await req.json();
    const log = await addLog(id, body);
    return apiSuccess(log, "Log inspeksi berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

