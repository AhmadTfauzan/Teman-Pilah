import { getBaseUrl } from '../api-config';
import { getAuthHeader } from './auth-session';
import { News } from '@/types';
import { logAdminActivity } from '@/lib/utils';

export const BASE_URL = getBaseUrl();

export interface NewsMutationPayload {
  title: string;
  content: string;
  category?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  slug?: string;
  summary?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  publishDate?: string | null;
  endDate?: string | null;
  partnership?: string | null;
  authors?: string[];
  tags?: string[];
  imageFile?: File | null;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

async function handleResponse<T>(
  res: Response
): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function authHeader(): Record<string, string> {
  return getAuthHeader();
}

export const newsApi = {
  // =========================
  // GET ALL NEWS
  // =========================
  async getAll(params?: {
    limit?: number;
    page?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<News[]> {
    const query = new URLSearchParams();
    query.set('limit', String(params?.limit ?? 100));
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);

    const res = await fetch(`${BASE_URL}/api/news?${query.toString()}`, {
      cache: 'no-store',
    });
    const body = await handleResponse<PaginatedResponse<News>>(res);
    return body.data;
  },

  // =========================
  // CREATE NEWS
  // =========================
  async create(data: NewsMutationPayload): Promise<News> {
    const formData = new FormData();
    const title = data.title || '';
    const content = data.content || '';

    // BASIC FIELDS
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', data.category || '');
    formData.append('status', data.status || 'PUBLISHED');
    formData.append(
      'slug',
      data.slug || title.toLowerCase().replace(/\s+/g, '-')
    );
    formData.append('summary', data.summary || content.slice(0, 120));
    formData.append('visibility', data.visibility || 'PUBLIC');

    if (data.publishDate) {
      formData.append('publishDate', data.publishDate);
    }
    if (data.endDate) {
      formData.append('endDate', data.endDate);
    }
    if (data.partnership) {
      formData.append('partnership', data.partnership);
    }

    // AUTHORS
    if (Array.isArray(data.authors)) {
      data.authors.forEach((author: string) => {
        formData.append('authors', author);
      });
    }

    // TAGS
    if (Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        formData.append('tags', tag);
      });
    }

    // IMAGE FILE
    if (data.imageFile) {
      formData.append('imageUrl', data.imageFile);
    }

    const res = await fetch(`${BASE_URL}/api/news`, {
      method: 'POST',
      headers: {
        ...authHeader(),
      },
      body: formData,
    });

    const body = await handleResponse<ApiResponse<News>>(res);
    try {
      const displayTitle = title || 'Program';
      logAdminActivity(`Created program: ${displayTitle}`, 'bg-[#FDF2F2]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  // =========================
  // UPDATE NEWS
  // =========================
  async update(id: string, data: Partial<NewsMutationPayload>): Promise<News> {
    const formData = new FormData();
    const title = data.title || '';
    const content = data.content || '';

    // BASIC FIELDS
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', data.category || '');
    formData.append('status', data.status || 'PUBLISHED');
    formData.append(
      'slug',
      data.slug || title.toLowerCase().replace(/\s+/g, '-')
    );
    formData.append('summary', data.summary || content.slice(0, 120));
    formData.append('visibility', data.visibility || 'PUBLIC');

    if (data.publishDate) {
      formData.append('publishDate', data.publishDate);
    }
    if (data.endDate) {
      formData.append('endDate', data.endDate);
    }
    if (data.partnership) {
      formData.append('partnership', data.partnership);
    }

    // AUTHORS
    if (Array.isArray(data.authors)) {
      data.authors.forEach((author: string) => {
        formData.append('authors', author);
      });
    }

    // TAGS
    if (Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        formData.append('tags', tag);
      });
    }

    // IMAGE FILE
    if (data.imageFile) {
      formData.append('imageUrl', data.imageFile);
    }

    const res = await fetch(`${BASE_URL}/api/news/${id}`, {
      method: 'PATCH',
      headers: {
        ...authHeader(),
      },
      body: formData,
    });

    const body = await handleResponse<ApiResponse<News>>(res);
    try {
      const title = data.title || body.data.title || 'Program';
      logAdminActivity(`Updated program: ${title}`, 'bg-[#FDF2F2]');
    } catch (e) {
      console.error(e);
    }
    return body.data;
  },

  // =========================
  // DELETE NEWS
  // =========================
  async delete(id: string, title?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/news/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    await handleResponse(res);
    try {
      const display = title ? `: ${title}` : ` (ID: ${id})`;
      logAdminActivity(`Deleted program${display}`, 'bg-[#FDF2F2]');
    } catch (e) {
      console.error(e);
    }
  },
};