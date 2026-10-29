'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCode,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];

export function HeroUpload() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage(`Unsupported format (${ext}). Lernivox accepts PDF, DOCX, and TXT files.`);
      return false;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty.');
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File exceeds 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleAuthenticatedSubmit = async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'file') {
        if (!selectedFile) {
          setErrorMessage('Please choose a document to upload.');
          setIsSubmitting(false);
          return;
        }

        const res = await api.documents.uploadFile(selectedFile, accessToken, fileTitle);
        setUploadSuccess(
          `Document "${res.document.title}" uploaded! Enqueued for extraction, chunking, and embedding.`,
        );

        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } else {
        if (!pastedTitle.trim()) {
          setErrorMessage('Please provide a title for your study notes.');
          setIsSubmitting(false);
          return;
        }
        if (!pastedContent.trim() || pastedContent.trim().length < 20) {
          setErrorMessage('Please enter at least 20 characters of study notes to process.');
          setIsSubmitting(false);
          return;
        }

        const res = await api.documents.createFromText(
          {
            title: pastedTitle.trim(),
            content: pastedContent.trim(),
          },
          accessToken,
        );

        setUploadSuccess(
          `Notes "${res.document.title}" saved and enqueued for background processing!`,
        );

        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit document for processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[2.5rem] border border-stone-200/80 bg-white/90 backdrop-blur-md p-8 md:p-12 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header bar inside card */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-lernivox-forest">
            Ingest Learning Material
          </h2>
          <p className="text-sm md:text-base text-stone-600 mt-1">
            Files are parsed, chunked semantically, and embedded into 768-dimensional vectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Worker Ready
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-full bg-stone-100/90 p-1.5 mb-8 border border-stone-200/80">
        <button
          type="button"
          onClick={() => {
            setActiveTab('file');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-full transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-lernivox-forest text-white shadow-sm'
              : 'text-stone-600 hover:text-lernivox-forest'
          }`}
        >
          Upload Document (PDF, DOCX, TXT)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('text');
            setErrorMessage(null);
          }}
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-full transition-all duration-200 ${
            activeTab === 'text'
              ? 'bg-lernivox-forest text-white shadow-sm'
              : 'text-stone-600 hover:text-lernivox-forest'
          }`}
        >
          Paste Study Notes
        </button>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="mb-8 flex items-center gap-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div className="text-sm md:text-base font-medium">
            <p>{uploadSuccess}</p>
            <p className="text-xs md:text-sm text-emerald-700 mt-0.5">Redirecting to your workspace...</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-8 flex items-start gap-3.5 rounded-2xl bg-red-50 border border-red-200 p-5 text-red-900 animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm md:text-base font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Tab 1: File Upload */}
      {activeTab === 'file' && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-[2rem] border-2 border-dashed p-10 md:p-14 text-center transition-all duration-300 ${
              isDragging
                ? 'border-lernivox-terracotta bg-lernivox-peach/40 scale-[1.01]'
                : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-stone-300 bg-lernivox-cream/40 hover:border-lernivox-forest hover:bg-lernivox-cream/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lernivox-peach text-lernivox-terracotta mb-4 shadow-sm">
              <UploadCloud className="h-8 w-8" />
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-base md:text-lg font-bold text-lernivox-forest truncate max-w-lg mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-stone-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                </p>
                <p className="text-xs text-emerald-700 font-medium pt-1">
                  Click or drag another file to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg md:text-xl font-bold text-lernivox-forest">
                  Drop your textbook, syllabus, or lecture slides here
                </p>
                <p className="text-sm md:text-base text-stone-600 mt-2">
                  Supported formats: PDF, DOCX, TXT (up to 25 MB)
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <span className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-subtle">
                    PDF Document
                  </span>
                  <span className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-subtle">
                    Word (.docx)
                  </span>
                  <span className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-subtle">
                    Text (.txt)
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div>
              <label htmlFor="file-title-input" className="block text-sm font-semibold text-lernivox-forest mb-2">
                Document Title (Optional)
              </label>
              <input
                id="file-title-input"
                type="text"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="e.g. Stewart Calculus Chapter 3"
                className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3 text-base text-lernivox-forest placeholder-stone-400 focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pasted Text */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="pasted-title-input" className="block text-sm font-semibold text-lernivox-forest mb-2">
              Study Notes / Chapter Title *
            </label>
            <input
              id="pasted-title-input"
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g. Cellular Respiration Summary"
              className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3 text-base text-lernivox-forest placeholder-stone-400 focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="pasted-content-textarea" className="block text-sm font-semibold text-lernivox-forest">
                Lecture Content or Excerpt *
              </label>
              <span className="text-xs text-stone-500 font-medium">
                {pastedContent.length} characters
              </span>
            </div>
            <textarea
              id="pasted-content-textarea"
              rows={6}
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste raw lecture transcripts, textbook passages, or problem-set notes here..."
              className="w-full rounded-2xl border border-stone-300 bg-white p-4 text-base text-lernivox-forest placeholder-stone-400 focus:border-lernivox-forest focus:outline-none focus:ring-1 focus:ring-lernivox-forest resize-none font-mono text-sm leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Action Area based on Authentication Status */}
      <div className="mt-8 pt-6 border-t border-stone-200/80">
        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left text-sm text-stone-600">
              <span className="font-semibold text-lernivox-forest">Logged in as {user?.email}</span>
              <p className="mt-0.5">Uploaded material will be indexed in your private workspace.</p>
            </div>

            <Button
              variant="secondary"
              size="lg"
              disabled={isSubmitting || (activeTab === 'file' && !selectedFile) || (activeTab === 'text' && !pastedContent.trim())}
              onClick={handleAuthenticatedSubmit}
              className="w-full sm:w-auto px-8 font-semibold shadow-glow-terracotta"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                  Uploading & Queueing...
                </>
              ) : (
                <>
                  Process & Index Document
                  <ArrowRight className="ml-2.5 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl bg-stone-100/70 p-4 border border-stone-200/80 text-sm text-stone-600">
              <Lock className="h-5 w-5 text-lernivox-terracotta flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-lernivox-forest">Authentication Required for Processing</p>
                <p className="mt-1 leading-relaxed">
                  Lernivox preserves strict document ownership. Sign in or create a student account to upload, chunk, and index your learning materials.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto px-6">
                  Sign In to Ingest
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto px-6 shadow-glow-terracotta"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

