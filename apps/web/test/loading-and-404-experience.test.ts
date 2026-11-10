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

    // Dashboard page renders responsive BookCardSkeleton grid when loading
    assert.match(dashboardPageCode, /BookCardSkeleton/);
    assert.match(
      dashboardPageCode,
      /grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5/
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

    // Footer descriptive copy
    assert.match(
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
});

