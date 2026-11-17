import { BankSampahVideo } from "../../../generated/prisma";
import fs from "fs";
import path from "path";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import { VideoRepository } from "./video.repository";
import {
  CreateVideoInput,
  VideoQueryInput,
  UpdateVideoInput,
} from "./video.validation";
import { AppError } from "@/middlewares/error.middleware";

interface VideoListResult {
  data: BankSampahVideo[];
  meta: PaginationMeta;
}

export class VideoService {
  private readonly videoRepository: VideoRepository;

  constructor(videoRepository: VideoRepository) {
    this.videoRepository = videoRepository;
  }

  /**
   * Mendeteksi platform sosmed secara otomatis dari URL
   */
  public detectPlatform(url: string): 'YouTube' | 'TikTok' | 'Instagram' {
    const lower = url.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return "YouTube";
    }
    if (lower.includes("tiktok.com")) {
      return "TikTok";
    }
    if (lower.includes("instagram.com")) {
      return "Instagram";
    }
    return "YouTube";
  }

  /**
   * Mengekstrak YouTube Video ID jika URL berasal dari YouTube
   */
  public extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : null;
  }

  /**
   * Hapus file thumbnail lokal jika ada
   */
  private deleteThumbnailFile(thumbnailPath?: string | null): void {
    if (!thumbnailPath || thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
      return;
    }
    const fullPath = path.join(process.cwd(), thumbnailPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error("Gagal menghapus file thumbnail lama:", err);
      }
    }
  }

  async getAllVideos(query: VideoQueryInput): Promise<VideoListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.videoRepository.findAll({
      skip,
      take,
      search: query.search,
      platform: query.platform,
      category: query.category,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getVideoById(id: string): Promise<BankSampahVideo> {
    const video = await this.videoRepository.findById(id);
    if (!video) {
      throw new AppError("Video Bank Sampah tidak ditemukan", 404);
    }
    return video;
  }

  async createVideo(
    data: CreateVideoInput,
    file?: Express.Multer.File
  ): Promise<BankSampahVideo> {
    // 1. Deteksi platform jika belum diset
    const platform = data.platform || this.detectPlatform(data.videoUrl);

    // 2. Tentukan thumbnail
    let thumbnail = data.thumbnail;
    if (file) {
      thumbnail = `uploads/videos/${file.filename}`;
    } else if (!thumbnail) {
      // Jika YouTube, coba buat otomatis thumbnail hq
      const ytId = this.extractYouTubeId(data.videoUrl);
      if (ytId) {
        thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    // 3. Tentukan rasio aspek jika belum diset
    const aspect =
      data.aspect || (platform === "YouTube" ? "wide" : "tall");

    return this.videoRepository.create({
      title: data.title,
      videoUrl: data.videoUrl,
      platform,
      thumbnail: thumbnail || null,
      duration: data.duration || null,
      description: data.description || null,
      category: data.category || null,
      aspect,
      sortOrder: data.sortOrder ?? 0,
    });
  }

  async updateVideo(
    id: string,
    data: UpdateVideoInput,
    file?: Express.Multer.File
  ): Promise<BankSampahVideo> {
    const existing = await this.getVideoById(id);

    const platform =
      data.platform ||
      (data.videoUrl ? this.detectPlatform(data.videoUrl) : (existing.platform as any));

    let thumbnail = existing.thumbnail;
    if (file) {
      this.deleteThumbnailFile(existing.thumbnail);
      thumbnail = `uploads/videos/${file.filename}`;
    } else if (data.thumbnail !== undefined) {
      thumbnail = data.thumbnail;
    } else if (data.videoUrl && data.videoUrl !== existing.videoUrl) {
      const ytId = this.extractYouTubeId(data.videoUrl);
      if (ytId && (!existing.thumbnail || existing.thumbnail.includes("youtube.com"))) {
        thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    const aspect =
      data.aspect ||
      (data.platform ? (data.platform === "YouTube" ? "wide" : "tall") : existing.aspect);

    return this.videoRepository.update(id, {
      ...(data.title && { title: data.title }),
      ...(data.videoUrl && { videoUrl: data.videoUrl }),
      platform,
      thumbnail,
      duration: data.duration !== undefined ? data.duration : existing.duration,
      description: data.description !== undefined ? data.description : existing.description,
      category: data.category !== undefined ? data.category : existing.category,
      aspect,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const existing = await this.getVideoById(id);
    this.deleteThumbnailFile(existing.thumbnail);
    await this.videoRepository.delete(id);
  }
}

