'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Sparkles } from 'lucide-react';
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
  onSaved,
}: PersistentQrCodeProps) {
  const entityIdentity = `${entityType}::${entityId ?? ''}::${entityKey ?? ''}::${entityName}`;
  const [asyncState, setAsyncState] = useState<AsyncQrState | null>(null);

  const internalCanvasRef = useRef<HTMLDivElement | null>(null);
  const internalSvgRef = useRef<HTMLDivElement | null>(null);
  const resolvedIdentityRef = useRef<string>('');
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
    if (qrCode?.id) return;
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
      });

    return () => {
      cancelled = true;
    };
  }, [qrCode?.id, entityIdentity, entityType, entityId, entityKey, entityName]);

  const effectiveValue = value || resolvedQr?.targetUrl || '';
  const hasCachedImage = Boolean(
    resolvedQr?.qrDataUrl &&
      (!value ||
        resolvedQr.targetUrl === value ||
        (resolvedQr.code && value.endsWith('/' + resolvedQr.code)))
  );

  // Persist rendered canvas PNG once per resolvedQr.id + effectiveValue when no cached image exists
  useEffect(() => {
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
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [
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

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs inline-block">
        {hasCachedImage && resolvedQr?.qrDataUrl ? (
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

        <div ref={setSvgContainerRef} className="hidden">
          <QRCodeSVG
            value={effectiveValue}
            size={Math.max(size, 300)}
            level={level}
            marginSize={marginSize}
          />
        </div>
      </div>

      {showStatusBadge && (
        <div className="print:hidden">
          {showPermanentBadge ? (
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
