import { getBaseUrl } from "../api-config";
import { getAuthHeader } from "./auth-session";
import {
  EcoEnzymeBatch,
  EcoEnzymeLog,
  EcoEnzymeStats,
  EnzymeSweetenerType,
  EnzymeType,
  Product,
} from "@/types";

export const BASE_URL = getBaseUrl();

interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface SingleResponse<T> {
  status: string;
  message: string;
  data: T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? `HTTP ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

function authHeader(): Record<string, string> {
  return getAuthHeader();
}

export const ecoEnzymeApi = {
  /**
   * GET /api/eco-enzyme/stats
   */
  async getStats(): Promise<EcoEnzymeStats> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/stats`, {
      cache: "no-store",
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeStats>>(res);
    return body.data;
  },

  /**
   * GET /api/eco-enzyme/products (Admin - untuk dropdown alokasi)
   */
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/products`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const body = await handleResponse<SingleResponse<Product[]>>(res);
    return body.data;
  },

  /**
   * GET /api/eco-enzyme/batches
   */
  async getAll(params?: {
    status?: string;
    enzymeType?: EnzymeType | string;
    search?: string;
    includeArchived?: boolean;
  }): Promise<EcoEnzymeBatch[]> {
    const query = new URLSearchParams({ limit: "100" });
    if (params?.status) query.append("status", params.status);
    if (params?.enzymeType && params.enzymeType !== "ALL") {
      query.append("enzymeType", params.enzymeType);
    }
    if (params?.search) query.append("search", params.search);
    if (params?.includeArchived) query.append("includeArchived", "true");

    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches?${query.toString()}`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const body = await handleResponse<PaginatedResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * GET /api/eco-enzyme/batches/:id
   */
  async getById(id: string): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * GET /api/eco-enzyme/public/:code
   */
  async getByPublicCode(code: string): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/public/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * POST /api/eco-enzyme/batches
   */
  async create(data: {
    batchCode?: string;
    enzymeType?: EnzymeType;
    sweetenerType?: EnzymeSweetenerType;
    containerName: string;
    containerCapacityLiter?: number;
    molassesKg: number;
    organicWasteKg: number;
    waterLiter: number;
    organicWasteTypes?: string;
    startDate: string;
    harvestEstimate?: string;
    photoUrl?: string | null;
    notes?: string | null;
    previousBatchId?: string | null;
  }): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * PATCH /api/eco-enzyme/batches/:id
   */
  async update(id: string, data: Partial<EcoEnzymeBatch>): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * PATCH /api/eco-enzyme/batches/:id/archive (Soft delete)
   */
  async archive(id: string): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}/archive`, {
      method: "PATCH",
      headers: {
        ...authHeader(),
      },
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * PATCH /api/eco-enzyme/batches/:id/restore (Pulihkan batch)
   */
  async restore(id: string): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}/restore`, {
      method: "PATCH",
      headers: {
        ...authHeader(),
      },
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * POST /api/eco-enzyme/batches/:id/qr-printed (Tandai QR sudah dicetak/diunduh)
   */
  async markQrPrinted(id: string): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}/qr-printed`, {
      method: "POST",
      headers: {
        ...authHeader(),
      },
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * POST /api/eco-enzyme/batches/:id/harvest
   */
  async harvest(
    id: string,
    data: {
      actualHarvestDate?: string;
      harvestLiter: number;
      residueUsage?: string;
      residueNotes?: string | null;
      allocatedProductId?: string | null;
      allocatedUnitsAdded?: number;
      notes?: string | null;
    }
  ): Promise<EcoEnzymeBatch> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}/harvest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeBatch>>(res);
    return body.data;
  },

  /**
   * DELETE /api/eco-enzyme/batches/:id (Hapus permanen galon dari database)
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    await handleResponse<{ status: string; message: string }>(res);
  },

  /**
   * POST /api/eco-enzyme/batches/:id/logs
   */
  async addLog(
    batchId: string,
    data: {
      dayNumber?: number;
      logDate?: string;
      phLevel?: number | null;
      aromaStatus?: string | null;
      fungusColor?: string | null;
      actionTaken?: string | null;
      imageUrl?: string | null;
      notes?: string | null;
    }
  ): Promise<EcoEnzymeLog> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/batches/${batchId}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeLog>>(res);
    return body.data;
  },

  /**
   * DELETE /api/eco-enzyme/logs/:logId
   */
  async deleteLog(logId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/logs/${logId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    await handleResponse<{ status: string; message: string }>(res);
  },
};
