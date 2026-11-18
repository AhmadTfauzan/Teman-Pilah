'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { QrCodeRecord } from '@/types';
import { qrCodeApi } from '@/lib/api/qr-code';

export interface PersistentQrCodeProps {
  value: string;
  qrCode?: QrCodeRecord | null;
  entityType: 'ECO_ENZYME_BATCH' | 'PRODUCT';
  entityId?: string;
  entityKey?: string | null;
  entityName: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  marginSize?: number;
  canvasWrapperRef?: React.RefObject<HTMLDivElement | null>;
  svgWrapperRef?: React.RefObject<HTMLDivElement | null>;
  reused?: boolean;
  showStatusBadge?: boolean;
  isPublicView?: boolean;
  onSaved?: (qr: QrCodeRecord) => void;
}

interface AsyncQrState {
  identity: string;
  qrCode: QrCodeRecord;
  reused: boolean;
  wasNewlyGenerated: boolean;
}

/**
 * Renders a persistent QR code enforcing 1 entity ID/key/name = 1 QR code.
 * Reuses stored qrDataUrl via <img> when available and persists generated canvas PNG once.
 */
export function PersistentQrCode({
  value,
  qrCode,
  entityType,
  entityId,
  entityKey,
  entityName,
  size = 160,
  level = 'Q',
  marginSize = 2,
  canvasWrapperRef,
  svgWrapperRef,
  reused = false,
  showStatusBadge = true,
  isPublicView = false,
  onSaved,
}: PersistentQrCodeProps) {
  const entityIdentity = `${entityType}::${entityId ?? ''}::${entityKey ?? ''}::${entityName}`;
  const [asyncState, setAsyncState] = useState<AsyncQrState | null>(null);
  const [resolveErrorIdentity, setResolveErrorIdentity] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const internalCanvasRef = useRef<HTMLDivElement | null>(null);
  const internalSvgRef = useRef<HTMLDivElement | null>(null);
  const resolvedIdentityRef = useRef<string | null>(null);
  const savedKeyRef = useRef<string>('');
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const setCanvasContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalCanvasRef.current = node;
      if (canvasWrapperRef) {
        canvasWrapperRef.current = node;
      }
    },
    [canvasWrapperRef]
  );

  const setSvgContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalSvgRef.current = node;
      if (svgWrapperRef) {
        svgWrapperRef.current = node;
      }
    },
    [svgWrapperRef]
  );

  const matchingAsyncState =
    asyncState && asyncState.identity === entityIdentity ? asyncState : null;
  const resolvedQr = matchingAsyncState?.qrCode ?? qrCode ?? null;
  const isReused = matchingAsyncState ? matchingAsyncState.reused : Boolean(reused);
  const wasNewlyGenerated = matchingAsyncState?.wasNewlyGenerated ?? false;

  // Fetch or reuse canonical QrCodeRecord once if qrCode?.id is missing
  useEffect(() => {
    const hasAdminToken =
      typeof window !== 'undefined' && Boolean(localStorage.getItem('token')?.trim());
    if (qrCode?.id) return;
    if (isPublicView || !hasAdminToken) return;
    if (!entityName.trim() && !entityId) return;
    if (resolvedIdentityRef.current === entityIdentity) return;

    resolvedIdentityRef.current = entityIdentity;
    let cancelled = false;

    qrCodeApi
      .resolveOrCreate({
        entityType,
        entityId,
        entityKey,
        entityName,
        pathPrefix: entityType === 'PRODUCT' ? '/p' : '/b',
      })
      .then((res) => {
        if (cancelled) return;
        setResolveErrorIdentity(null);
        setAsyncState({
          identity: entityIdentity,
          qrCode: res.qrCode,
          reused: res.reused,
          wasNewlyGenerated: !res.reused && !res.qrCode.qrDataUrl,
        });
        onSavedRef.current?.(res.qrCode);
      })
      .catch((err) => {
        console.error('Failed to resolve persistent QR code:', err);
        if (resolvedIdentityRef.current === entityIdentity) {
          resolvedIdentityRef.current = null;
        }
        if (!cancelled) {
          setResolveErrorIdentity(entityIdentity);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrCode?.id, isPublicView, entityIdentity, entityType, entityId, entityKey, entityName, retryNonce]);

  const effectiveValue = value || resolvedQr?.targetUrl || '';
  const hasCachedImage = Boolean(
    resolvedQr?.qrDataUrl && (!value || resolvedQr.targetUrl === value)
  );

  // Persist rendered canvas PNG once per resolvedQr.id + effectiveValue when no cached image exists
  useEffect(() => {
    const hasAdminToken =
      typeof window !== 'undefined' && Boolean(localStorage.getItem('token')?.trim());
    if (isPublicView || !hasAdminToken) return;
    if (hasCachedImage) return;
    if (!resolvedQr?.id || !effectiveValue) return;

    const saveKey = `${entityIdentity}::${resolvedQr.id}::${effectiveValue}`;
    if (savedKeyRef.current === saveKey) return;

    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      const canvas = internalCanvasRef.current?.querySelector('canvas');
      if (!canvas) return;

      let qrDataUrl = '';
      try {
        qrDataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Failed to extract QR canvas image:', err);
        return;
      }

      if (!qrDataUrl || !qrDataUrl.startsWith('data:image/png;base64,')) return;
      savedKeyRef.current = saveKey;

      qrCodeApi
        .saveImage({
          qrCodeId: resolvedQr.id,
          code: resolvedQr.code,
          entityType,
          entityId,
          targetUrl: effectiveValue,
          qrDataUrl,
        })
        .then((res) => {
          if (cancelled) return;
          setAsyncState({
            identity: entityIdentity,
            qrCode: res.qrCode,
            reused: isReused,
            wasNewlyGenerated: !isReused,
          });
          onSavedRef.current?.(res.qrCode);
        })
        .catch((err) => {
          console.error('Failed to save QR image:', err);
          if (savedKeyRef.current === saveKey) {
            savedKeyRef.current = '';
          }
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [
    isPublicView,
    hasCachedImage,
    resolvedQr?.id,
    resolvedQr?.code,
    effectiveValue,
    entityIdentity,
    entityType,
    entityId,
    isReused,
  ]);

  const showPermanentBadge = isReused || (hasCachedImage && !wasNewlyGenerated);
  const isWaitingForQr = !hasCachedImage && !effectiveValue;
  const isResolveError = resolveErrorIdentity === entityIdentity;

  const handleRetryResolve = () => {
    resolvedIdentityRef.current = null;
    setResolveErrorIdentity(null);
    setRetryNonce((prev) => prev + 1);
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs inline-block">
        {isWaitingForQr ? (
          isResolveError ? (
            <div
              style={{ width: size, height: size }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-stone-50 border border-dashed border-stone-300 p-3 text-center"
            >
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <span className="text-[11px] font-medium text-stone-600 leading-tight">
                Gagal memuat QR
              </span>
              <button
                type="button"
                onClick={handleRetryResolve}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Coba Lagi
              </button>
            </div>
          ) : (
            <div
              style={{ width: size, height: size }}
              role="status"
              aria-label="Memuat QR Code"
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-stone-100 animate-pulse border border-stone-200"
            >
              <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
              <span className="text-[10px] font-medium text-stone-500">
                Memuat QR...
              </span>
            </div>
          )
        ) : hasCachedImage && resolvedQr?.qrDataUrl ? (
          <>
            <img
              src={resolvedQr.qrDataUrl}
              width={size}
              height={size}
              alt="QR Code"
              className="block rounded-lg"
            />
            <div ref={setCanvasContainerRef} className="hidden">
              <QRCodeCanvas
                value={effectiveValue}
                size={size}
                level={level}
                marginSize={marginSize}
              />
            </div>
          </>
        ) : (
          <div ref={setCanvasContainerRef}>
            <QRCodeCanvas
              value={effectiveValue}
              size={size}
              level={level}
              marginSize={marginSize}
            />
          </div>
        )}

        {effectiveValue && (
          <div ref={setSvgContainerRef} className="hidden">
            <QRCodeSVG
              value={effectiveValue}
              size={Math.max(size, 300)}
              level={level}
              marginSize={marginSize}
            />
          </div>
        )}
      </div>

      {showStatusBadge && !isPublicView && (
        <div className="print:hidden">
          {isWaitingForQr ? (
            isResolveError ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Gagal Memuat QR dari Database
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-[10px] font-bold text-stone-600">
                <Loader2 className="w-3 h-3 text-stone-500 animate-spin" />
                Menyiapkan QR Code...
              </span>
            )
          ) : showPermanentBadge ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              QR Permanen Tersimpan (1 ID = 1 QR)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
              <Sparkles className="w-3 h-3 text-amber-600" />
              QR Baru Disimpan ke Database
            </span>
          )}
        </div>
      )}
    </div>
  );
}
