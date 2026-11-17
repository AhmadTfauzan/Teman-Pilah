'use client';

import React from 'react';
import { EcoEnzymeVideoItem, EcoEnzymeVideoPlatform } from '@/types';
import { getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import { Edit2, Trash2, ExternalLink, Play, Clock, Film, Sparkles } from 'lucide-react';

interface EcoEnzymeVideoTableProps {
  videos: EcoEnzymeVideoItem[];
  isLoading: boolean;
  onEdit: (video: EcoEnzymeVideoItem) => void;
  onDelete: (video: EcoEnzymeVideoItem) => void;
  onPreview: (video: EcoEnzymeVideoItem) => void;
  onAddNew: () => void;
}

export function EcoEnzymeVideoTable({
  videos,
  isLoading,
  onEdit,
  onDelete,
  onPreview,
  onAddNew,
}: EcoEnzymeVideoTableProps) {
  const getPlatformBadge = (platform: EcoEnzymeVideoPlatform) => {
    switch (platform) {
      case 'Local':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Video MP4 (Lokal)
          </span>
        );
      case 'YouTube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            YouTube
          </span>
        );
      case 'Instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">
            <span className="w-2 h-2 rounded-full bg-pink-600"></span>
            Instagram Reels
          </span>
        );
      case 'TikTok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-900 border border-stone-300">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            TikTok
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-8 shadow-xs">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 sm:h-10 bg-stone-200 rounded-xl w-1/3"></div>
          <div className="h-14 sm:h-16 bg-stone-100 rounded-2xl"></div>
          <div className="h-14 sm:h-16 bg-stone-100 rounded-2xl"></div>
          <div className="h-14 sm:h-16 bg-stone-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-[#012D1D] flex items-center justify-center mb-4">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#2C5F2D]" />
        </div>
        <h3 className="font-['Poppins'] font-bold text-lg sm:text-xl text-stone-900">
          Belum Ada Video Edukasi Eco Enzyme
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Tambahkan video panduan manfaat atau cara pembuatan Eco Enzyme untuk ditampilkan di halaman utama Eco Enzyme.
        </p>
        <button
          onClick={onAddNew}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <span>Tambah Video Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Mobile 2-Column Card Grid */}
      <div className="grid grid-cols-2 gap-2.5 p-3 md:hidden">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#FAFBF9] overflow-hidden"
          >
            {/* Thumbnail */}
            <div
              onClick={() => onPreview(video)}
              className="relative h-24 w-full bg-stone-900 flex items-center justify-center cursor-pointer"
            >
              {video.thumbnail ? (
                <img
                  src={getEcoEnzymeVideoThumbnailUrl(video.thumbnail)}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/70 bg-gradient-to-br from-emerald-950 to-stone-900">
                  <Film className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span className="text-[9px] font-mono text-emerald-200">MP4</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                {video.platform === 'Local' ? 'MP4' : video.platform}
              </span>
              {video.duration && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                  {video.duration}
                </span>
              )}
            </div>

            {/* Content & Actions */}
            <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                  {video.title}
                </h4>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 max-w-full truncate">
                  <Sparkles className="w-2.5 h-2.5 text-[#FC9634] shrink-0" />
                  <span className="truncate">{video.category || 'Edukasi'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/80 gap-1">
                <button
                  type="button"
                  onClick={() => onPreview(video)}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex-1"
                  title="Lihat Video"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Putar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(video)}
                  className="p-1.5 rounded-md text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  title="Edit Video"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(video)}
                  className="p-1.5 rounded-md text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="Hapus Video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider font-['Poppins']">
              <th className="py-4 px-6 w-24">Preview</th>
              <th className="py-4 px-6">Judul Video & Deskripsi</th>
              <th className="py-4 px-6 w-36">Platform</th>
              <th className="py-4 px-6 w-36">Kategori</th>
              <th className="py-4 px-6 w-28">Durasi</th>
              <th className="py-4 px-6 w-24 text-center">Urutan</th>
              <th className="py-4 px-6 w-32 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {videos.map((video) => (
              <tr
                key={video.id}
                className="hover:bg-emerald-50/30 transition-colors group"
              >
                {/* Preview / Thumbnail */}
                <td className="py-4 px-6">
                  <div
                    onClick={() => onPreview(video)}
                    className="relative w-20 h-16 rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center cursor-pointer shadow-xs group-hover:scale-105 transition-transform"
                    title="Klik untuk putar video"
                  >
                    {video.thumbnail ? (
                      <img
                        src={getEcoEnzymeVideoThumbnailUrl(video.thumbnail)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/70 bg-gradient-to-br from-emerald-950 to-stone-900">
                        <Film className="w-6 h-6 text-emerald-400 mb-0.5" />
                        <span className="text-[9px] font-mono text-emerald-200">MP4</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Judul & Deskripsi */}
                <td className="py-4 px-6 max-w-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {video.title}
                      </h4>
                      {video.aspect === 'tall' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          9:16
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                    <span className="inline-block text-[11px] font-mono text-stone-400 truncate max-w-xs">
                      {video.videoUrl}
                    </span>
                  </div>
                </td>

                {/* Platform */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {getPlatformBadge(video.platform)}
                </td>

                {/* Kategori */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-[#FC9634]" />
                    {video.category || 'Edukasi'}
                  </span>
                </td>

                {/* Durasi */}
                <td className="py-4 px-6 whitespace-nowrap text-stone-600">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{video.duration || '-'}</span>
                  </div>
                </td>

                {/* Urutan */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                    {video.sortOrder ?? 0}
                  </span>
                </td>

                {/* Aksi */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onPreview(video)}
                      className="p-2 rounded-xl text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Lihat Video"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => onEdit(video)}
                      className="p-2 rounded-xl text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="Edit Video"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(video)}
                      className="p-2 rounded-xl text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Hapus Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

