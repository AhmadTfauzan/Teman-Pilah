import fs from "fs";
import path from "path";

/**
 * Menghapus file yang baru diupload Multer (jika ada di disk),
 * digunakan pada blok catch saat validasi, aturan bisnis, atau operasi DB gagal.
 */
export const deleteUploadedFile = (file?: { path?: string } | null): void => {
  if (!file?.path) return;
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (err) {
    console.error("Gagal menghapus file upload:", err);
  }
};

/**
 * Menghapus file upload yang tersimpan di dalam direktori `<cwd>/uploads`.
 * Mengabaikan URL eksternal dan path di luar folder `uploads/`.
 */
export const deleteStoredUploadFile = (storedPath?: string | null): void => {
  if (!storedPath) return;
  if (/^https?:\/\//i.test(storedPath)) return;

  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  const normalized = storedPath.replace(/^[/\\]+/, "");
  const fullPath = path.resolve(process.cwd(), normalized);

  if (
    fullPath !== uploadsRoot &&
    fullPath.startsWith(uploadsRoot + path.sep) &&
    fs.existsSync(fullPath)
  ) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error("Gagal menghapus file lama:", err);
    }
  }
};

/**
 * Membersihkan file gagal upload dari Multer baik melalui `file.path` maupun fallback path relatif `uploads/<subDir>/<filename>`.
 */
export const cleanupFailedUpload = (
  file: { path?: string; filename?: string } | undefined,
  subDir: string,
): void => {
  if (!file) return;
  if (file.path) {
    deleteUploadedFile(file);
  }
  if (file.filename) {
    deleteStoredUploadFile(`uploads/${subDir}/${file.filename}`);
  }
};
