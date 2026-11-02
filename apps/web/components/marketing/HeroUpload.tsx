'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ScrollReveal, StaggerContainer } from '../ui/scroll-reveal';

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
    <section id="how-it-works" className="relative w-full max-w-full bg-[#EAE4D3] scroll-mt-0 overflow-hidden">
      {/* Pixel-Perfect Cloud Canopy Divider (Exact BrightPath Reference) */}
      <div className="w-full max-w-full overflow-hidden leading-none select-none pointer-events-none relative bg-[#F4F0E5]">
        <div
          className="w-full h-[64px] sm:h-[72px] md:h-[78px]"
          style={{
            backgroundImage: "url('/assets/cloud-divider.svg')",
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center top',
            backgroundSize: '1248px auto',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 md:px-10 pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-28 md:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Side (5 Columns / lg:col-span-5) — Editorial Context & Value Steps */}
          <div className="lg:col-span-5 text-left">
            <ScrollReveal id="workspace-heading" delay={0.1}>
              {/* Pill Tag */}
              <span className="bg-[#F9D8C0] text-[#14261D] font-sans text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-block mb-4 shadow-sm">
                Interactive Workspace
              </span>

              {/* Left Column Heading */}
              <h2 className="font-display font-extrabold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-[#14261D] tracking-tight leading-[1.08] mb-8">
                From dense PDFs to clear, guided{' '}
                <span
                  className="relative inline-block text-[#497E64] ml-1 select-none"
                  style={{
                    transform: 'translateY(-3px) rotate(2.2deg)',
                    transformOrigin: 'bottom right',
                    display: 'inline-block'
                  }}
                >
                  mastery.

                  {/* Multi-Stroke Hand-Drawn Marker Underline in #E8722C */}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-[12px] sm:h-[16px] text-[#E8722C] pointer-events-none overflow-visible"
                    viewBox="0 0 320 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 4 8 C 70 3, 200 4, 315 7"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 16 12 C 100 6, 230 11, 300 5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    <path
                      d="M 45 10 C 120 6, 190 8, 250 11"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      opacity="0.6"
                    />
                  </svg>

                  {/* Spark Ticks (//) top-right in #E8722C */}
                  <svg
                    className="absolute -top-3.5 -right-6 w-5 h-5 text-[#E8722C] pointer-events-none rotate-[10deg]"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 14L8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M12 16L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
            </ScrollReveal>

            {/* 3 Numbered Workflow Steps */}
            <StaggerContainer id="workspace-steps" initialDelay={0.1} staggerDelay={0.1} className="space-y-4 font-sans text-[#14261D]/80">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  1
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Drop your source file</strong> — Upload any syllabus, textbook chapter, or raw lecture notes (PDF, DOCX, TXT).
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  2
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Read guided breakdowns</strong> — Concepts are synthesized step-by-step, linked directly to your source text.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#1B3428] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  3
                </div>
                <p className="text-sm md:text-base leading-relaxed">
                  <strong className="text-[#14261D] font-semibold">Verify with practice</strong> — Test your understanding with active recall flashcards and worked methods.
                </p>
              </div>
            </StaggerContainer>
          </div>

          {/* Right Side (7 Columns / lg:col-span-7) — Tactile Framer Upload Card */}
          <ScrollReveal id="workspace-card" delay={0.25} distance={36} className="lg:col-span-7 w-full max-w-full">
            <div
              id="upload-card"
              className="w-full max-w-full bg-[#FAF8F4] border-[2px] border-[#1B3428] rounded-[24px] sm:rounded-[32px] shadow-[0_4px_0_0_#1B3428] sm:shadow-[0_6px_0_0_#1B3428] p-4 sm:p-6 md:p-8 transition-all duration-200"
            >
              {/* Tab Switcher ("Upload Document" vs "Paste Study Notes") */}
              <div className="w-full flex items-center p-1 bg-[#EAE4D3] rounded-full mb-6 border border-[#1B3428]/15">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('file');
                    setErrorMessage(null);
                  }}
                  className={`w-1/2 py-2 px-2 text-xs sm:text-sm font-semibold rounded-full transition-all text-center select-none truncate ${
                    activeTab === 'file'
                      ? 'bg-[#1B3428] text-white shadow-[0_2px_0_0_#497E64]'
                      : 'text-[#14261D]/70 hover:text-[#14261D]'
                  }`}
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMessage(null);
                  }}
                  className={`w-1/2 py-2 px-2 text-xs sm:text-sm font-semibold rounded-full transition-all text-center select-none truncate ${
                    activeTab === 'text'
                      ? 'bg-[#1B3428] text-white shadow-[0_2px_0_0_#497E64]'
                      : 'text-[#14261D]/70 hover:text-[#14261D]'
                  }`}
                >
                  Paste Study Notes
                </button>
              </div>

              {/* Success Notification */}
              {uploadSuccess && (
                <div className="mb-6 flex items-center gap-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-sm font-medium text-left">
                    <p>{uploadSuccess}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Redirecting to your workspace...</p>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {errorMessage && (
                <div className="mb-6 flex items-start gap-3.5 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-900 animate-fadeIn text-left">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Tab 1: File Upload */}
              {activeTab === 'file' && (
                <div className="space-y-5">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-[2px] border-dashed p-5 sm:p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 ${
                      isDragging
                        ? 'border-[#E8722C] bg-[#F9D8C0]/30'
                        : selectedFile
                          ? 'border-[#497E64] bg-[#497E64]/10'
                          : 'border-[#497E64]/40 bg-[#EAE4D3]/50 hover:border-[#E8722C]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-[#F9D8C0] text-[#E8722C] mb-3 sm:mb-4 shadow-sm">
                      <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>

                    {selectedFile ? (
                      <div className="space-y-1.5">
                        <p className="text-base font-bold text-[#14261D] truncate max-w-sm mx-auto font-sans">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-[#14261D]/70 font-sans">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                        </p>
                        <p className="text-xs text-[#497E64] font-medium pt-1 font-sans">
                          Click or drag another file to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base md:text-lg font-bold text-[#14261D] font-display">
                          Drop your textbook, syllabus, or lecture slides here
                        </p>
                        <p className="text-xs md:text-sm text-[#14261D]/70 mt-1.5 font-sans">
                          Drag and drop your file, or click to browse (up to 25 MB)
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                          <span className="rounded-full border border-[#1B3428]/15 bg-white px-3 py-1 text-xs font-semibold text-[#14261D] shadow-sm font-sans">
                            PDF
                          </span>
                          <span className="rounded-full border border-[#1B3428]/15 bg-white px-3 py-1 text-xs font-semibold text-[#14261D] shadow-sm font-sans">
                            DOCX
                          </span>
                          <span className="rounded-full border border-[#1B3428]/15 bg-white px-3 py-1 text-xs font-semibold text-[#14261D] shadow-sm font-sans">
                            TXT
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="text-left">
                      <label htmlFor="file-title-input" className="block text-xs font-semibold uppercase tracking-wider text-[#14261D] mb-1.5 font-sans">
                        Document Title (Optional)
                      </label>
                      <input
                        id="file-title-input"
                        type="text"
                        value={fileTitle}
                        onChange={(e) => setFileTitle(e.target.value)}
                        placeholder="e.g. Stewart Calculus Chapter 3"
                        className="w-full rounded-xl border border-[#1B3428]/20 bg-white px-4 py-2.5 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:border-[#1B3428] focus:outline-none focus:ring-1 focus:ring-[#1B3428] font-sans"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Pasted Text */}
              {activeTab === 'text' && (
                <div className="space-y-4 text-left">
                  <div>
                    <label htmlFor="pasted-title-input" className="block text-xs font-semibold uppercase tracking-wider text-[#14261D] mb-1.5 font-sans">
                      Study Notes / Chapter Title *
                    </label>
                    <input
                      id="pasted-title-input"
                      type="text"
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      placeholder="e.g. Cellular Respiration Summary"
                      className="w-full rounded-xl border border-[#1B3428]/20 bg-white px-4 py-2.5 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:border-[#1B3428] focus:outline-none focus:ring-1 focus:ring-[#1B3428] font-sans"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="pasted-content-textarea" className="block text-xs font-semibold uppercase tracking-wider text-[#14261D] font-sans">
                        Lecture Content or Excerpt *
                      </label>
                      <span className="text-xs text-[#14261D]/50 font-medium font-sans">
                        {pastedContent.length} chars
                      </span>
                    </div>
                    <textarea
                      id="pasted-content-textarea"
                      rows={5}
                      value={pastedContent}
                      onChange={(e) => setPastedContent(e.target.value)}
                      placeholder="Paste raw lecture transcripts, textbook passages, or problem-set notes here..."
                      className="w-full rounded-xl border border-[#1B3428]/20 bg-white p-3.5 text-sm text-[#14261D] placeholder-[#14261D]/40 focus:border-[#1B3428] focus:outline-none focus:ring-1 focus:ring-[#1B3428] resize-none font-sans leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Footer Auth / Action Bar */}
              <div className="border-t border-[#1B3428]/10 pt-5 mt-6">
                {isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left text-xs text-[#14261D]/70 font-sans">
                      <span className="font-semibold text-[#14261D]">Logged in as {user?.email}</span>
                      <p className="mt-0.5">Uploaded material will be indexed in your private workspace.</p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isSubmitting ||
                        (activeTab === 'file' && !selectedFile) ||
                        (activeTab === 'text' && !pastedContent.trim())
                      }
                      onClick={handleAuthenticatedSubmit}
                      className="w-full sm:w-auto h-[42px] px-6 rounded-full bg-[#E8722C] text-white font-sans text-sm font-semibold shadow-[0_3px_0_0_#B26E45] hover:-translate-y-[1px] hover:shadow-[0_4px_0_0_#B26E45] active:translate-y-[2px] active:shadow-[0_1px_0_0_#B26E45] transition-all inline-flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading & Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Process & Index Document</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-sans text-xs text-[#14261D]/60 text-center sm:text-left">
                      Free student account required to index files.
                    </p>

                    <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Sign In Button */}
                      <Link
                        href="/login"
                        className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-transparent text-[#14261D] font-display font-bold text-sm border-[1.5px] border-[#1B3428] shadow-[0_2px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-black/5 transition-all text-center select-none"
                      >
                        Sign In
                      </Link>
                      {/* Create Free Account Button */}
                      <Link
                        href="/register"
                        className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-[#E8722C] text-white font-display font-bold text-sm shadow-[0_3px_0_0_#1B3428] active:translate-y-0.5 active:shadow-none hover:bg-[#D66522] transition-all text-center select-none whitespace-nowrap"
                      >
                        Create Free Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}
