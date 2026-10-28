import Link from 'next/link';
import { UploadCloud, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function MarketingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col px-6 py-12 sm:py-20">
      {/* Hero Header */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-lernivox-stone bg-lernivox-cream-light px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-lernivox-forest-muted">
          <Sparkles className="h-3.5 w-3.5 text-lernivox-terracotta" />
          Zero-Hallucination Academic Intelligence
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-lernivox-forest sm:text-6xl">
          Transform textbooks into an <br className="hidden sm:inline" />
          <span className="text-lernivox-terracotta">interactive tutor</span> with citations.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-lernivox-forest-muted sm:text-xl">
          Lernivox converts lecture slides, research papers, and textbook chapters
          into verified quizzes, structured revision cards, and chapter-grounded study plans.
        </p>
      </section>

      {/* Prominent Textbook/Document Upload Entry Point */}
      <section id="upload" className="mt-12 sm:mt-16">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border-2 border-dashed border-lernivox-stone bg-lernivox-cream-light p-8 text-center transition hover:border-lernivox-terracotta/70 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lernivox-peach/40 text-lernivox-terracotta">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-lernivox-forest">
            Upload your course documents
          </h2>
          <p className="mt-2 text-sm text-lernivox-forest-muted">
            Drag & drop PDF or DOCX lecture slides and textbooks (up to 50MB)
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <UploadCloud className="mr-2 h-5 w-5" />
                Select Document to Ingest
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Demo Workspace
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-lernivox-forest-muted">
            🔒 Private textbook assets are protected with strict workspace access controls.
          </p>
        </div>
      </section>

      {/* Core Highlights */}
      <section id="features" className="mt-16 sm:mt-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-lernivox-peach/30 text-lernivox-terracotta">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <CardTitle>Verified Source Citations</CardTitle>
            </CardHeader>
            <CardContent>
              Every answer links directly to the specific chapter, page number, and quote in your textbook.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-lernivox-peach/30 text-lernivox-terracotta">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle>Automated Quizzes & Cards</CardTitle>
            </CardHeader>
            <CardContent>
              Generate spaced-repetition flashcards and multiple-choice quizzes linked directly to learning objectives.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-lernivox-peach/30 text-lernivox-terracotta">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>Exam Readiness Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              Measure topic mastery, target weak concept chapters, and monitor readiness before exam day.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
