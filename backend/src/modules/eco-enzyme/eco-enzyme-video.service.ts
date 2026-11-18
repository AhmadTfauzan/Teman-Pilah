import { EcoEnzymeVideo } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { EcoEnzymeVideoRepository } from "./eco-enzyme-video.repository";
import {
  CreateEcoEnzymeVideoInput,
  EcoEnzymeVideoQueryInput,
  UpdateEcoEnzymeVideoInput,
} from "./eco-enzyme-video.validation";
import { AppError } from "@/middlewares/error.middleware";

interface VideoListResult {
  data: EcoEnzymeVideo[];
  meta: PaginationMeta;
}

export class EcoEnzymeVideoService {
  private readonly repository: EcoEnzymeVideoRepository;
  private hasCheckedInitialSeed = false;
  private seedPromise: Promise<void> | null = null;

  constructor(repository: EcoEnzymeVideoRepository) {
    this.repository = repository;
  }

  /**
   * Deteksi platform video otomatis dari URL
   */
  public detectPlatform(url: string): "YouTube" | "TikTok" | "Instagram" | "Local" {
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
    if (lower.startsWith("/") || lower.endsWith(".mp4") || lower.endsWith(".webm")) {
      return "Local";
    }
    return "YouTube";
  }

  public extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : null;
  }

  private deleteThumbnailFile(thumbnailPath?: string | null): void {
    deleteStoredUploadFile(thumbnailPath);
  }

  /**
   * Seed otomatis 2 video default jika tabel masih kosong pada cold-start pertama.
   * Menggunakan lock promise in-flight agar request paralel tidak menanam duplikat.
   */
  private async ensureDefaultVideos(): Promise<void> {
    if (this.hasCheckedInitialSeed) {
      return;
    }

    if (!this.seedPromise) {
      this.seedPromise = (async () => {
        try {
          const count = await this.repository.countAll();
          if (count === 0) {
            await this.repository.createMany([
              {
                title: "VIDIO MANFAAT ECO ENZYM",
                videoUrl: "/videos/vidio-manfaat-eco-enzym.mp4",
                platform: "Local",
                duration: "01:46",
                description:
                  "Mengenal ragam manfaat luar biasa cairan fermentasi Eco Enzyme untuk pembersih alami serbaguna, pupuk penyubur tanaman, pengusir hama ramah lingkungan, dan pembersih udara.",
                category: "Manfaat & Khasiat",
                aspect: "tall",
                tags: ["Pembersih Alami", "Pupuk Organik", "Ramah Lingkungan"],
                isActive: true,
                sortOrder: 1,
              },
              {
                title: "VIDIO PEMBUATAN ECO ENZYM",
                videoUrl: "/videos/vidio-pembuatan-eco-enzym.mp4",
                platform: "Local",
                duration: "01:12",
                description:
                  "Panduan lengkap step-by-step membuat Eco Enzyme di rumah menggunakan formula emas 1 : 3 : 10 (Gula : Sampah Organik : Air) dengan hasil fermentasi optimal.",
                category: "Panduan Pembuatan",
                aspect: "tall",
                tags: ["Takaran Rumus 1:3:10", "Kulit Buah Segar", "Fermentasi 90 Hari"],
                isActive: true,
                sortOrder: 2,
              },
            ]);
            console.log("Inisialisasi 2 video edukasi default Eco Enzyme berhasil.");
          }
          this.hasCheckedInitialSeed = true;
        } catch (e) {
          console.error("Gagal inisialisasi default video Eco Enzyme:", e);
        } finally {
          this.seedPromise = null;
        }
      })();
    }

    await this.seedPromise;
  }

  async getAllVideos(query: EcoEnzymeVideoQueryInput): Promise<VideoListResult> {
    await this.ensureDefaultVideos();

    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.repository.findAll({
      skip,
      take,
      search: query.search,
      platform: query.platform,
      category: query.category,
      isActive: query.isActive,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getVideoById(id: string): Promise<EcoEnzymeVideo> {
    const video = await this.repository.findById(id);
    if (!video) {
      throw new AppError("Video edukasi Eco Enzyme tidak ditemukan", 404);
    }
    return video;
  }

  async createVideo(
    data: CreateEcoEnzymeVideoInput,
    file?: Express.Multer.File
  ): Promise<EcoEnzymeVideo> {
    try {
      const platform = data.platform || this.detectPlatform(data.videoUrl);

      let thumbnail = data.thumbnail;
      if (file) {
        thumbnail = `uploads/videos/${file.filename}`;
      } else if (!thumbnail) {
        const ytId = this.extractYouTubeId(data.videoUrl);
        if (ytId) {
          thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      }

      const aspect = data.aspect || (platform === "YouTube" ? "wide" : "tall");

      return await this.repository.create({
        title: data.title,
        videoUrl: data.videoUrl,
        platform,
        thumbnail: thumbnail || null,
        duration: data.duration || null,
        description: data.description || null,
        category: data.category || null,
        aspect,
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      });
    } catch (error) {
      cleanupFailedUpload(file, "videos");
      throw error;
    }
  }

  async updateVideo(
    id: string,
    data: UpdateEcoEnzymeVideoInput,
    file?: Express.Multer.File
  ): Promise<EcoEnzymeVideo> {
    let existing: EcoEnzymeVideo;
    let thumbnail: string | null | undefined;

    try {
      existing = await this.getVideoById(id);

      const platform =
        data.platform ||
        (data.videoUrl ? this.detectPlatform(data.videoUrl) : (existing.platform as any));

      thumbnail = existing.thumbnail;
      if (file) {
        thumbnail = `uploads/videos/${file.filename}`;
      } else if (data.thumbnail !== undefined) {
        thumbnail = data.thumbnail ? data.thumbnail : null;
      } else if (data.videoUrl && data.videoUrl !== existing.videoUrl) {
        const ytId = this.extractYouTubeId(data.videoUrl);
        if (ytId && (!existing.thumbnail || existing.thumbnail.includes("youtube.com"))) {
          thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      }

      const aspect =
        data.aspect ||
        (data.platform ? (data.platform === "YouTube" ? "wide" : "tall") : existing.aspect);

      const updated = await this.repository.update(id, {
        ...(data.title && { title: data.title }),
        ...(data.videoUrl && { videoUrl: data.videoUrl }),
        platform,
        thumbnail,
        duration: data.duration !== undefined ? data.duration : existing.duration,
        description: data.description !== undefined ? data.description : existing.description,
        category: data.category !== undefined ? data.category : existing.category,
        aspect,
        tags: data.tags !== undefined ? data.tags : existing.tags,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
      });

      if (
        existing.thumbnail &&
        existing.thumbnail !== updated.thumbnail &&
        (file || data.thumbnail !== undefined)
      ) {
        this.deleteThumbnailFile(existing.thumbnail);
      }

      return updated;
    } catch (error) {
      cleanupFailedUpload(file, "videos");
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<void> {
    const existing = await this.getVideoById(id);
    await this.repository.delete(id);
    this.deleteThumbnailFile(existing.thumbnail);
  }
}

