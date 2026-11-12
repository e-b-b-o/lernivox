import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Google Coming Soon, Branded 404 & Responsive Loading Architecture', () => {
  const baseDir = path.resolve(import.meta.dirname, '..');
  const loginPagePath = path.join(baseDir, 'app/(auth)/login/page.tsx');
  const registerPagePath = path.join(baseDir, 'app/(auth)/register/page.tsx');
  const googleModalPath = path.join(baseDir, 'components/auth/GoogleComingSoonModal.tsx');
  const notFoundPagePath = path.join(baseDir, 'app/not-found.tsx');
  const loadingComponentsPath = path.join(baseDir, 'components/ui/loading.tsx');
  const dashboardLoadingPath = path.join(baseDir, 'app/(workspace)/dashboard/loading.tsx');
  const dashboardPagePath = path.join(baseDir, 'app/(workspace)/dashboard/page.tsx');
  const workspaceLoadingPath = path.join(
    baseDir,
    'app/(workspace)/dashboard/workspaces/[workspaceId]/loading.tsx'
  );
  const workspacePagePath = path.join(
    baseDir,
    'app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx'
  );

  const loginPageCode = fs.readFileSync(loginPagePath, 'utf8');
  const registerPageCode = fs.readFileSync(registerPagePath, 'utf8');
  const googleModalCode = fs.readFileSync(googleModalPath, 'utf8');
  const notFoundPageCode = fs.readFileSync(notFoundPagePath, 'utf8');
  const loadingComponentsCode = fs.readFileSync(loadingComponentsPath, 'utf8');
  const dashboardLoadingCode = fs.readFileSync(dashboardLoadingPath, 'utf8');
  const dashboardPageCode = fs.readFileSync(dashboardPagePath, 'utf8');
  const workspaceLoadingCode = fs.readFileSync(workspaceLoadingPath, 'utf8');
  const workspacePageCode = fs.readFileSync(workspacePagePath, 'utf8');

  test('1. Google Coming Soon Modal is accessible and prevents broken OAuth redirect', () => {
    // Both login and register pages must import and render GoogleComingSoonModal
    assert.match(loginPageCode, /import\s+.*GoogleComingSoonModal.*from/);
    assert.match(registerPageCode, /import\s+.*GoogleComingSoonModal.*from/);

    // Neither page should initiate a direct redirect to getGoogleAuthUrl() on click
    assert.doesNotMatch(loginPageCode, /window\.location\.href\s*=\s*api\.auth\.getGoogleAuthUrl\(\)/);
    assert.doesNotMatch(registerPageCode, /window\.location\.href\s*=\s*api\.auth\.getGoogleAuthUrl\(\)/);

    // Google button opens the modal
    assert.match(loginPageCode, /setShowGoogleModal\(true\)/);
    assert.match(registerPageCode, /setShowGoogleModal\(true\)/);

    // GoogleComingSoonModal implements accessibility invariants
    assert.match(googleModalCode, /role="dialog"/);
    assert.match(googleModalCode, /aria-modal="true"/);
    assert.match(googleModalCode, /aria-labelledby="google-modal-title"/);
    assert.match(googleModalCode, /aria-describedby="google-modal-desc"/);

    // Keyboard support: Escape listener and body overflow lock
    assert.match(googleModalCode, /e\.key === 'Escape'/);
    assert.match(googleModalCode, /document\.body\.style\.overflow = 'hidden'/);

    // Context-aware actions
    assert.match(googleModalCode, /isLogin \? 'Log in with email' : 'Create account with email'/);
  });

  test('2. Branded 404 page is integrated with context-aware navigation and reading motif', () => {
    // Exists at app/not-found.tsx
    assert.ok(fs.existsSync(notFoundPagePath));

    // Uses client directive and useAuth for context-awareness
    assert.match(notFoundPageCode, /'use client'/);
    assert.match(notFoundPageCode, /useAuth\(\)/);

    // Primary action leads to home
    assert.match(notFoundPageCode, /href="\/"/);
    assert.match(notFoundPageCode, /Back to Home/);

    // Context-aware secondary action: /dashboard if authenticated, /login if unauthenticated
    assert.match(notFoundPageCode, /isAuthenticated/);
    assert.match(notFoundPageCode, /href="\/dashboard"/);
    assert.match(notFoundPageCode, /href="\/login"/);

    // Visual motif uses Lernivox design language
    assert.match(notFoundPageCode, /#FAF8F4/);
    assert.match(notFoundPageCode, /#14261D/);
    assert.match(notFoundPageCode, /#E8722C/);
    assert.match(notFoundPageCode, /font-display/);
  });

  test('3. Responsive loading skeletons mirror Dashboard and Workspace layout precisely', () => {
    // Loading components module exports primitives and full skeletons
    assert.match(loadingComponentsCode, /export function Skeleton/);
    assert.match(loadingComponentsCode, /export function InlineLoader/);
    assert.match(loadingComponentsCode, /export function BookCardSkeleton/);
    assert.match(loadingComponentsCode, /export function DashboardSkeleton/);
    assert.match(loadingComponentsCode, /export function WorkspaceSkeleton/);

    // Reduced motion support is built in
    assert.match(loadingComponentsCode, /motion-reduce:animate-none/);

    // Dashboard loading.tsx delegates to DashboardSkeleton
    assert.match(dashboardLoadingCode, /<DashboardSkeleton \/>/);

    // Dashboard page renders responsive 2-col phone / 3-4 col desktop BookCardSkeleton grid when loading
    assert.match(dashboardPageCode, /BookCardSkeleton/);
    assert.match(
      dashboardPageCode,
      /grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/
    );

    // Workspace loading.tsx delegates to WorkspaceSkeleton
    assert.match(workspaceLoadingCode, /<WorkspaceSkeleton \/>/);

    // Workspace page renders WorkspaceSkeleton when loadingWorkspace
    assert.match(workspacePageCode, /return <WorkspaceSkeleton \/>;/);
  });

  test('4. Freemium pricing restored to 999 Birr per month, and CTA / Footer copy polished', () => {
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const footerPath = path.join(baseDir, 'components/marketing/Footer.tsx');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');
    const footerCode = fs.readFileSync(footerPath, 'utf8');

    // Freemium plan name is visibly displayed
    assert.match(marketingPageCode, /<h3[^>]*>Freemium<\/h3>/);

    // Exact price must be 999 Birr per month
    assert.match(marketingPageCode, /999 Birr/);
    assert.match(marketingPageCode, /per month/);

    // No unintended 0 price or "Free preview" on Freemium card
    assert.doesNotMatch(marketingPageCode, /0 Birr[\s\S]*?during preview/);
    assert.doesNotMatch(marketingPageCode, /Free preview/);

    // CTA Section: "Your next book is ready to be understood."
    assert.match(marketingPageCode, /Your next book is ready to be/);
    assert.match(marketingPageCode, /understood\./);
    assert.match(marketingPageCode, /Bring your books or notes\. Read, ask questions, and learn at your own pace\./);

    // Footer wordmark redesign: paragraph removed for cleaner prominent brand lockup
    assert.match(footerCode, />[\s\n]*Lernivox[\s\n]*<\/span>/);
    assert.doesNotMatch(
      footerCode,
      /Bring your books and notes\. Read, ask your AI tutor questions, and understand more as you learn\./
    );
  });

  test('5. Frontend Login and Registration feature accessible validation and branded error UI', () => {
    // Both forms use noValidate to prevent raw browser tooltips
    assert.match(loginPageCode, /<form[^>]*noValidate/);
    assert.match(registerPageCode, /<form[^>]*noValidate/);

    // Email validation on both forms
    assert.match(loginPageCode, /Enter your email address\./);
    assert.match(loginPageCode, /Enter a valid email address\./);
    assert.match(registerPageCode, /Enter your email address\./);
    assert.match(registerPageCode, /Enter a valid email address\./);

    // Password validation: required on login; min 8 characters on register
    assert.match(loginPageCode, /Enter your password\./);
    assert.match(registerPageCode, /Your password must be at least 8 characters\./);

    // Confirm password validation on register
    assert.match(registerPageCode, /Confirm your password\./);
    assert.match(registerPageCode, /Passwords do not match\./);

    // Accessible error attributes
    assert.match(loginPageCode, /aria-invalid=/);
    assert.match(loginPageCode, /aria-describedby=/);
    assert.match(registerPageCode, /aria-invalid=/);
    assert.match(registerPageCode, /aria-describedby=/);

    // Branded auth-wide error mappings
    assert.match(
      loginPageCode,
      /We couldn't sign you in\. Check your email and password and try again\./
    );
    assert.match(
      registerPageCode,
      /An account with this email already exists\. Try logging in instead\./
    );
    assert.match(
      registerPageCode,
      /Log in to your account →/
    );
  });

  test('6. Reference Bookshelf Dashboard, Transparent Aligned Navbar, WebP Background & Unified Book Card', () => {
    const layoutPath = path.join(baseDir, 'app/(workspace)/layout.tsx');
    const bookCardPath = path.join(baseDir, 'components/workspace/BookCard.tsx');
    const navbarPath = path.join(baseDir, 'components/marketing/Navbar.tsx');
    const heroUploadPath = path.join(baseDir, 'components/marketing/HeroUpload.tsx');
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const layoutCode = fs.readFileSync(layoutPath, 'utf8');
    const bookCardCode = fs.readFileSync(bookCardPath, 'utf8');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    const heroUploadCode = fs.readFileSync(heroUploadPath, 'utf8');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');

    // 1. Authenticated Navbar is transparent and aligned with 1380px container
    assert.match(layoutCode, /max-w-\[1380px\]/);
    assert.match(layoutCode, /bg-transparent/);
    assert.match(layoutCode, /h-16 md:h-20/);
    assert.match(layoutCode, /library-cozy-bg\.webp/);
    assert.match(marketingPageCode, /library-cozy-bg\.webp/);

    // 2. Homepage Navbar stays transparent strictly at top of homepage and turns solid immediately on scroll
    assert.doesNotMatch(navbarCode, /IntersectionObserver/);
    assert.match(navbarCode, /window\.scrollY/);
    assert.match(navbarCode, /isAtTop/);
    assert.match(navbarCode, /isHomepage && isAtTop && !mobileMenuOpen/);
    assert.match(navbarCode, /bg-transparent border-b-\[1\.5px\] border-transparent/);

    // 3. Homepage How It Works auto-rotates examples cleanly every 2s with reduced-motion and visibility support
    assert.match(heroUploadCode, /function RotatingSampleShowcase/);
    assert.match(heroUploadCode, /prefers-reduced-motion/);
    assert.match(heroUploadCode, /visibilitychange/);
    assert.match(heroUploadCode, /},\s*2000\);/);

    // 4. Dashboard heading displays My (#1B2A23) + BOOKS in sage green #4A7D64 with tilted orange doodle underline
    assert.match(dashboardPageCode, /text-\[#1B2A23\][^>]*>[\s\n]*My[\s\n]*<\/span>/);
    assert.match(dashboardPageCode, />[\s\n]*BOOKS[\s\n]*</);
    assert.match(dashboardPageCode, /text-\[#4A7D64\]/);
    assert.match(dashboardPageCode, /rotate\(-2deg\)/);

    // 5. Dashboard toolbar & aligned reference grid (2 columns on phones, 3-4 columns on desktop, no extra shelf inset)
    assert.match(dashboardPageCode, /max-w-\[1380px\]/);
    assert.match(dashboardPageCode, /placeholder="Search your books\.\.\."/);
    assert.match(dashboardPageCode, /bg-\[#FFFFFF\]/);
    assert.match(dashboardPageCode, /All Materials/);
    assert.match(dashboardPageCode, /grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/);

    // 6. Reference Integrated Book Card (cover + #FAF6EE strip scaled proportionally for 2-up mobile cards)
    assert.match(bookCardCode, /rounded-xl sm:rounded-2xl overflow-hidden bg-\[#FAF6EE\]/);
    assert.match(bookCardCode, /min-h-\[146px\] xs:min-h-\[164px\] sm:min-h-\[205px\]/);
    assert.match(bookCardCode, /#1B3C2D/);
    assert.match(bookCardCode, /#E8722C/);
    assert.match(bookCardCode, /Last opened/);

    // 7. Honest waiting & delayed states without fake 0%
    assert.match(bookCardCode, /Worker starting\.\.\./);
    assert.match(bookCardCode, /Queued — Waiting to prepare\.\.\./);
    assert.match(bookCardCode, /Delayed — Waiting for worker/);

    // 8. BookCardSkeleton mirrors unified cover + footer proportions
    assert.match(loadingComponentsCode, /rounded-xl sm:rounded-2xl overflow-hidden bg-\[#FAF6EE\]/);
    assert.match(loadingComponentsCode, /min-h-\[146px\] xs:min-h-\[164px\] sm:min-h-\[205px\]/);

    // 9. Bricolage Grotesque typography inheritance (no duplicate @import or global span override)
    const globalsCssCode = fs.readFileSync(path.join(baseDir, 'styles/globals.css'), 'utf8');
    const wavingRibbonCode = fs.readFileSync(path.join(baseDir, 'components/marketing/WavingRibbon.tsx'), 'utf8');
    assert.doesNotMatch(globalsCssCode, /@import url\(/);
    assert.doesNotMatch(globalsCssCode, /\bp,\s*span,/);
    assert.match(globalsCssCode, /var\(--font-bricolage\)/);

    // 10. Hero moving ribbon spans edge-to-edge without #hero-section horizontal padding clipping
    assert.match(marketingPageCode, /id="hero-section"[\s\S]*?overflow-x-clip[\s\S]*?w-full/);
    assert.doesNotMatch(marketingPageCode, /id="hero-section"\s+className="[^"]*\bpx-4\b/);
    assert.doesNotMatch(wavingRibbonCode, /max-w-\[2200px\]/);
  });

  test('7. Fluid Dashboard Search Toolbar, Mobile Review Non-Blank Initial View & Safe Responsive Overflow', () => {
    const dashboardPageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(workspace)/dashboard/page.tsx'),
      'utf8'
    );
    const workspacePageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx'),
      'utf8'
    );
    const bookCardCode = fs.readFileSync(
      path.resolve(baseDir, 'components/workspace/BookCard.tsx'),
      'utf8'
    );

    // 1. Search input expands fluidly across remaining width before filters
    assert.match(dashboardPageCode, /relative flex-1 min-w-0 w-full/);
    assert.match(dashboardPageCode, /shrink-0 scrollbar-none/);

    // 2. Mobile Review Bottom Sheet guarantees non-blank default view (Quizzes)
    assert.match(workspacePageCode, /activeView === 'quizzes' \|\| !\['flashcards', 'plan', 'progress'\]\.includes\(activeView\)/);
    assert.match(workspacePageCode, /if \(!\['quizzes', 'flashcards', 'plan', 'progress'\]\.includes\(activeView\)\) \{\s*setActiveView\('quizzes'\);/);

    // 3. Mobile Review Switcher nav handles narrow viewports (320px–430px) without tab clipping
    assert.match(workspacePageCode, /overflow-x-auto scrollbar-none min-w-0 max-w-\[calc\(100%-36px\)\]/);

    // 4. Honest waiting & delayed states on book card without fake 0%
    assert.match(bookCardCode, /Worker starting\.\.\./);
    assert.match(bookCardCode, /Queued — Waiting to prepare\.\.\./);
    assert.match(bookCardCode, /Delayed — Waiting for worker/);
    assert.match(bookCardCode, /Check status/);
    assert.match(bookCardCode, /Retry processing/);
  });

  test('8. Client-Side In-Memory Cache, Functional Status Checking Feedback & Aligned Container Boundaries', () => {
    const clientCacheCode = fs.readFileSync(
      path.resolve(baseDir, 'lib/client-cache.ts'),
      'utf8'
    );
    const dashboardPageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(workspace)/dashboard/page.tsx'),
      'utf8'
    );
    const settingsPageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(workspace)/dashboard/settings/page.tsx'),
      'utf8'
    );
    const bookCardCode = fs.readFileSync(
      path.resolve(baseDir, 'components/workspace/BookCard.tsx'),
      'utf8'
    );

    // 1. Client cache module contract
    assert.match(clientCacheCode, /getDashboard/);
    assert.match(clientCacheCode, /setDashboard/);
    assert.match(clientCacheCode, /updateDashboardDocument/);
    assert.match(clientCacheCode, /removeDashboardDocument/);
    assert.match(clientCacheCode, /getWorkspace/);
    assert.match(clientCacheCode, /setWorkspace/);
    assert.match(clientCacheCode, /clearAll/);

    // 2. Aligned container architecture matching navbar 1380px boundaries
    assert.match(dashboardPageCode, /w-full px-4 sm:px-6 md:px-10 flex-1 flex flex-col/);
    assert.match(dashboardPageCode, /w-full max-w-\[1380px\] mx-auto py-8 sm:py-10 space-y-10 flex-1/);
    assert.match(settingsPageCode, /w-full px-4 sm:px-6 md:px-10 flex-1 flex flex-col/);
    assert.match(settingsPageCode, /w-full max-w-\[1380px\] mx-auto py-8 sm:py-10 flex-1 space-y-6/);

    // 3. Functional Check Status with Visible Feedback & Reserved Baseline Slot
    assert.match(bookCardCode, /onCheckStatus\?: \(id: string\)/);
    assert.match(bookCardCode, /handleCheckStatusClick/);
    assert.match(bookCardCode, /isCheckingStatus/);
    assert.match(bookCardCode, /min-h-\[2\.5rem\] sm:min-h-\[3\.25rem\] flex flex-col justify-center/);
    assert.match(bookCardCode, /line-clamp-2 min-h-\[2rem\] sm:min-h-\[2\.5rem\]/);
    assert.match(bookCardCode, /mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-\[#1B3428\]\/10 flex items-center/);
  });

  test('9. Unified Auth Background Integration, Editorial Vertical Divider & Seamless Portrait Showcase', () => {
    const authShellCode = fs.readFileSync(
      path.resolve(baseDir, 'components/auth/AuthSplitShell.tsx'),
      'utf8'
    );
    const authShowcaseCode = fs.readFileSync(
      path.resolve(baseDir, 'components/auth/AuthShowcase.tsx'),
      'utf8'
    );
    const loginPageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(auth)/login/page.tsx'),
      'utf8'
    );
    const registerPageCode = fs.readFileSync(
      path.resolve(baseDir, 'app/(auth)/register/page.tsx'),
      'utf8'
    );

    // 1. Both auth pages share AuthSplitShell with single shared WebP library background
    assert.match(loginPageCode, /<AuthSplitShell mode="login">/);
    assert.match(registerPageCode, /<AuthSplitShell mode="register">/);
    assert.doesNotMatch(loginPageCode, /library-cozy-bg\.webp/);
    assert.doesNotMatch(registerPageCode, /library-cozy-bg\.webp/);
    assert.equal(authShellCode.match(/library-cozy-bg\.webp/g)?.length, 1);

    // 2. Left form sits on high-contrast localized frosted warm-cream panel with desktop-only architectural divider
    assert.match(authShellCode, /bg-\[#FAF8F4\]\/92 backdrop-blur-md/);
    assert.match(authShellCode, /hidden lg:flex pointer-events-none absolute inset-y-8 xl:inset-y-12 left-1\/2/);

    // 3. Right showcase eliminates solid beige bg-[#EAE4D3] occlusion and preserves existing student-reading cutout
    assert.doesNotMatch(authShowcaseCode, /bg-\[#EAE4D3\]/);
    assert.doesNotMatch(authShowcaseCode, /border-l border-\[#1B3428\]\/10/);
    assert.match(authShowcaseCode, /\/images\/student-reading\.png/);
    assert.match(authShowcaseCode, /bg-\[#FAF8F4\]\/86 backdrop-blur-md/);
  });
});

