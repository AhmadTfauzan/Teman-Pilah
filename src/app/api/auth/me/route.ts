import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";

export async function GET(req: Request) {
  const user = await authenticateRequest(req);
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  return apiSuccess(user);
}
