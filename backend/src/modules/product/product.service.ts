import { Product } from "../../../generated/prisma";
import {
  buildPaginationMeta,
  parsePagination,
  PaginationMeta,
} from "../../utils/pagination";
import {
  cleanupFailedUpload,
  deleteStoredUploadFile,
} from "../../utils/file";
import { ProductRepository } from "./product.repository";
import {
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from "./product.validation";
import { AppError } from "@/middlewares/error.middleware";

interface ProductListResult {
  data: Product[];
  meta: PaginationMeta;
}

export class ProductService {
  private readonly productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository;
  }

  private deleteImageFile(imagePath: string): void {
    deleteStoredUploadFile(imagePath);
  }

  /**
   * Mengambil daftar produk dengan pagination, filter, dan pencarian.
   *
   * @param query - Query parameter dari request (page, limit, category, search, stockLabel)
   * @returns Daftar produk beserta meta pagination
   */
  async getAllProducts(query: ProductQueryInput): Promise<ProductListResult> {
    const { skip, take, page, limit } = parsePagination(query);

    const { data, total } = await this.productRepository.findAll({
      skip,
      take,
      category: query.category,
      stockLabel: query.stockLabel,
      search: query.search,
    });

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Mengambil detail satu produk berdasarkan ID.
   * Melempar error 404 jika produk tidak ditemukan.
   *
   * @param id - ID produk (cuid)
   * @returns Data produk yang ditemukan
   * @throws AppError 404 jika produk tidak ada
   */
  async getProductById(id: string): Promise<Product> {
    const product: Product | null = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Produk tidak ditemukan", 404);
    }

    return product;
  }

  /**
   * Membuat produk baru.
   * Menyimpan path gambar jika ada file yang diupload.
   *
   * @param data - Data produk yang sudah divalidasi
   * @param file - File gambar dari multer (opsional)
   * @returns Produk yang baru dibuat
   */
  async createProduct(
    data: CreateProductInput,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const imagePath: string | undefined = file
      ? `uploads/products/${file.filename}`
      : undefined;

    try {
      return await this.productRepository.create(data, imagePath);
    } catch (error) {
      cleanupFailedUpload(file, "products");
      throw error;
    }
  }

  /**
   * Mengupdate produk berdasarkan ID.
   * Jika ada gambar baru yang diupload, gambar lama akan otomatis dihapus dari disk
   * setelah pembaruan database berhasil.
   * Melempar error 404 jika produk tidak ditemukan.
   *
   * @param id - ID produk yang akan diupdate
   * @param data - Field yang ingin diupdate (semua opsional)
   * @param file - File gambar baru dari multer (opsional)
   * @returns Produk yang telah diupdate
   * @throws AppError 404 jika produk tidak ada
   */
  async updateProduct(
    id: string,
    data: UpdateProductInput,
    file?: Express.Multer.File,
  ): Promise<Product> {
    try {
      const existingProduct: Product = await this.getProductById(id);

      const imagePath: string | undefined = file
        ? `uploads/products/${file.filename}`
        : undefined;

      const updatedProduct = await this.productRepository.update(
        id,
        data,
        imagePath,
      );

      if (file && existingProduct.image && existingProduct.image !== imagePath) {
        this.deleteImageFile(existingProduct.image);
      }

      return updatedProduct;
    } catch (error) {
      cleanupFailedUpload(file, "products");
      throw error;
    }
  }

  /**
   * Menghapus produk berdasarkan ID secara permanen.
   * Gambar produk di disk juga ikut dihapus jika ada setelah penghapusan DB berhasil.
   * Melempar error 404 jika produk tidak ditemukan.
   *
   * @param id - ID produk yang akan dihapus
   * @returns Void
   * @throws AppError 404 jika produk tidak ada
   */
  async deleteProduct(id: string): Promise<void> {
    const existingProduct: Product = await this.getProductById(id);

    await this.productRepository.delete(id);

    if (existingProduct.image) {
      this.deleteImageFile(existingProduct.image);
    }
  }
}
