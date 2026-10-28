import Link from 'next/link';
import { BookOpen, FolderPlus, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-lernivox-forest">
            Student Workspace
          </h1>
        </div>

        <Button variant="primary" size="sm" disabled>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Course (Phase 6)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-lernivox-forest" />
              <CardTitle>Course Documents</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Course document library and textbook ingestion will be connected to the BullMQ background worker in Phase 6 & Phase 7.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-lernivox-terracotta" />
              <CardTitle>Active Study Sessions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Interactive tutor sessions, chapter quizzes, and flashcards will appear here upon document ingestion.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
