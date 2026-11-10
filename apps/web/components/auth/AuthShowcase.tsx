import React from 'react';

export interface AuthShowcaseProps {
  mode?: 'login' | 'register';
}

export function AuthShowcase({ mode = 'register' }: AuthShowcaseProps) {
  const isLogin = mode === 'login';

  return (
    <div className="hidden lg:flex lg:col-span-6 bg-[#EAE4D3] border-l border-[#1B3428]/10 flex-col items-center justify-center gap-10 xl:gap-12 min-h-screen p-10 xl:p-14 relative overflow-hidden select-none">
      {/* Center Stage: Photo Cutout + Backdrop Arch + Floating Card */}
      <div className="relative w-full max-w-md flex items-center justify-center">
        {/* Soft Peach Backdrop Arch */}
        <div 
          className="absolute bottom-4 w-[280px] sm:w-[320px] h-[320px] sm:h-[360px] bg-[#FBE8DC] rounded-t-[160px] rounded-b-[40px] border border-[#1B3428]/10 pointer-events-none"
        />

        {/* Student Photo Cutout */}
        <div className="relative z-10 w-[280px] sm:w-[320px] aspect-[4/5] flex items-end justify-center">
          <img
            src="/images/student-reading.png"
            alt="Student reading with textbook"
            className="w-full h-auto max-h-[380px] object-contain drop-shadow-[0_12px_24px_rgba(20,38,29,0.12)]"
          />
        </div>

        {/* Floating Tactile Testimonial Card */}
        <div 
          className="absolute -bottom-4 -right-2 sm:-right-4 w-[240px] sm:w-[260px] bg-white border-[1.5px] border-[#1B3428] rounded-[22px] p-4 shadow-[0_6px_0_0_#1B3428] z-20 transform -rotate-[2deg] hover:rotate-0 transition-transform duration-200"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#E2EBD8] text-[#497E64] font-sans text-[10px] font-bold">
              Verified Student
            </span>
            <div className="flex text-[#F59E0B] text-xs">★★★★★</div>
          </div>
          <p className="font-sans text-xs text-[#14261D] leading-snug font-medium mb-1">
            &ldquo;This platform explained my hardest course topics in 10 minutes when the textbook made no sense.&rdquo;
          </p>
          <p className="font-sans text-[11px] text-[#14261D]/60">
            Second-year student
          </p>
        </div>
      </div>

      {/* Clean Value Proposition Lockup */}
      <div className="relative z-10 text-center max-w-sm mx-auto">
        {isLogin ? (
          <>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14261D] tracking-tight leading-tight mb-2.5">
              Your learning{' '}
              <span className="text-[#497E64]">continues here.</span>
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#14261D]/75 leading-relaxed">
              Open your books, ask questions, and pick up where you left off.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14261D] tracking-tight leading-tight mb-2.5">
              Make every book{' '}
              <span className="text-[#497E64]">easier to understand.</span>
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#14261D]/75 leading-relaxed">
              Bring your books or notes and learn at your own pace.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

