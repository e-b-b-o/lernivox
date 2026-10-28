import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create your Lernivox Account</CardTitle>
          <p className="text-sm text-lernivox-forest-muted">
            Start transforming textbooks into verified study plans.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-lernivox-forest uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Student"
                disabled
                className="mt-1 w-full rounded-xl border border-lernivox-stone bg-white px-3 py-2 text-sm opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-lernivox-forest uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="alex@university.edu"
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
            <Button variant="secondary" className="w-full" disabled>
              Create Account (Phase 5)
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
