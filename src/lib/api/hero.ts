import { getBaseUrl } from '../api-config';
import { HeroSlide } from '@/types';
import { logAdminActivity } from '@/lib/utils';

export const BASE_URL = getBaseUrl();

export function getHeroImageUrl(imagePath?: string | null): string {
  if (!imagePath) return '/images/hero/hero-01-kebun.webp';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/')) return imagePath;
  return `${BASE_URL}/${imagePath}`;
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

export const heroApi = {
  /**
   * GET /api/hero
   * all=true to include inactive slides (for admin)
   */
  async getAll(all: boolean = false): Promise<HeroSlide[]> {
    const query = all ? '?all=true&limit=100' : '?limit=100';
    const res = await fetch(`${BASE_URL}/api/hero${query}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<PaginatedResponse<HeroSlide>>(res);
    return body.data;
  },

  /**
   * GET /api/hero/:id
   */
  async getById(id: string): Promise<HeroSlide> {
    const res = await fetch(`${BASE_URL}/api/hero/${id}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<SingleResponse<HeroSlide>>(res);
    return body.data;
  },

  /**
   * POST /api/hero
   */
  async create(data: FormData): Promise<HeroSlide> {
    const res = await fetch(`${BASE_URL}/api/hero`, {
      method: 'POST',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<HeroSlide>>(res);
    try {
      logAdminActivity('Menambahkan banner hero baru', 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * PATCH /api/hero/:id
   */
  async update(id: string, data: FormData): Promise<HeroSlide> {
    const res = await fetch(`${BASE_URL}/api/hero/${id}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<HeroSlide>>(res);
    try {
      logAdminActivity(`Memperbarui banner hero (ID: ${id})`, 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * PATCH /api/hero/:id/toggle
   */
  async toggleActive(id: string): Promise<HeroSlide> {
    const res = await fetch(`${BASE_URL}/api/hero/${id}/toggle`, {
      method: 'PATCH',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    const body = await handleResponse<SingleResponse<HeroSlide>>(res);
    try {
      logAdminActivity(`Mengubah status banner hero (ID: ${id})`, 'bg-[#FEF9C3]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * DELETE /api/hero/:id
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/hero/${id}`, {
      method: 'DELETE',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
    await handleResponse<unknown>(res);
    try {
      logAdminActivity(`Menghapus banner hero (ID: ${id})`, 'bg-[#FEE2E2]');
    } catch (e) {
      console.error(e);
    }
  },
};

