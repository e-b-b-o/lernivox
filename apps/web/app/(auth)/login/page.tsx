import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back to Lernivox</CardTitle>
          <p className="text-sm text-lernivox-forest-muted">
            Sign in to access your course workspaces and lecture notes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-lernivox-forest uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="student@university.edu"
                disabled
                className="mt-1 w-full rounded-xl border border-lernivox-stone bg-white px-3 py-2 text-sm opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-lernivox-forest uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                disabled
                className="mt-1 w-full rounded-xl border border-lernivox-stone bg-white px-3 py-2 text-sm opacity-60"
              />
            </div>
            <Button variant="primary" className="w-full" disabled>
              Sign In (Authentication Planned for Phase 5)
            </Button>
            <div className="text-center text-xs text-lernivox-forest-muted">
              <Link href="/" className="hover:underline">
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
