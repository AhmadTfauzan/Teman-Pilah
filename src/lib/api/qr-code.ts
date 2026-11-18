import { getBaseUrl } from '../api-config';
import { getAuthHeader } from './auth-session';
import { QrCodeRecord } from '@/types';

interface ApiResponse<T> {
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

export const qrCodeApi = {
  async resolveOrCreate(payload: {
    entityType: 'ECO_ENZYME_BATCH' | 'PRODUCT';
    entityId?: string;
    previousEntityId?: string | null;
    entityKey?: string | null;
    entityName: string;
    pathPrefix?: '/b' | '/p';
  }): Promise<{ qrCode: QrCodeRecord; reused: boolean }> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/qr-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        action: 'resolve',
        ...payload,
      }),
    });
    const body = await handleResponse<ApiResponse<{ qrCode: QrCodeRecord; reused: boolean }>>(res);
    return body.data;
  },

  async saveImage(payload: {
    qrCodeId?: string;
    code?: string;
    entityType?: 'ECO_ENZYME_BATCH' | 'PRODUCT';
    entityId?: string;
    targetUrl?: string;
    qrDataUrl: string;
    force?: boolean;
  }): Promise<{ qrCode: QrCodeRecord; updated: boolean }> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/qr-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        action: 'save-image',
        ...payload,
      }),
    });
    const body = await handleResponse<ApiResponse<{ qrCode: QrCodeRecord; updated: boolean }>>(res);
    return body.data;
  },

  async getByEntity(entityType: string, entityId: string): Promise<QrCodeRecord | null> {
    const baseUrl = getBaseUrl();
    const query = new URLSearchParams({
      entityType,
      entityId,
    });
    const res = await fetch(`${baseUrl}/api/qr-codes?${query.toString()}`, {
      cache: 'no-store',
    });

    if (res.status === 404) {
      return null;
    }

    const body = await handleResponse<ApiResponse<QrCodeRecord>>(res);
    return body.data ?? null;
  },
};
