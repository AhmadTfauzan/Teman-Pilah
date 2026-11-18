import { getBaseUrl } from '../api-config';
import { getAuthHeader } from './auth-session';
import { BankSampahVideoItem } from '@/types';
import { logAdminActivity } from '@/lib/utils';

export const BASE_URL = getBaseUrl();

export function getVideoThumbnailUrl(thumbnailPath?: string | null): string {
  const path = thumbnailPath?.trim();
  if (!path) return '/activity/Pengmas (1).jpeg';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    (path.startsWith('/') && !path.startsWith('//'))
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  const cleanBase = BASE_URL.replace(/\/+$/, '');
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
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
  return getAuthHeader();
}

export const videoApi = {
  /**
   * GET /api/videos
   */
  async getAll(params?: { search?: string; platform?: string; limit?: number }): Promise<BankSampahVideoItem[]> {
    const query = new URLSearchParams();
    query.set('limit', String(params?.limit ?? 100));
    if (params?.search) query.set('search', params.search);
    if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);

    const res = await fetch(`${BASE_URL}/api/videos?${query.toString()}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<PaginatedResponse<BankSampahVideoItem>>(res);
    return body.data;
  },

  /**
   * GET /api/videos/:id
   */
  async getById(id: string): Promise<BankSampahVideoItem> {
    const res = await fetch(`${BASE_URL}/api/videos/${id}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<SingleResponse<BankSampahVideoItem>>(res);
    return body.data;
  },

  /**
   * POST /api/videos
   */
  async create(data: FormData): Promise<BankSampahVideoItem> {
    const res = await fetch(`${BASE_URL}/api/videos`, {
      method: 'POST',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<BankSampahVideoItem>>(res);
    try {
      logAdminActivity('Menambahkan video Bank Sampah baru', 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * PATCH /api/videos/:id
   */
  async update(id: string, data: FormData): Promise<BankSampahVideoItem> {
    const res = await fetch(`${BASE_URL}/api/videos/${id}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<BankSampahVideoItem>>(res);
    try {
      logAdminActivity('Memperbarui video Bank Sampah', 'bg-[#FEF9C3]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * DELETE /api/videos/:id
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/videos/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    await handleResponse<{ status: string; message: string }>(res);
    try {
      logAdminActivity('Menghapus video Bank Sampah', 'bg-[#FEE2E2]');
    } catch (e) {
      console.error(e);
    }
  },
};

