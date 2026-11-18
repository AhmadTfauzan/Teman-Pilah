// lib/api/education.ts
// Disesuaikan 100% dengan backend teman-pilah (port 2000)

import { getBaseUrl } from '../api-config';
import { getAuthHeader } from './auth-session';
import { Education } from "@/types";
import { logAdminActivity } from '@/lib/utils';

export const BASE_URL = getBaseUrl();

// Helper to get full thumbnail URL
export function getThumbnailUrl(imagePath?: string | null): string {
  const path = imagePath?.trim();
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    (path.startsWith("/") && !path.startsWith("//"))
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, "");
  const cleanBase = BASE_URL.replace(/\/+$/, "");
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
      (body as { message?: string }).message ?? `HTTP ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

function authHeader(): Record<string, string> {
  return getAuthHeader();
}

export const educationApi = {
  /**
   * GET /api/education
   */
  async getAll(): Promise<Education[]> {
    const res = await fetch(`${BASE_URL}/api/education?limit=100`, {
      cache: "no-store",
    });
    const body = await handleResponse<PaginatedResponse<Education>>(res);
    return body.data;
  },

  /**
   * POST /api/education
   */
  async create(data: FormData): Promise<Education> {
    const res = await fetch(`${BASE_URL}/api/education`, {
      method: "POST",
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<Education>>(res);
    try {
      const title = data.get('title') as string || 'Education Content';
      logAdminActivity(`Created education content: ${title}`, 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * PATCH /api/education/:id
   */
  async update(id: string, data: FormData): Promise<Education> {
    const res = await fetch(`${BASE_URL}/api/education/${id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: data,
    });
    const body = await handleResponse<SingleResponse<Education>>(res);
    try {
      const title = data.get('title') as string || body.data.title || 'Education Content';
      logAdminActivity(`Updated education content: ${title}`, 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  /**
   * DELETE /api/education/:id
   */
  async delete(id: string, title?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/education/${id}`, {
      method: "DELETE",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    await handleResponse<unknown>(res);
    try {
      const display = title ? `: ${title}` : ` (ID: ${id})`;
      logAdminActivity(`Deleted education content${display}`, 'bg-[#DCFCE7]');
    } catch (e) {
      console.error(e);
    }
  },
};
