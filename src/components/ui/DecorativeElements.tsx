import React from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMAN PILAH - DECORATIVE BRAND ELEMENTS (Figma Frame 48)
 * Sesuai panduan grafis:
 * 1. SolidLeaf: Daun hijau solid dengan tulang daun putih (Group 29)
 * 2. OutlineLeaf: Daun garis lengkung besar dengan tulang tengah (Group 30)
 * 3. ConcentricCircles: 4 lingkaran target konsentris (Oranye / Hijau Gelap)
 * 4. CornerCircle: Aksen lengkung sudut bulat 300px
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface SolidLeafProps {
  className?: string;
  size?: number | string;
  fill?: string;
  borderColor?: string;
  veinColor?: string;
  style?: React.CSSProperties;
}

export function SolidLeaf({
  className = '',
  size = 120,
  fill = '#203220',
  borderColor = '#203220',
  veinColor = '#FFFFFF',
  style = {},
}: SolidLeafProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: 'rotate(-180deg)',
        transformOrigin: 'center',
        ...style,
      }}
      className={`shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Outer Leaf Silhouette */}
      <path
        d="M 100 15 C 25 80 25 200 100 265 C 175 200 175 80 100 15 Z"
        fill={fill}
        stroke={borderColor}
        strokeWidth="2"
      />
      {/* Central Stem */}
      <path
        d="M 100 255 L 100 70"
        stroke={veinColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Vein Pair 1 (Top) */}
      <path
        d="M 100 120 L 55 85"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 100 120 L 145 85"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Vein Pair 2 (Middle) */}
      <path
        d="M 100 165 L 45 130"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 100 165 L 155 130"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Vein Pair 3 (Bottom) */}
      <path
        d="M 100 210 L 65 175"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 100 210 L 135 175"
        stroke={veinColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface OutlineLeafProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function OutlineLeaf({
  className = '',
  size = 280,
  color = '#203220',
  strokeWidth = 6.72,
  style = {},
}: OutlineLeafProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: 'rotate(-180deg)',
        transformOrigin: 'center',
        ...style,
      }}
      className={`shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Leaf Outline */}
      <path
        d="M 150 20 C 35 120 35 300 150 400 C 265 300 265 120 150 20 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Spine */}
      <path
        d="M 150 395 L 150 110"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Vein Pair 1 (Top) */}
      <path
        d="M 150 190 L 80 135"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M 150 190 L 220 135"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Vein Pair 2 (Middle) */}
      <path
        d="M 150 260 L 65 205"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M 150 260 L 235 205"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Vein Pair 3 (Bottom) */}
      <path
        d="M 150 330 L 95 275"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M 150 330 L 205 275"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ConcentricCirclesProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  centerFill?: boolean;
}

export function ConcentricCircles({
  className = '',
  size = 360,
  color = '#FC9634',
  strokeWidth = 3.6,
  centerFill = true,
}: ConcentricCirclesProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Outer Ring 1 (2% inset = radius 170) */}
      <circle
        cx="180"
        cy="180"
        r="170"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Ring 2 (14% inset = radius 130) */}
      <circle
        cx="180"
        cy="180"
        r="130"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Ring 3 (26% inset = radius 90) */}
      <circle
        cx="180"
        cy="180"
        r="90"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Center Filled Circle (38% inset = radius 45) */}
      <circle
        cx="180"
        cy="180"
        r="45"
        fill={centerFill ? color : 'none'}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

interface CornerCircleProps {
  className?: string;
  size?: number | string;
  color?: string;
}

export function CornerCircle({
  className = '',
  size = 300,
  color = '#012D1D',
}: CornerCircleProps) {
  return (
    <div
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        backgroundColor: color,
        borderRadius: '50%',
      }}
      className={`shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}

