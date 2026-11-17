import { getBaseUrl } from '../api-config';
import { EcoEnzymeVideoItem } from '@/types';
import { logAdminActivity } from '@/lib/utils';

export const BASE_URL = getBaseUrl();

export function getEcoEnzymeVideoThumbnailUrl(thumbnailPath?: string | null): string {
  if (!thumbnailPath) return '/activity/Pengmas (1).jpeg';
  if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) return thumbnailPath;
  if (thumbnailPath.startsWith('/')) return thumbnailPath;
  return `${BASE_URL}/${thumbnailPath}`;
}

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
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ecoEnzymeVideoApi = {
  /**
   * GET /api/eco-enzyme/videos
   */
  async getAll(params?: { search?: string; platform?: string; limit?: number }): Promise<EcoEnzymeVideoItem[]> {
    const query = new URLSearchParams();
    query.set('limit', String(params?.limit ?? 100));
    if (params?.search) query.set('search', params.search);
    if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);

    const res = await fetch(`${BASE_URL}/api/eco-enzyme/videos?${query.toString()}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<PaginatedResponse<EcoEnzymeVideoItem>>(res);
    return body.data;
  },

  /**
   * GET /api/eco-enzyme/videos/:id
   */
  async getById(id: string): Promise<EcoEnzymeVideoItem> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/videos/${id}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeVideoItem>>(res);
    return body.data;
  },

  /**
   * POST /api/eco-enzyme/videos
   */
  async create(data: FormData): Promise<EcoEnzymeVideoItem> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/videos`, {
      method: 'POST',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeVideoItem>>(res);
    try {
      logAdminActivity('Menambahkan video edukasi Eco Enzyme baru', 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * PATCH /api/eco-enzyme/videos/:id
   */
  async update(id: string, data: FormData): Promise<EcoEnzymeVideoItem> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/videos/${id}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<EcoEnzymeVideoItem>>(res);
    try {
      logAdminActivity('Memperbarui video edukasi Eco Enzyme', 'bg-[#FEF9C3]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * DELETE /api/eco-enzyme/videos/:id
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/videos/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    await handleResponse<{ status: string; message: string }>(res);
    try {
      logAdminActivity('Menghapus video edukasi Eco Enzyme', 'bg-[#FEE2E2]');
    } catch (e) {
      console.error(e);
    }
  },
};

