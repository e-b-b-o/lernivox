'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Loader2,
  LogOut,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Layers,
  X,
  Database,
  Cpu,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { DocumentChunkDto, DocumentDto } from '@lernivox/contracts';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

const MAX_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, accessToken, logout } = useAuth();

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chunks Inspector Modal State
  const [inspectingDoc, setInspectingDoc] = useState<DocumentDto | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);

  // Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await api.documents.list(accessToken);
      setDocuments(data);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load documents.');
    } finally {
      setLoadingDocs(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadDocuments();
    }
  }, [accessToken, loadDocuments]);

  // Polling: if any document is in progress, poll every 3 seconds
  useEffect(() => {
    if (!accessToken) return;

    const hasActiveJobs = documents.some((d) =>
      ['UPLOADED', 'PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING'].includes(d.status),
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadDocuments();
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, accessToken, loadDocuments]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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

  const handleUploadSubmit = async () => {
    if (!accessToken) return;
    setUploadError(null);
    setUploading(true);

    try {
      if (uploadTab === 'file') {
        if (!selectedFile) {
          setUploadError('Please choose a file to upload.');
          setUploading(false);
          return;
        }

        await api.documents.uploadFile(selectedFile, accessToken, customTitle);
      } else {
        if (!pastedTitle.trim()) {
          setUploadError('Please provide a title for your study notes.');
          setUploading(false);
          return;
        }
        if (!pastedContent.trim() || pastedContent.trim().length < 20) {
          setUploadError('Please enter at least 20 characters of study notes.');
          setUploading(false);
          return;
        }

        await api.documents.createFromText(
          {
            title: pastedTitle.trim(),
            content: pastedContent.trim(),
          },
          accessToken,
        );
      }

      // Reset modal state
      setSelectedFile(null);
      setCustomTitle('');
      setPastedTitle('');
      setPastedContent('');
      setShowUploadModal(false);

      // Refresh documents
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove all storage files and vector embeddings.`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await api.documents.delete(docId, accessToken);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (inspectingDoc?.id === docId) {
        setInspectingDoc(null);
      }
    } catch (err: any) {
      alert(`Failed to delete document: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleInspectChunks = async (doc: DocumentDto) => {
    if (!accessToken) return;
    setInspectingDoc(doc);
    setLoadingChunks(true);
    setChunkError(null);

    try {
      const data = await api.documents.getChunks(doc.id, accessToken);
      setChunks(data);
    } catch (err: any) {
      setChunkError(err.message || 'Failed to fetch document chunks.');
    } finally {
      setLoadingChunks(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-subtle">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Ready for Tutoring
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-xs font-bold text-red-800 shadow-subtle">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            Processing Failed
          </span>
        );
      case 'EXTRACTING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold text-blue-800 shadow-subtle">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            Extracting Text...
          </span>
        );
      case 'CHUNKING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 text-xs font-bold text-indigo-800 shadow-subtle">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            Generating Chunks...
          </span>
        );
      case 'EMBEDDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/80 px-3.5 py-1 text-xs font-bold text-purple-800 shadow-subtle">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
            Indexing Vectors...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3.5 py-1 text-xs font-bold text-amber-800 shadow-subtle">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Queued in Worker
          </span>
        );
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-lernivox-cream px-4">
        <Loader2 className="h-10 w-10 animate-spin text-lernivox-forest" />
        <p className="mt-4 text-base font-medium text-stone-600">
          Loading student workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lernivox-cream text-lernivox-forest selection:bg-lernivox-peach selection:text-lernivox-forest">
      {/* Workspace Header */}
      <header className="border-b border-stone-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="mx-auto flex h-20 md:h-24 max-w-[1440px] items-center justify-between px-6 md:px-12 xl:px-16">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-3.5 group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lernivox-forest text-lernivox-peach shadow-sm transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-lernivox-forest">
                Lernivox
              </span>
            </Link>
            <span className="hidden sm:inline-flex rounded-full bg-lernivox-peach/70 px-4 py-1 text-xs font-bold text-lernivox-forest">
              Student Workspace
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-base font-semibold text-lernivox-forest">
                {user.name || user.email.split('@')[0]}
              </span>
              <span className="text-xs text-stone-500">{user.email}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 px-5 text-sm font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="mx-auto max-w-[1440px] px-6 md:px-12 xl:px-16 py-12 md:py-16">
        {/* Top Action Bar */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-lernivox-forest">
              Document Library
            </h1>
            <p className="text-base md:text-lg text-stone-600 mt-2">
              Upload, monitor asynchronous ingestion, and inspect vector-indexed learning materials.
            </p>
          </div>

          <div className="flex items-center gap-3.5">
            <Button
              variant="outline"
              size="md"
              onClick={loadDocuments}
              className="gap-2 bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowUploadModal(true)}
              className="gap-2 shadow-glow-terracotta"
            >
              <Plus className="h-5 w-5" />
              Upload New Material
            </Button>
          </div>
        </div>

        {/* Global Error Notice */}
        {fetchError && (
          <div className="mb-8 flex items-center gap-3.5 rounded-2xl bg-red-50 border border-red-200 p-5 text-red-900 text-sm md:text-base animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Documents Content */}
        {loadingDocs ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-stone-200/80 shadow-subtle">
            <Loader2 className="h-10 w-10 animate-spin text-lernivox-forest" />
            <p className="mt-4 text-base text-stone-600">Fetching your learning materials...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-24 px-8 bg-white/85 backdrop-blur-md rounded-[2.5rem] border border-stone-200/80 shadow-card">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-lernivox-peach/70 text-lernivox-terracotta mb-6 shadow-sm">
              <UploadCloud className="h-10 w-10" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-lernivox-forest">
              No course documents yet
            </h3>
            <p className="mt-3 text-base md:text-lg text-stone-600 max-w-lg mx-auto leading-relaxed">
              Upload your first textbook, syllabus, or lecture slides to trigger asynchronous text extraction, semantic chunking, and vector indexing.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowUploadModal(true)}
              className="mt-8 px-8 shadow-glow-terracotta"
            >
              <Plus className="mr-2 h-5 w-5" />
              Upload Textbook Now
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5">
              {documents.map((doc) => {
                const isDeleting = deletingId === doc.id;
                const isReady = doc.status === 'READY';
                const isFailed = doc.status === 'FAILED';

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2rem] border border-stone-200/80 bg-white/90 backdrop-blur-md p-8 md:p-10 shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-lernivox-forest border border-stone-200 flex-shrink-0 mt-0.5 shadow-subtle">
                        <FileText className="h-7 w-7" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-xl md:text-2xl font-bold text-lernivox-forest">
                            {doc.title}
                          </h3>
                          {renderStatusBadge(doc.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
                          <span>File: {doc.fileName || 'Pasted Notes'}</span>
                          <span>•</span>
                          <span>Size: {(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                          {doc.pageCount && (
                            <>
                              <span>•</span>
                              <span>{doc.pageCount} Pages</span>
                            </>
                          )}
                          {doc.totalTokens && (
                            <>
                              <span>•</span>
                              <span>~{doc.totalTokens} Tokens</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Error info if failed */}
                        {isFailed && doc.errorMessage && (
                          <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-2xl border border-red-200 font-medium">
                            {doc.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      {isReady && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInspectChunks(doc)}
                          className="gap-2 px-5 text-sm font-semibold"
                        >
                          <Eye className="h-4 w-4 text-lernivox-forest" />
                          Inspect Chunks
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2.5 h-11 w-11 rounded-full"
                        title="Delete document"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-[2.5rem] border border-stone-200/80 bg-white p-8 sm:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => !uploading && setShowUploadModal(false)}
              className="absolute top-6 right-6 text-stone-500 hover:text-lernivox-forest p-2 rounded-full hover:bg-stone-100 transition"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="font-display text-2xl md:text-3xl font-bold text-lernivox-forest mb-2">
              Add Learning Material
            </h2>
            <p className="text-sm md:text-base text-stone-600 mb-6">
              Files will be stored securely and queued for extraction, chunking, and vector indexing.
            </p>

            {/* Tab switch */}
            <div className="flex rounded-full bg-stone-100 p-1.5 mb-6 border border-stone-200/80">
              <button
                type="button"
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-full transition-all ${
                  uploadTab === 'file'
                    ? 'bg-lernivox-forest text-white shadow-sm'
                    : 'text-stone-600 hover:text-lernivox-forest'
                }`}
              >
                Upload File (PDF, DOCX, TXT)
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('text')}
                className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-full transition-all ${
                  uploadTab === 'text'
                    ? 'bg-lernivox-forest text-white shadow-sm'
                    : 'text-stone-600 hover:text-lernivox-forest'
                }`}
              >
                Paste Raw Notes
              </button>
            </div>

            {uploadError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadTab === 'file' ? (
              <div className="space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-8 text-center hover:bg-stone-50 hover:border-lernivox-forest transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <UploadCloud className="mx-auto h-10 w-10 text-lernivox-terracotta mb-3" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm md:text-base font-bold text-lernivox-forest truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm md:text-base font-bold text-lernivox-forest">
                        Select textbook or lecture file
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        PDF, DOCX, TXT up to 25 MB
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="custom-title-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Document Title (Optional)
                  </label>
                  <input
                    id="custom-title-input"
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Molecular Biology Chapter 4"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-lernivox-forest focus:outline-none focus:border-lernivox-forest"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label htmlFor="pasted-title-modal-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Notes Title *
                  </label>
                  <input
                    id="pasted-title-modal-input"
                    type="text"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    placeholder="e.g. Microeconomics Elasticity Notes"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-lernivox-forest focus:outline-none focus:border-lernivox-forest"
                  />
                </div>

                <div>
                  <label htmlFor="pasted-content-modal-textarea" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Content *
                  </label>
                  <textarea
                    id="pasted-content-modal-textarea"
                    rows={6}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder="Paste lecture notes or chapter excerpts here..."
                    className="w-full rounded-2xl border border-stone-300 bg-white p-4 text-sm text-lernivox-forest focus:outline-none focus:border-lernivox-forest font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-3.5 pt-6 border-t border-stone-200">
              <Button
                variant="outline"
                size="md"
                disabled={uploading}
                onClick={() => setShowUploadModal(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={uploading || (uploadTab === 'file' && !selectedFile) || (uploadTab === 'text' && !pastedContent.trim())}
                onClick={handleUploadSubmit}
                className="px-6 shadow-glow-terracotta"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  'Enqueue Ingestion'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-4xl rounded-[2.5rem] border border-stone-200/80 bg-white p-8 sm:p-12 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setInspectingDoc(null)}
              className="absolute top-6 right-6 text-stone-500 hover:text-lernivox-forest p-2 rounded-full hover:bg-stone-100 transition"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="border-b border-stone-200 pb-5 mb-6">
              <h2 className="font-display text-2xl font-bold text-lernivox-forest">
                Vector Indexed Chunks — {inspectingDoc.title}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Chunks stored in PostgreSQL with 768-dimensional pgvector embeddings.
              </p>
            </div>

            {loadingChunks ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-lernivox-forest" />
                <p className="text-sm text-stone-600 mt-3">Loading semantic chunks...</p>
              </div>
            ) : chunkError ? (
              <div className="p-5 rounded-2xl bg-red-50 text-red-800 text-sm">{chunkError}</div>
            ) : chunks.length === 0 ? (
              <div className="py-16 text-center text-sm text-stone-500">
                No chunks available for this document.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-3">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-5 rounded-2xl border border-stone-200/80 bg-stone-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                      <span>Chunk #{chunk.chunkIndex + 1}</span>
                      <div className="flex items-center gap-3">
                        {chunk.hasEmbedding && (
                          <span className="rounded-full bg-purple-100 text-purple-800 px-3 py-0.5 font-bold">
                            pgvector (768d)
                          </span>
                        )}
                        <span>~{chunk.tokenCount} tokens</span>
                      </div>
                    </div>
                    <p className="text-stone-800 font-mono text-xs md:text-sm leading-relaxed bg-white p-4 rounded-xl border border-stone-200 shadow-subtle">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-stone-200 flex justify-end">
              <Button variant="outline" size="md" onClick={() => setInspectingDoc(null)} className="px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

