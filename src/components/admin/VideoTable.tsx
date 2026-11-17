'use client';

import React from 'react';
import Image from 'next/image';
import { BankSampahVideoItem, VideoPlatform } from '@/types';
import { getVideoThumbnailUrl } from '@/lib/api/video';
import { Edit2, Trash2, ExternalLink, Play, Clock, Video } from 'lucide-react';

interface VideoTableProps {
  videos: BankSampahVideoItem[];
  isLoading: boolean;
  onEdit: (video: BankSampahVideoItem) => void;
  onDelete: (video: BankSampahVideoItem) => void;
  onAddNew: () => void;
}

export function VideoTable({
  videos,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
}: VideoTableProps) {
  const getPlatformBadge = (platform: VideoPlatform) => {
    switch (platform) {
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
            Instagram
          </span>
        );
      case 'TikTok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-900 border border-gray-300">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            TikTok
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-[#012D1D] flex items-center justify-center mb-4">
          <Video size={32} />
        </div>
        <h3 className="font-['Poppins'] font-bold text-xl text-gray-900">
          Belum Ada Video Bank Sampah
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Mulai tambahkan video kegiatan Bank Sampah dengan memasukkan link dari YouTube, Instagram, atau TikTok.
        </p>
        <button
          onClick={onAddNew}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#012D1D] hover:bg-[#0B4A31] text-white px-6 py-2.5 text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <span>Tambah Video Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider font-['Poppins']">
              <th className="py-4 px-6 w-20">Thumbnail</th>
              <th className="py-4 px-6">Judul Video & Deskripsi</th>
              <th className="py-4 px-6 w-36">Platform</th>
              <th className="py-4 px-6 w-32">Kategori</th>
              <th className="py-4 px-6 w-28">Durasi</th>
              <th className="py-4 px-6 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50/80 transition-colors">
                {/* Thumbnail */}
                <td className="py-4 px-6">
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-200 shadow-sm group">
                    <Image
                      src={getVideoThumbnailUrl(video.thumbnail)}
                      alt={video.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                </td>

                {/* Judul & Link */}
                <td className="py-4 px-6">
                  <div className="max-w-md">
                    <p className="font-['Poppins'] font-bold text-gray-900 line-clamp-1 hover:text-[#3B9734] transition-colors">
                      {video.title}
                    </p>
                    {video.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {video.description}
                      </p>
                    )}
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#3B9734] hover:underline font-mono mt-1"
                    >
                      <span className="truncate max-w-[280px]">{video.videoUrl}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>
                </td>

                {/* Platform */}
                <td className="py-4 px-6">
                  {getPlatformBadge(video.platform)}
                </td>

                {/* Kategori */}
                <td className="py-4 px-6">
                  {video.category ? (
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      {video.category}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Durasi */}
                <td className="py-4 px-6">
                  {video.duration ? (
                    <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {video.duration}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Aksi */}
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(video)}
                      className="p-2 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Edit Video"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(video)}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Hapus Video"
                    >
                      <Trash2 size={16} />
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

