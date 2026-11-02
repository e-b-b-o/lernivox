'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Loader2,
  Search,
  Filter,
  Users,
  User,
  UploadCloud,
  X,
  AlertCircle,
  FileText,
  RotateCw,
} from 'lucide-react';
import type {
  WorkspaceListItemDto,
  WorkspacesListResponseDto,
  WorkspaceType,
} from '@lernivox/contracts';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { BookCard } from '../../../components/workspace/BookCard';

const MAX_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];

type FileTypeFilter = 'ALL' | 'PDF' | 'DOCX' | 'TXT';

function MyBooksDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();

  const [workspacesData, setWorkspacesData] = useState<WorkspacesListResponseDto>({
    myBooks: [],
    sharedWithMe: [],
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('ALL');

  // Add Material Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedWorkspaceType, setSelectedWorkspaceType] = useState<WorkspaceType>('PERSONAL');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion Modal State
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open Add Material modal if ?action=upload is in URL
  useEffect(() => {
    if (searchParams.get('action') === 'upload') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Load Workspaces list
  const loadWorkspaces = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.workspaces.list(accessToken);
      setWorkspacesData(data);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load your study materials.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadWorkspaces();
    }
  }, [accessToken, loadWorkspaces]);

  // Polling for processing materials: check every 3s if any book is ingesting
  useEffect(() => {
    if (!accessToken) return;

    const allItems = [...workspacesData.myBooks, ...workspacesData.sharedWithMe];
    const hasIngestingBooks = allItems.some((item) =>
      ['UPLOADED', 'PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING'].includes(
        item.document.status,
      ),
    );

    if (!hasIngestingBooks) return;

    const interval = setInterval(() => {
      loadWorkspaces();
    }, 3000);

    return () => clearInterval(interval);
  }, [workspacesData, accessToken, loadWorkspaces]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`Unsupported format (${ext}). Supported formats: PDF, DOCX, TXT.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('File exceeds 25 MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !accessToken) return;

    setUploading(true);
    setUploadError(null);

    try {
      await api.documents.uploadFile(
        selectedFile,
        accessToken,
        customTitle.trim() || undefined,
        selectedWorkspaceType,
      );
      setShowAddModal(false);
      setSelectedFile(null);
      setCustomTitle('');
      setSelectedWorkspaceType('PERSONAL');
      await loadWorkspaces();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handlePastedTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedContent.trim() || !accessToken) return;

    setUploading(true);
    setUploadError(null);

    try {
      await api.documents.createFromText(
        {
          title: pastedTitle.trim() || 'Untitled Study Notes',
          content: pastedContent.trim(),
          workspaceType: selectedWorkspaceType,
        },
        accessToken,
      );
      setShowAddModal(false);
      setPastedTitle('');
      setPastedContent('');
      setSelectedWorkspaceType('PERSONAL');
      await loadWorkspaces();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save notes. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDoc || !accessToken) return;

    setIsDeleting(true);
    try {
      await api.documents.delete(deletingDoc.id, accessToken);
      setDeletingDoc(null);
      await loadWorkspaces();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter helper
  const filterList = (items: WorkspaceListItemDto[]) => {
    return items.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL') {
        const mime = item.document.mimeType;
        const name = item.document.fileName || '';
        if (typeFilter === 'PDF' && !mime.includes('pdf') && !name.endsWith('.pdf')) return false;
        if (typeFilter === 'DOCX' && !mime.includes('word') && !name.endsWith('.docx')) return false;
        if (typeFilter === 'TXT' && !mime.includes('text') && !name.endsWith('.txt')) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.document.title.toLowerCase().includes(query);
        const matchesFile = item.document.fileName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesFile) return false;
      }
      return true;
    });
  };

  const filteredMyBooks = useMemo(
    () => filterList(workspacesData.myBooks),
    [workspacesData.myBooks, typeFilter, searchQuery],
  );

  const filteredSharedWithMe = useMemo(
    () => filterList(workspacesData.sharedWithMe),
    [workspacesData.sharedWithMe, typeFilter, searchQuery],
  );

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-[0_4px_0_0_#1B3428] mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="font-display font-bold text-base text-[#14261D]">
          Opening your library...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 flex-1 w-full">
      {/* =========================================================================
          PAGE INTRODUCTION: "My Books"
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1B3428]/10">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[#14261D] tracking-tight">
            My Books
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#14261D]/75 mt-1 max-w-xl">
            Your books, your learning spaces. Pick up where you left off.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs sm:text-sm shadow-[0_3px_0_0_#B26E45] hover:bg-[#d66522] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Material</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SEARCH & FILTER CONTROLS BAR
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-[#14261D]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books & materials..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#1B3428]/20 text-xs font-sans text-[#14261D] placeholder:text-[#14261D]/40 focus:outline-none focus:border-[#E8722C] focus:ring-1 focus:ring-[#E8722C] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#14261D]/40 hover:text-[#14261D]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* File Type Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {(['ALL', 'PDF', 'DOCX', 'TXT'] as FileTypeFilter[]).map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setTypeFilter(ft)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-bold transition-all shrink-0 ${
                typeFilter === ft
                  ? 'bg-[#14261D] text-white shadow-xs'
                  : 'bg-[#FAF8F4] border border-[#1B3428]/15 text-[#14261D]/70 hover:bg-[#FBE8DC]/60 hover:text-[#14261D]'
              }`}
            >
              {ft === 'ALL' ? 'All Materials' : ft}
            </button>
          ))}
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={loadWorkspaces}
            className="font-bold underline ml-4 flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: "MY BOOKS"
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#14261D] tracking-tight">
              My Books
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1B3428]/10 text-[#14261D] font-mono text-[11px] font-bold">
              {filteredMyBooks.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#14261D]/60 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8722C]" />
            <p className="font-display font-bold text-sm">Loading your personal library...</p>
          </div>
        ) : filteredMyBooks.length === 0 ? (
          <div className="rounded-[24px] bg-[#FAF8F4] border-[2px] border-dashed border-[#1B3428]/20 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E2EBD8] text-[#497E64] flex items-center justify-center border border-[#1B3428]/20 shadow-[0_3px_0_0_#1B3428]">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D]">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'No matching books found'
                  : 'Your book collection is empty'}
              </h3>
              <p className="text-xs sm:text-sm text-[#14261D]/70 mt-1">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'Try clearing your search or filter criteria to see your books.'
                  : 'Upload your textbooks, PDF chapters, lecture notes, or literature to start studying with your AI tutor.'}
              </p>
            </div>
            {!searchQuery && typeFilter === 'ALL' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8722C] text-white font-display font-bold text-xs shadow-[0_2px_0_0_#B26E45] hover:bg-[#d66522] active:translate-y-0.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Book</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMyBooks.map((item) => (
              <BookCard
                key={item.id}
                document={item.document}
                workspaceId={item.id}
                workspaceType={item.type}
                isOwner={item.isOwner}
                readingProgress={item.myReadingProgress}
                onDelete={(docId, title) => setDeletingDoc({ id: docId, title })}
                isDeleting={isDeleting && deletingDoc?.id === item.document.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: "SHARED WITH ME"
          ========================================================================= */}
      <section className="space-y-4 pt-6 border-t border-[#1B3428]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#14261D] tracking-tight">
              Shared with Me
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#E8EFFB] text-[#2F65B9] font-mono text-[11px] font-bold">
              {filteredSharedWithMe.length}
            </span>
          </div>
        </div>

        {filteredSharedWithMe.length === 0 ? (
          <div className="rounded-[20px] bg-[#FAF8F4]/60 border border-[#1B3428]/10 p-6 text-center text-[#14261D]/60 text-xs">
            <Users className="w-6 h-6 mx-auto mb-2 text-[#14261D]/40" />
            <p className="font-display font-bold text-xs text-[#14261D]/80">
              No shared workspaces yet
            </p>
            <p className="text-[11px] text-[#14261D]/60 mt-0.5">
              When classmates or study partners invite you to their group workspaces, those books will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredSharedWithMe.map((item) => (
              <BookCard
                key={item.id}
                document={item.document}
                workspaceId={item.id}
                workspaceType={item.type}
                isOwner={false}
                readingProgress={item.myReadingProgress}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          ADD MATERIAL MODAL (Supports File, Pasted Text, and Workspace Type)
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[28px] bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_12px_0_0_#1B3428] p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1B3428]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8722C] text-white flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#14261D] leading-tight">
                    Add Learning Material
                  </h3>
                  <p className="text-[11px] font-sans text-[#14261D]/65">
                    Choose your book and initial workspace configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full border border-[#1B3428]/20 flex items-center justify-center text-[#14261D]/60 hover:text-[#14261D] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workspace Type Selector */}
            <div className="space-y-2">
              <label className="block font-display font-bold text-xs text-[#14261D]">
                Initial Workspace Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceType('PERSONAL')}
                  className={`p-3 rounded-2xl border-[1.5px] text-left transition-all ${
                    selectedWorkspaceType === 'PERSONAL'
                      ? 'border-[#1B3428] bg-[#E2EBD8] shadow-[0_2px_0_0_#1B3428]'
                      : 'border-[#1B3428]/20 bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-display font-bold text-xs text-[#14261D]">
                    <User className="w-3.5 h-3.5 text-[#497E64]" />
                    <span>Personal Workspace</span>
                  </div>
                  <p className="text-[10px] text-[#14261D]/70 mt-1 leading-normal">
                    Private workspace with personal AI tutor and individual progress.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceType('GROUP')}
                  className={`p-3 rounded-2xl border-[1.5px] text-left transition-all ${
                    selectedWorkspaceType === 'GROUP'
                      ? 'border-[#1B3428] bg-[#E8EFFB] shadow-[0_2px_0_0_#1B3428]'
                      : 'border-[#1B3428]/20 bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-display font-bold text-xs text-[#14261D]">
                    <Users className="w-3.5 h-3.5 text-[#2F65B9]" />
                    <span>Group Workspace</span>
                  </div>
                  <p className="text-[10px] text-[#14261D]/70 mt-1 leading-normal">
                    Collaborative workspace ready for group study and peer learning.
                  </p>
                </button>
              </div>
            </div>

            {/* Tab Selector: Upload File vs Pasted Text */}
            <div className="flex rounded-full bg-[#1B3428]/5 p-1">
              <button
                type="button"
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
                  uploadTab === 'file'
                    ? 'bg-white text-[#14261D] shadow-xs'
                    : 'text-[#14261D]/60 hover:text-[#14261D]'
                }`}
              >
                Upload Document (PDF, DOCX, TXT)
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('text')}
                className={`flex-1 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
                  uploadTab === 'text'
                    ? 'bg-white text-[#14261D] shadow-xs'
                    : 'text-[#14261D]/60 hover:text-[#14261D]'
                }`}
              >
                Paste Study Notes
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* TAB 1: File Upload */}
            {uploadTab === 'file' ? (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-[2px] border-dashed border-[#1B3428]/30 p-6 text-center cursor-pointer hover:bg-[#FBE8DC]/30 transition-all"
                >
                  <UploadCloud className="w-8 h-8 text-[#E8722C] mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="font-display font-bold text-xs text-[#14261D]">
                        {selectedFile.name}
                      </p>
                      <p className="font-mono text-[10px] text-[#14261D]/60 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-display font-bold text-xs text-[#14261D]">
                        Click to select document file
                      </p>
                      <p className="text-[10px] text-[#14261D]/60 mt-1">
                        Accepts PDF, DOCX, and TXT (up to 25 MB)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold text-[#14261D] mb-1">
                    Book Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1B3428]/20 text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full border border-[#1B3428]/20 text-xs font-display font-bold text-[#14261D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="px-5 py-2 rounded-full bg-[#E8722C] text-white text-xs font-display font-bold shadow-[0_2px_0_0_#B26E45] hover:bg-[#d66522] disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{uploading ? 'Ingesting...' : 'Add Material'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: Pasted Text */
              <form onSubmit={handlePastedTextSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-display font-bold text-[#14261D] mb-1">
                    Notes Title
                  </label>
                  <input
                    type="text"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    placeholder="e.g. Chapter 1 Summary"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#1B3428]/20 text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold text-[#14261D] mb-1">
                    Text Content
                  </label>
                  <textarea
                    rows={6}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder="Paste textbook excerpts, lecture notes, or syllabus content here..."
                    className="w-full p-3 rounded-xl bg-white border border-[#1B3428]/20 text-xs text-[#14261D] focus:outline-none focus:border-[#E8722C] font-serif leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full border border-[#1B3428]/20 text-xs font-display font-bold text-[#14261D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!pastedContent.trim() || uploading}
                    className="px-5 py-2 rounded-full bg-[#E8722C] text-white text-xs font-display font-bold shadow-[0_2px_0_0_#B26E45] hover:bg-[#d66522] disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{uploading ? 'Saving...' : 'Add Notes'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETION CONFIRMATION MODAL
          ========================================================================= */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] bg-[#FAF8F4] border-[2px] border-[#1B3428] shadow-[0_8px_0_0_#1B3428] p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-[#14261D]">
              Delete Workspace & Material?
            </h3>
            <p className="text-xs text-[#14261D]/70 leading-relaxed">
              Are you sure you want to delete <span className="font-bold">&quot;{deletingDoc.title}&quot;</span>? This will permanently remove the textbook, its workspace, and your reading progress.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-3.5 py-1.5 rounded-full border border-[#1B3428]/20 text-xs font-display font-bold text-[#14261D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-display font-bold shadow-[0_2px_0_0_#7F1D1D] hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBooksDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#E8722C]" />
        </div>
      }
    >
      <MyBooksDashboardContent />
    </Suspense>
  );
}
