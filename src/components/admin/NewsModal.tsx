'use client';

import { getBaseUrl } from '../../lib/api-config';
import React, { useState, useEffect } from 'react';
import { News } from '@/types';
import { X, ArrowLeft, Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'sonner';

export interface NewsModalSubmitData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  tags: string[];
  publishDate: string;
  endDate?: string;
  partnership?: string;
  imageFile: File | null;
}

interface NewsModalProps {
  news: News | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewsModalSubmitData) => void | Promise<void>;
}

function validateSafeEditorLink(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:' ||
      parsed.protocol === 'tel:'
    ) {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BASE_URL = getBaseUrl();

function resolveNewsImagePreview(imagePath?: string | null): string {
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
  return BASE_URL ? `${BASE_URL}/${trimmed}` : `/${trimmed}`;
}

export function NewsModal({ news, isOpen, onClose, onSubmit }: NewsModalProps) {
  if (!isOpen) return null;

  return (
    <NewsModalContent
      key={news?.id ?? 'new'}
      news={news}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function NewsModalContent({
  news,
  onClose,
  onSubmit,
}: Omit<NewsModalProps, 'isOpen'>) {
  const [title, setTitle] = useState(news?.title || '');
  const [slug, setSlug] = useState(news?.slug || '');
  const [summary, setSummary] = useState(news?.summary || '');
  const [content, setContent] = useState(news?.content || '');
  const [category] = useState(news?.category || 'Edukasi');
  const [status] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>(
    (news?.status as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') || 'PUBLISHED'
  );
  const [startDate, setStartDate] = useState(
    news?.publishDate ? news.publishDate.substring(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    news?.endDate ? news.endDate.substring(0, 10) : ''
  );
  const [tags, setTags] = useState<string[]>(news?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(() =>
    resolveNewsImagePreview(news?.imageUrl || news?.image)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [partnership, setPartnership] = useState(news?.partnership || '');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'ERROR' | 'ERROR_FILE_SIZE' | null;
  }>({ isOpen: false, status: null });
  
  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const updateActiveFormats = () => {
    if (!editorRef.current) return;
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    };
    
    // Check for blockquote and pre (Code block) using queryCommandValue or by checking parent node
    let isBlockquote = false;
    let isPre = false;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'BLOCKQUOTE') isBlockquote = true;
        if (node.nodeName === 'PRE') isPre = true;
        node = node.parentNode;
      }
    }
    
    const isJustifyCenter = document.queryCommandState('justifyCenter');
    const isJustifyRight = document.queryCommandState('justifyRight');
    const isJustifyFull = document.queryCommandState('justifyFull');
    const isJustifyLeft = document.queryCommandState('justifyLeft') || (!isJustifyCenter && !isJustifyRight && !isJustifyFull);

    setActiveFormats({
      ...formats,
      formatBlock_BLOCKQUOTE: isBlockquote,
      formatBlock_PRE: isPre,
      justifyLeft: isJustifyLeft,
      justifyCenter: isJustifyCenter,
      justifyRight: isJustifyRight,
      justifyFull: isJustifyFull,
    });
  };

  // Sinkronkan DOM contentEditable saat komponen modal mount atau news berubah
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = news?.content || '';
    }
  }, [news]);

  // Revoke object URL preview lama saat diganti atau unmount
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setConfirmModal({ isOpen: true, status: 'ERROR_FILE_SIZE' });
      e.target.value = ''; // Clear selection
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(' ')) {
      const newTags = value.split(' ').map(t => t.trim()).filter(Boolean);
      const updatedTags = [...tags];
      let added = false;
      newTags.forEach(t => {
        if (!updatedTags.includes(t)) {
          updatedTags.push(t);
          added = true;
        }
      });
      if (added) setTags(updatedTags);
      setTagInput('');
    } else {
      setTagInput(value);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    setShowLinkInput(false);
    setLinkUrl('');
    setSavedRange(null);
    setTagInput('');
    setConfirmModal({ isOpen: false, status: null });
    onClose();
  };

  const handlePreSubmit = (e: React.FormEvent, submitStatus?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const currentContent = editorRef.current ? editorRef.current.innerHTML : content;
    if (currentContent !== content) {
      setContent(currentContent);
    }

    // Basic validation for required fields
    if (
      !title.trim() ||
      !slug.trim() ||
      !currentContent.trim() ||
      currentContent.trim() === '<p><br></p>' ||
      currentContent.trim() === '<br>'
    ) {
      setConfirmModal({ isOpen: true, status: 'ERROR' });
      return;
    }

    setConfirmModal({ isOpen: true, status: submitStatus || status });
  };

  const executeSubmit = async (submitStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    if (isSubmitting) return;
    // Process any remaining text in tagInput as space-separated tags
    const finalTags = [...tags];
    if (tagInput.trim()) {
      const newTags = tagInput.split(' ').map(t => t.trim()).filter(Boolean);
      newTags.forEach(t => {
        if (!finalTags.includes(t)) finalTags.push(t);
      });
      setTagInput('');
    }

    const latestContent = editorRef.current ? editorRef.current.innerHTML : content;

    setConfirmModal({ isOpen: false, status: null });
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        slug,
        summary,
        content: latestContent,
        category,
        status: submitStatus,
        tags: finalTags,
        publishDate: startDate,
        endDate: endDate || undefined,
        partnership: partnership || undefined,
        imageFile,
      });
    } catch {
      // Parent handles error toast and keeps modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0));
    }
    setShowLinkInput(!showLinkInput);
    setLinkUrl('');
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      const safeHref = validateSafeEditorLink(linkUrl);
      if (!safeHref) {
        toast.error('URL tautan tidak valid atau tidak aman. Gunakan awalan https://, http://, atau /.');
        return;
      }

      editorRef.current?.focus();
      const escapedHref = escapeHtml(safeHref);
      const escapedLabel = escapeHtml(linkUrl.trim());
      if (savedRange) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange);

        if (savedRange.collapsed) {
          document.execCommand(
            'insertHTML',
            false,
            `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">${escapedLabel}</a>`
          );
        } else {
          document.execCommand('createLink', false, safeHref);
        }
      } else {
        document.execCommand(
          'insertHTML',
          false,
          `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">${escapedLabel}</a>`
        );
      }
      if (editorRef.current) setContent(editorRef.current.innerHTML);
      updateActiveFormats();
    }
    setShowLinkInput(false);
    setLinkUrl('');
    setSavedRange(null);
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    updateActiveFormats();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F9FAF8] overflow-hidden animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex-none px-4 sm:px-12 py-4 sm:py-6">
        <button 
          type="button"
          onClick={handleClose}
          className="flex items-center text-xs sm:text-[13px] font-medium text-[#72796E] hover:text-[#2A3426] transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5 sm:mr-2" />
          Kembali ke Kelola Program
        </button>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A3426] mt-3 sm:mt-6">
          {news ? 'Edit Program' : 'Tambah Program Baru'}
        </h1>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN (Forms) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Title & Slug */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Judul Program</label>
                <input
                  type="text"
                  placeholder="Masukkan judul program..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F9FAF8] border border-[#F0F2EB] rounded-xl sm:rounded-[14px] text-sm text-[#2A3426] focus:outline-none focus:border-[#c2c9bb]"
                  value={title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setTitle(nextTitle);
                    if (!news) {
                      setSlug(
                        nextTitle
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)+/g, '')
                      );
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Slug / URL</label>
                <div className="flex flex-col sm:flex-row w-full overflow-hidden rounded-xl sm:rounded-[14px] border border-[#F0F2EB]">
                  <div className="bg-[#F3F4EF] px-3 sm:px-4 py-1.5 sm:py-3 flex items-center border-b sm:border-b-0 sm:border-r border-[#F0F2EB]">
                    <span className="text-xs sm:text-[13px] font-medium text-[#72796E]">temanpilah.com/program/</span>
                  </div>
                  <input
                    type="text"
                    placeholder="new-program-slug"
                    className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F9FAF8] text-sm text-[#2A3426] focus:outline-none"
                    value={slug}
                    onChange={(e) => {
                      const formatted = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                        .replace(/-+/g, '-'); // prevent consecutive hyphens
                      setSlug(formatted);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Program Description */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Deskripsi Program</label>
              
              <div className="border border-[#F0F2EB] rounded-xl sm:rounded-[14px] overflow-hidden bg-[#F9FAF8] relative">
                <style>{`
                  .editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
                  .editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
                  .editor-content blockquote { border-left: 3px solid #C2C9BB !important; padding-left: 1rem !important; color: #72796E !important; font-style: italic !important; margin: 0.5rem 0 !important; }
                  .editor-content a { color: #2D5A27 !important; text-decoration: underline !important; }
                `}</style>
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-[#F0F2EB] px-2.5 sm:px-3 py-2 bg-[#F3F4EF] relative">
                  <button type="button" onClick={() => handleFormat('bold')} className={`p-1.5 rounded transition-colors ${activeFormats.bold ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><Bold size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('italic')} className={`p-1.5 rounded transition-colors ${activeFormats.italic ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><Italic size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('underline')} className={`p-1.5 rounded transition-colors ${activeFormats.underline ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><Underline size={16} strokeWidth={2.5} /></button>
                  <div className="w-px h-4 bg-[#D6D9D2] mx-1"></div>
                  <button type="button" onClick={() => handleFormat('insertUnorderedList')} className={`p-1.5 rounded transition-colors ${activeFormats.insertUnorderedList ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><List size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('insertOrderedList')} className={`p-1.5 rounded transition-colors ${activeFormats.insertOrderedList ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><ListOrdered size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('formatBlock', 'BLOCKQUOTE')} className={`p-1.5 rounded transition-colors ${activeFormats.formatBlock_BLOCKQUOTE ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`}><Quote size={16} strokeWidth={2.5} /></button>
                  <div className="w-px h-4 bg-[#D6D9D2] mx-1"></div>
                  
                  <div className="relative">
                    <button type="button" onClick={handleLinkClick} className="p-1.5 text-[#42493E] hover:bg-white rounded"><Link2 size={16} strokeWidth={2.5} /></button>
                    {showLinkInput && (
                      <div className="absolute top-full left-0 mt-2 w-72 sm:w-96 max-w-[85vw] bg-white border border-[#F0F2EB] rounded-xl shadow-lg p-2.5 sm:p-3 z-50 flex gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          className="flex-1 bg-[#F9FAF8] border border-[#F0F2EB] rounded-lg px-3 py-1.5 text-[13px] text-[#2A3426] focus:outline-none"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleLinkSubmit();
                            }
                          }}
                        />
                        <button type="button" onClick={handleLinkSubmit} className="bg-[#2D5A27] text-white px-3 rounded-lg text-[12px] font-bold hover:brightness-110">Tambah</button>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={() => handleFormat('justifyLeft')} className={`p-1.5 rounded transition-colors ${activeFormats.justifyLeft ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`} title="Rata Kiri"><AlignLeft size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('justifyCenter')} className={`p-1.5 rounded transition-colors ${activeFormats.justifyCenter ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`} title="Rata Tengah"><AlignCenter size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('justifyRight')} className={`p-1.5 rounded transition-colors ${activeFormats.justifyRight ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`} title="Rata Kanan"><AlignRight size={16} strokeWidth={2.5} /></button>
                  <button type="button" onClick={() => handleFormat('justifyFull')} className={`p-1.5 rounded transition-colors ${activeFormats.justifyFull ? 'bg-[#2D5A27] text-white' : 'text-[#42493E] hover:bg-white'}`} title="Justify"><AlignJustify size={16} strokeWidth={2.5} /></button>
                </div>
                {/* Editor Content */}
                <div
                  ref={editorRef}
                  className="w-full min-h-[300px] p-4 bg-transparent text-[14px] text-[#2A3426] focus:outline-none overflow-y-auto editor-content"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  onMouseUp={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            {/* Program Overview */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Ringkasan Program</label>
              <textarea
                placeholder="Tulis ringkasan singkat program..."
                className="w-full min-h-[100px] px-3.5 sm:px-4 py-3 bg-[#F9FAF8] border border-[#F0F2EB] rounded-xl sm:rounded-[14px] resize-none text-sm text-[#2A3426] focus:outline-none focus:border-[#c2c9bb]"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              ></textarea>
            </div>

          </div>

          {/* RIGHT COLUMN (Settings) */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            
            {/* Image Upload */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Banner Program</label>
              
              <div className={`relative h-44 sm:h-52 w-full rounded-[16px] flex flex-col items-center justify-center text-center transition-colors group overflow-hidden ${
                imagePreview
                  ? 'border border-[#E5E7EB] bg-[#F9FAF8]'
                  : 'border-2 border-dashed border-[#D6D9D2] p-6 hover:bg-gray-50'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
                
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none z-20">
                      <span className="rounded-full bg-black/70 px-3.5 py-1.5 text-white text-[13px] font-medium">Ubah Gambar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-[#F3F4EF] rounded-full flex items-center justify-center mb-3 text-[#8F9A8A] group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-[13px] font-bold text-[#2A3426]">Klik untuk mengunggah atau seret dan lepas</p>
                    <p className="text-[11px] text-[#8F9A8A] mt-1">SVG, PNG, JPG atau GIF (maks. 2MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-4 sm:space-y-5">
              
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Kemitraan</label>
                <input
                  type="text"
                  placeholder="Masukkan mitra yang berkolaborasi dalam program."
                  className="w-full h-11 px-4 bg-[#F9FAF8] border border-[#F0F2EB] rounded-[14px] text-[14px] text-[#2A3426] focus:outline-none focus:border-[#c2c9bb]"
                  value={partnership}
                  onChange={(e) => setPartnership(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Tanggal Mulai Program</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 bg-[#F9FAF8] border border-[#F0F2EB] rounded-[14px] text-[14px] text-[#2A3426] focus:outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Tanggal Selesai Program</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 bg-[#F9FAF8] border border-[#F0F2EB] rounded-[14px] text-[14px] text-[#2A3426] focus:outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#72796E]">Tag</label>
                <input
                  type="text"
                  placeholder="Pendidikan Daur Ulang..."
                  className="w-full h-11 px-4 bg-[#F9FAF8] border border-[#F0F2EB] rounded-[14px] text-[14px] text-[#2A3426] focus:outline-none"
                  value={tagInput}
                  onChange={handleTagInput}
                  onKeyDown={handleAddTag}
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-[#E2F5EB] text-[#166534] px-3 py-1 rounded-full text-[12px] font-medium">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* FIXED FOOTER */}
      <div className="flex-none bg-white border-t border-[#F0F2EB] px-4 sm:px-12 py-3.5 sm:py-5 flex items-center justify-between gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-[12px] border border-[#F0F2EB] text-[#D05B5B] font-bold text-xs sm:text-[13px] hover:bg-red-50 transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          Batal
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handlePreSubmit(e, 'DRAFT')}
            className="px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-[12px] border border-[#F0F2EB] text-[#2A3426] font-bold text-xs sm:text-[13px] hover:bg-gray-50 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) =>
              handlePreSubmit(
                e,
                !news || news.status === 'DRAFT'
                  ? 'PUBLISHED'
                  : news.status === 'ARCHIVED'
                  ? 'ARCHIVED'
                  : 'PUBLISHED'
              )
            }
            className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl sm:rounded-[12px] bg-[#8C5A00] text-white font-bold text-xs sm:text-[13px] hover:brightness-110 transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Menyimpan...'
              : !news || news.status === 'DRAFT'
              ? 'Terbitkan'
              : 'Simpan Perubahan'}
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
          } else if (confirmModal.status) {
            void executeSubmit(confirmModal.status);
          }
        }}
        title={
          confirmModal.status === 'ERROR'
            ? "Data Belum Lengkap"
            : confirmModal.status === 'ERROR_FILE_SIZE'
            ? "Ukuran File Terlalu Besar"
            : (news ? "Simpan Perubahan?" : "Tambah Program Baru?")
        }
        message={
          confirmModal.status === 'ERROR'
            ? "Silakan lengkapi semua bidang yang wajib diisi (Judul Program, Slug, dan Deskripsi) sebelum menyimpan."
            : confirmModal.status === 'ERROR_FILE_SIZE'
            ? "File yang diunggah melebihi batas ukuran 2MB. Silakan unggah gambar yang lebih kecil dari 2MB."
            : news 
            ? `Apakah Anda yakin ingin menyimpan perubahan pada "${title || 'program ini'}"?`
            : `Apakah Anda yakin ingin menambahkan "${title || 'program ini'}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={
          confirmModal.status === 'ERROR' || confirmModal.status === 'ERROR_FILE_SIZE'
            ? "OK"
            : (news ? "Simpan Perubahan" : "Tambah Program Baru")
        }
      />
    </div>
  );
}