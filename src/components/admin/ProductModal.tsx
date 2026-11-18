'use client';

import React, { useState, useRef } from 'react';
import { Product } from '@/types';
import { getImageUrl } from '@/lib/api/Products';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

function resolveProductImagePreview(imagePath?: string | null): string {
  const trimmed = imagePath?.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return getImageUrl(trimmed);
}

export function ProductModal({ product, isOpen, onClose, onSubmit }: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <ProductModalContent
      key={product?.id ?? 'new'}
      product={product}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function ProductModalContent({
  product,
  onClose,
  onSubmit,
}: Omit<ProductModalProps, 'isOpen'>) {
  const initialNumericPrice = product ? Number(product.price) : NaN;

  const [name, setName] = useState(product?.name || '');
  const [productCode, setProductCode] = useState(product?.productCode || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState<Product['category']>(product?.category || 'ORGANIC');
  const [price, setPrice] = useState(
    product && product.price !== undefined && product.price !== null && Number.isFinite(initialNumericPrice)
      ? String(initialNumericPrice)
      : ''
  );
  const [priceUnit, setPriceUnit] = useState(product?.priceUnit || '/pcs');
  const [stock, setStock] = useState(product ? String(product.stock ?? 0) : '100');
  const [stockLabel, setStockLabel] = useState<Product['stockLabel']>(
    product?.stockLabel || 'IN_STOCK'
  );
  const [whatsappLink, setWhatsappLink] = useState(product?.whatsappLink || '');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(() =>
    product ? resolveProductImagePreview(product.image || product.imageUrl) : ''
  );

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: 'CONFIRM' | 'ERROR' | 'ERROR_FILE_SIZE' | null;
    errorMessage?: string;
  }>({ isOpen: false, status: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setConfirmModal({ isOpen: true, status: 'ERROR_FILE_SIZE' });
        e.target.value = ''; // Clear selection
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedPrice = price.trim();
    const trimmedStock = stock.trim();
    const trimmedWa = whatsappLink.trim();

    if (!trimmedName || !trimmedDescription || !trimmedPrice || !trimmedStock || !trimmedWa) {
      setConfirmModal({
        isOpen: true,
        status: 'ERROR',
        errorMessage:
          'Silakan lengkapi semua bidang yang wajib diisi (Nama, Deskripsi, Harga, Stok, dan Nomor WhatsApp) sebelum menyimpan.',
      });
      return;
    }

    const parsedPrice = Number(trimmedPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setConfirmModal({
        isOpen: true,
        status: 'ERROR',
        errorMessage: 'Harga produk harus berupa angka valid (>= 0).',
      });
      return;
    }

    const parsedStock = Number(trimmedStock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setConfirmModal({
        isOpen: true,
        status: 'ERROR',
        errorMessage: 'Stok produk harus berupa bilangan bulat (>= 0).',
      });
      return;
    }

    setConfirmModal({ isOpen: true, status: 'CONFIRM' });
  };

  const executeSubmit = () => {
    setConfirmModal({ isOpen: false, status: null });

    let formattedWa = '';
    if (whatsappLink.trim()) {
      const trimmed = whatsappLink.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        formattedWa = trimmed;
      } else {
        let cleanNumber = trimmed.replace(/\D/g, '');
        if (cleanNumber.startsWith('08')) {
          cleanNumber = '62' + cleanNumber.substring(1);
        } else if (cleanNumber.startsWith('8') && cleanNumber.length >= 9 && cleanNumber.length <= 13) {
          cleanNumber = '62' + cleanNumber;
        }
        formattedWa = `https://wa.me/${cleanNumber}`;
      }
    }

    const data = new FormData();
    if (!product && productCode.trim()) {
      data.append('productCode', productCode.trim().toUpperCase());
    }
    data.append('name', name.trim());
    data.append('category', category);
    data.append('price', price.trim());
    data.append('priceUnit', priceUnit.trim() || '/pcs');
    data.append('stock', String(parseInt(stock.trim(), 10)));
    data.append('stockLabel', stockLabel);
    data.append('whatsappLink', formattedWa);
    data.append('description', description.trim());
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F9FAF8] overflow-hidden animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex-none px-4 sm:px-12 py-4 sm:py-6">
        <button 
          onClick={onClose}
          className="flex items-center text-xs sm:text-[13px] font-medium text-[#72796E] hover:text-[#2A3426] transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5 sm:mr-2" />
          Kembali ke Kelola Produk
        </button>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A3426] mt-3 sm:mt-6">
          {product ? 'Edit Product' : 'Tambah Produk Baru'}
        </h1>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN (Forms) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Title & Product Code */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama produk..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl sm:rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-sm text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">
                  Kode Produk {product ? '(Read-only)' : '(Opsional)'}
                </label>
                <input
                  type="text"
                  placeholder={product ? '-' : 'Kosongkan untuk generate otomatis (misal TP-OR-001)'}
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                  readOnly={Boolean(product)}
                  disabled={Boolean(product)}
                  className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl sm:rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] font-mono text-sm text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all disabled:bg-[#F3F4EF] disabled:text-[#72796E] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">
                Ringkasan Produk <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Tulis ringkasan singkat produk..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-sm text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all resize-none min-h-[160px] sm:min-h-[180px]"
              />
            </div>

          </div>

          {/* RIGHT COLUMN (Image, Category, Price) */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Banner / Image */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Foto Produk</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-[200px] rounded-[16px] flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${
                  imagePreview ? 'border-none' : 'border-2 border-dashed border-[#E5E7EB] bg-[#F9FAF8] hover:bg-gray-50 transition-colors'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-[13px] font-medium">Ubah Gambar</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-4">
                    <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-[#F0F2EB]">
                      <ImageIcon className="h-6 w-6 text-[#A1A89A]" />
                    </div>
                    <p className="text-[13px] font-bold text-[#2A3426] mb-1">
                      Klik untuk mengunggah atau seret dan lepas
                    </p>
                    <p className="text-[11px] text-[#A1A89A]">
                      SVG, PNG, JPG atau GIF (maks. 2MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category & Price */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-4 sm:space-y-6">
              
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Kategori Produk</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Product['category'])}
                    className="w-full h-12 px-4 pr-10 appearance-none rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-[14px] text-[#2A3426] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all cursor-pointer"
                  >
                    <option value="ORGANIC">Produk Organik</option>
                    <option value="UPCYCLED_GOODS">Kerajinan</option>
                    <option value="ZERO_WASTE">Zero Waste</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#A1A89A]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#72796E]">
                    Harga Produk <span className="text-red-500">*</span>
                  </label>
                  <div className="flex rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] overflow-hidden focus-within:border-[#27532B] focus-within:ring-1 focus-within:ring-[#27532B] transition-all h-12">
                    <div className="px-3.5 flex items-center bg-[#F0F2EB]/50 border-r border-[#E5E7EB] text-[#72796E] text-[14px] font-medium">
                      Rp
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="45000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 bg-transparent text-[14px] text-[#2A3426] placeholder:text-[#A1A89A] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#72796E]">Satuan Harga</label>
                  <input
                    type="text"
                    placeholder="/pcs"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    className="w-full h-12 px-4 rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-[14px] text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#72796E]">
                    Stok Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="100"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-12 px-4 rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-[14px] text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#72796E]">Status Stok</label>
                  <div className="relative">
                    <select
                      value={stockLabel}
                      onChange={(e) => setStockLabel(e.target.value as Product['stockLabel'])}
                      className="w-full h-12 px-4 pr-10 appearance-none rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-[14px] text-[#2A3426] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all cursor-pointer"
                    >
                      <option value="IN_STOCK">Tersedia</option>
                      <option value="BULK_AVAILABLE">Tersedia Grosir</option>
                      <option value="OUT_OF_STOCK">Stok Habis</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#A1A89A]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Nomor WhatsApp / Link <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="misal 08123456789 atau https://wa.me/..."
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  className="w-full h-12 px-4 rounded-[12px] bg-[#F9FAF8] border border-[#E5E7EB] text-[14px] text-[#2A3426] placeholder:text-[#A1A89A] focus:outline-none focus:border-[#27532B] focus:ring-1 focus:ring-[#27532B] transition-all"
                />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* FIXED FOOTER */}
      <div className="flex-none bg-white border-t border-[#F0F2EB] px-4 sm:px-12 py-3.5 sm:py-5 flex items-center justify-between gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-[12px] border border-[#F0F2EB] text-[#D05B5B] font-bold text-xs sm:text-[13px] hover:bg-red-50 transition-all duration-200 active:scale-95"
        >
          Batal
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handlePreSubmit}
            className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl sm:rounded-[12px] bg-[#27532B] text-white font-bold text-xs sm:text-[13px] hover:brightness-110 transition-all duration-200 shadow-sm active:scale-95"
          >
            {product ? 'Simpan Perubahan' : 'Terbitkan'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        isAlert={confirmModal.status === 'ERROR' || confirmModal.status === 'ERROR_FILE_SIZE'}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={() => {
          if (confirmModal.status === 'ERROR' || confirmModal.status === 'ERROR_FILE_SIZE') {
            setConfirmModal({ isOpen: false, status: null });
          } else {
            executeSubmit();
          }
        }}
        title={
          confirmModal.status === 'ERROR'
            ? "Data Belum Lengkap"
            : confirmModal.status === 'ERROR_FILE_SIZE'
            ? "Ukuran File Terlalu Besar"
            : (product ? "Simpan Perubahan?" : "Tambah Produk Baru?")
        }
        message={
          confirmModal.status === 'ERROR'
            ? (confirmModal.errorMessage || "Silakan lengkapi semua bidang yang wajib diisi (Nama, Deskripsi, Harga, Stok, dan Nomor WhatsApp) sebelum menyimpan.")
            : confirmModal.status === 'ERROR_FILE_SIZE'
            ? "File yang diunggah melebihi batas ukuran 2MB. Silakan unggah gambar yang lebih kecil dari 2MB."
            : product 
            ? `Apakah Anda yakin ingin menyimpan perubahan pada "${name || 'produk ini'}"?`
            : `Apakah Anda yakin ingin menambahkan "${name || 'produk ini'}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={
          confirmModal.status === 'ERROR' || confirmModal.status === 'ERROR_FILE_SIZE'
            ? "OK"
            : (product ? "Simpan Perubahan" : "Tambah Produk Baru")
        }
      />
    </div>
  );
}
