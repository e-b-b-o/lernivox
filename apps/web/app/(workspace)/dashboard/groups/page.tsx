'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GroupsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-2xl bg-[#E8722C] text-white flex items-center justify-center shadow-xs mb-3">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      </div>
      <p className="font-display font-bold text-xs text-[#14261D]/70">
        Redirecting to My Books...
      </p>
    </div>
  );
}
