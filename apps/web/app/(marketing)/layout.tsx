import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-lernivox-stone/60 bg-lernivox-cream/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lernivox-forest text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-lernivox-forest">
              Lernivox
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-lernivox-forest-muted transition hover:text-lernivox-forest"
            >
              How It Works
            </Link>
            <Link
              href="#upload"
              className="text-sm font-medium text-lernivox-forest-muted transition hover:text-lernivox-forest"
            >
              Document Ingestion
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-lernivox-forest-muted transition hover:text-lernivox-forest"
            >
              Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-lernivox-stone bg-lernivox-cream-light py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-lernivox-forest-muted">
            <span>© {new Date().getFullYear()} Lernivox. All rights reserved.</span>
          </div>
          <p className="text-xs text-lernivox-forest-muted">
            Source-grounded learning with verifiable citations.
          </p>
        </div>
      </footer>
    </div>
  );
}
