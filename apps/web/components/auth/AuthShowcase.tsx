import React from 'react';

export interface AuthShowcaseProps {
  mode?: 'login' | 'register';
}

/**
 * Right-hand desktop showcase on auth routes.
 * Integrates the existing student-reading portrait cleanly onto the shared cozy library atmosphere
 * without any opaque beige panel occlusion.
 */
export function AuthShowcase({ mode = 'register' }: AuthShowcaseProps) {
  const isLogin = mode === 'login';

  return (
    <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-l from-[#F4EFE4]/20 via-transparent to-transparent flex-col items-center justify-center gap-8 xl:gap-10 min-h-screen p-8 xl:p-14 relative overflow-hidden select-none">
      {/* Center Stage: Translucent Warm Halo Arch + Portrait Cutout + Floating Card */}
      <div className="relative w-full max-w-[420px] xl:max-w-[440px] flex items-center justify-center px-2">
        {/* Soft Translucent Frosted Arch framing portrait smoothly against library shelves */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 w-[290px] xl:w-[330px] h-[330px] xl:h-[370px] rounded-t-[170px] rounded-b-[44px] bg-gradient-to-b from-[#FAF6EE]/68 via-[#F8E7D9]/48 to-[#FAF6EE]/32 backdrop-blur-[3px] border border-[#FAF8F4]/70 shadow-[0_24px_54px_-18px_rgba(20,38,29,0.14)] pointer-events-none"
        />

        {/* Grounding Contact Shadow beneath crossed legs */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 w-56 h-6 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(20,38,29,0.18)_0%,rgba(20,38,29,0.06)_52%,transparent_76%)] blur-[2px] pointer-events-none z-[5]"
        />

        {/* Student Photo Cutout — original image preserved, subtle bottom feather removes studio-floor sliver */}
        <div className="relative z-10 w-[275px] xl:w-[315px] aspect-[4/5] flex items-end justify-center pb-2">
          <img
            src="/images/student-reading.png"
            alt="Student reading with textbook"
            className="w-full h-auto max-h-[375px] object-contain drop-shadow-[0_14px_28px_rgba(20,38,29,0.15)] [mask-image:linear-gradient(to_top,transparent_0%,black_6%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_0%,black_6%,black_100%)]"
          />
        </div>

        {/* Floating Tactile Testimonial Card */}
        <div
          className="absolute bottom-1 right-0 xl:-right-3 w-[236px] xl:w-[258px] bg-[#FAF8F4]/95 backdrop-blur-sm border-[1.5px] border-[#1B3428] rounded-[22px] p-4 shadow-[0_6px_0_0_#1B3428] z-20 transform -rotate-[2deg] hover:rotate-0 transition-transform duration-200"
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
          <p className="font-sans text-[11px] text-[#14261D]/65">
            Second-year student
          </p>
        </div>
      </div>

      {/* High-Contrast Localized Scrim for Value Proposition Lockup */}
      <div className="relative z-10 text-center max-w-md mx-auto rounded-[24px] bg-[#FAF8F4]/86 backdrop-blur-md border border-[#1B3428]/10 px-6 py-4 shadow-[0_14px_34px_-16px_rgba(20,38,29,0.14)]">
        {isLogin ? (
          <>
            <h3 className="font-display font-extrabold text-2xl xl:text-[1.75rem] text-[#14261D] tracking-tight leading-tight mb-2">
              Your learning{' '}
              <span className="text-[#497E64]">continues here.</span>
            </h3>
            <p className="font-sans text-xs xl:text-sm text-[#14261D]/78 leading-relaxed">
              Open your books, ask questions, and pick up where you left off.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-display font-extrabold text-2xl xl:text-[1.75rem] text-[#14261D] tracking-tight leading-tight mb-2">
              Make every book{' '}
              <span className="text-[#497E64]">easier to understand.</span>
            </h3>
            <p className="font-sans text-xs xl:text-sm text-[#14261D]/78 leading-relaxed">
              Bring your books or notes and learn at your own pace.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
