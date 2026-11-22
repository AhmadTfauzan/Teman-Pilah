export interface QrCodeRecord {
  id: string;
  code: string;
  entityType: 'ECO_ENZYME_BATCH' | 'PRODUCT' | (string & {});
  primaryKey?: string | null;
  primaryName: string;
  targetUrl: string;
  qrDataUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  title: string;
  slug?: string;
  description: string;
  overview?: string;
  image?: string;
  imageUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  partnership?: string;
}

export interface Product {
  id: string;

  productCode?: string;

  name: string;

  category:
    | 'UPCYCLED_GOODS'
    | 'ORGANIC'
    | 'ZERO_WASTE';

  description: string;

  image?: string;
  imageUrl?: string;

  price: number;

  priceUnit: string;

  stock: number;

  stockLabel:
    | 'IN_STOCK'
    | 'BULK_AVAILABLE'
    | 'OUT_OF_STOCK';

  whatsappLink: string;

  qrCodeId?: string | null;
  qrCode?: QrCodeRecord | null;
}

export interface News {
  id: string;

  title: string;

  slug?: string;

  category: string;

  content: string;

  summary?: string;

  // DARI BACKEND
  imageUrl?: string;

  // UNTUK FRONTEND DISPLAY
  image?: string;

  authors?: string[];

  tags?: string[];

  status:
    | 'PUBLISHED'
    | 'DRAFT'
    | 'ARCHIVED';

  visibility?:
    | 'PUBLIC'
    | 'PRIVATE';

  publishDate?: string;
  endDate?: string;
  date?: string;

  createdAt?: string;

  updatedAt?: string;
  partnership?: string;
}

export interface User {
  id: string;

  email: string;

  name: string;

  role: 'ADMIN';
}

export interface Education {
  id: string;
  title: string;
  slug: string;
  overview: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  publishDate?: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt?: string;
  updatedAt?: string;
}

export interface Gallery {
  id: string;
  title?: string | null;
  category?: string | null;
  image: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string | null;
  caption?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type VideoPlatform = 'YouTube' | 'TikTok' | 'Instagram';

export type EcoEnzymeVideoPlatform = 'YouTube' | 'TikTok' | 'Instagram' | 'Local';

export interface BankSampahVideoItem {
  id: string;
  title: string;
  videoUrl: string;
  platform: VideoPlatform;
  thumbnail?: string | null;
  duration?: string | null;
  description?: string | null;
  category?: string | null;
  aspect?: 'wide' | 'tall' | string | null;
  date?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EcoEnzymeVideoItem {
  id: string;
  title: string;
  videoUrl: string;
  platform: EcoEnzymeVideoPlatform;
  thumbnail?: string | null;
  duration?: string | null;
  description?: string | null;
  category?: string | null;
  aspect?: 'wide' | 'tall' | string | null;
  sortOrder?: number;
  tags?: string[] | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type EnzymeType = 'ECO_ENZYME' | 'CLASSIC_ENZYME';

export type EnzymeSweetenerType = 'MOLASE' | 'GULA' | 'MADU';

export type EcoEnzymeBatchStatus =
  | 'IN_PROGRESS'
  | 'HARVESTED'
  | 'FAILED'
  | 'ARCHIVED';

export type EcoEnzymeDisplayStatus =
  | 'FERMENTING'
  | 'READY_TO_HARVEST'
  | 'HARVESTED'
  | 'FAILED'
  | 'ARCHIVED';

export type EnzymeResidueUsage =
  | 'KOMPOS_PADAT'
  | 'PUPUK_ORGANIK'
  | 'STARTER_BATCH_BARU'
  | 'PENGHARUM_TOILET';

export type EnzymeFailureReason =
  | 'KONTAMINASI_JAMUR_HITAM'
  | 'AROMA_BUSUK_MENYENGAT'
  | 'WADAH_BOCOR_RUSAK'
  | 'LAINNYA';

export interface EcoEnzymeLog {
  id?: string;
  batchId?: string;
  logDate: string;
  dayNumber: number;
  phLevel?: number | null;
  aromaStatus?: string | null;
  fungusColor?: string | null;
  actionTaken?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface EcoEnzymeBatch {
  id: string;
  publicCode: string;
  batchCode: string;
  enzymeType?: EnzymeType;
  sweetenerType?: EnzymeSweetenerType;
  containerName: string;
  containerCapacityLiter: number;
  molassesKg: number;
  organicWasteKg: number;
  waterLiter: number;
  organicWasteTypes: string;
  startDate: string;
  harvestEstimate: string;
  actualHarvestDate?: string | null;
  harvestLiter?: number | null;
  efficiencyRatePercent?: number | null;
  residueUsage?: EnzymeResidueUsage | null;
  residueNotes?: string | null;
  allocatedProductId?: string | null;
  allocatedProduct?: Product | null;
  allocatedUnitsAdded?: number | null;
  status: EcoEnzymeBatchStatus;
  displayStatus?: EcoEnzymeDisplayStatus;
  dayPassed?: number;
  progressPercent?: number;
  failureReason?: EnzymeFailureReason | null;
  failureNotes?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  archivedAt?: string | null;
  qrPrintedAt?: string | null;
  qrCodeId?: string | null;
  qrCode?: QrCodeRecord | null;
  reusedQr?: boolean;
  previousBatchId?: string | null;
  previousBatch?: { id: string; publicCode: string; containerName: string } | null;
  nextBatch?: { id: string; publicCode: string; containerName: string } | null;
  nextBatches?: { id: string; publicCode: string; containerName: string }[];
  createdAt?: string;
  updatedAt?: string;
  inspectionLogs?: EcoEnzymeLog[];
  _count?: {
    inspectionLogs: number;
  };
}

export interface EcoEnzymeStats {
  totalBatches: number;
  activeFermenting: number;
  readyToHarvest: number;
  harvestedBatches: number;
  failedBatches: number;
  totalOrganicWasteKg: number;
  totalHarvestLiter: number;
  averageEfficiencyRate: number;
}