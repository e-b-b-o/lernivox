import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Unified Workspace Architecture Invariants', () => {
  const baseDir = path.resolve(import.meta.dirname, '..');
  const tutorHeaderPath = path.join(baseDir, 'components/workspace/TutorHeader.tsx');
  const documentReaderPath = path.join(baseDir, 'components/workspace/DocumentReader.tsx');
  const outlinePanePath = path.join(baseDir, 'components/workspace/DocumentOutlinePane.tsx');
  const profileMenuPath = path.join(baseDir, 'components/workspace/ProfileMenu.tsx');
  const workspacePagePath = path.join(
    baseDir,
    'app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx'
  );
  const globalsCssPath = path.join(baseDir, 'styles/globals.css');
  const copilotPath = path.join(baseDir, 'components/workspace/CopilotSidecar.tsx');
  const rightPanelPath = path.join(baseDir, 'components/workspace/RightWorkspacePanel.tsx');
  const flashcardsModalPath = path.join(baseDir, 'components/workspace/GenerateFlashcardsModal.tsx');
  const flashcardsViewPath = path.join(baseDir, 'components/workspace/WorkspaceFlashcardsView.tsx');
  const quizzesViewPath = path.join(baseDir, 'components/workspace/WorkspaceQuizzesView.tsx');
  const progressViewPath = path.join(baseDir, 'components/workspace/WorkspaceProgressView.tsx');
  const runnerPath = path.join(baseDir, 'components/workspace/FlashcardStudyRunner.tsx');
  const navbarPath = path.join(baseDir, 'components/marketing/Navbar.tsx');
  const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');

  const tutorHeaderCode = fs.readFileSync(tutorHeaderPath, 'utf8');
  const documentReaderCode = fs.readFileSync(documentReaderPath, 'utf8');
  const outlinePaneCode = fs.readFileSync(outlinePanePath, 'utf8');
  const profileMenuCode = fs.readFileSync(profileMenuPath, 'utf8');
  const workspacePageCode = fs.readFileSync(workspacePagePath, 'utf8');
  const globalsCssCode = fs.readFileSync(globalsCssPath, 'utf8');
  const copilotCode = fs.readFileSync(copilotPath, 'utf8');
  const rightPanelCode = fs.readFileSync(rightPanelPath, 'utf8');
  const flashcardsModalCode = fs.readFileSync(flashcardsModalPath, 'utf8');
  const flashcardsViewCode = fs.readFileSync(flashcardsViewPath, 'utf8');
  const quizzesViewCode = fs.readFileSync(quizzesViewPath, 'utf8');
  const progressViewCode = fs.readFileSync(progressViewPath, 'utf8');
  const runnerCode = fs.readFileSync(runnerPath, 'utf8');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');
  const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');

  test('1. "Read" is restored as the first study mode on desktop/tablet (Read | Quizzes | Flashcards | Progress), while mobile dock remains Outline | Review | AI Tutor', () => {
    // WorkspaceViewMode must include 'read'
    assert.match(
      tutorHeaderCode,
      /export type WorkspaceViewMode = 'read' \| 'quizzes' \| 'flashcards' \| 'progress';/,
      'WorkspaceViewMode must include read mode as first study option'
    );
    // TutorHeader segmented buttons must contain all 4 study modes starting with Read
    assert.match(tutorHeaderCode, /onViewChange\('read'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('quizzes'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('flashcards'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('progress'\)/);

    // Mobile dock must NOT contain a Read button (uses Outline | Review | AI Tutor)
    assert.doesNotMatch(
      workspacePageCode,
      /mobileDrawer === 'read'/,
      'Mobile drawer must not have a read state'
    );
  });

  test('2. TutorHeader implements Balanced Three-Zone True-Center Grid with Group Collaborator Pill', () => {
    // Three-zone grid container
    assert.match(
      tutorHeaderCode,
      /grid grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/,
      'TutorHeader must use a three-zone CSS grid with centered middle track'
    );

    // Zone 1: Brand lockup, outline toggle, document title
    assert.match(tutorHeaderCode, /Lernivox/);
    assert.match(tutorHeaderCode, /onToggleOutline/);

    // Zone 2: Centered navigation with Read, Quizzes, Flashcards, My Progress
    assert.match(tutorHeaderCode, /justify-self-center/);
    assert.match(tutorHeaderCode, /onViewChange\('read'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('quizzes'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('flashcards'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('progress'\)/);

    // Zone 3: Compact Collaborator pill for GROUP workspaces, Books launcher, and ProfileMenu
    assert.match(tutorHeaderCode, /workspaceType === 'GROUP' && onOpenManageGroupModal/);
    assert.match(tutorHeaderCode, /href="\/dashboard"/);
    assert.match(tutorHeaderCode, /ProfileMenu/);
  });

  test('3. Mobile architecture has constrained 3-column header, 56px bottom dock with Review, and synchronized auto-hide', () => {
    // Constrained 32px - flex - auto header on mobile (prevents 320px clipping)
    assert.match(workspacePageCode, /grid grid-cols-\[32px_minmax\(0,1fr\)_auto\]/);
    assert.match(workspacePageCode, /md:hidden fixed top-0 inset-x-0 z-30/);
    assert.match(workspacePageCode, /h-12 w-full border-b/);
    assert.match(workspacePageCode, /h-10 w-full border-b/);

    // 56px dock on mobile (h-14)
    assert.match(workspacePageCode, /md:hidden fixed bottom-0 inset-x-0 h-14/);

    // Mobile dock buttons: Outline, Review, AI Tutor
    assert.match(workspacePageCode, /mobileDrawer === 'toc'/);
    assert.match(workspacePageCode, /mobileDrawer === 'review'/);
    assert.match(workspacePageCode, /mobileDrawer === 'chat'/);

    // Mobile dock must NOT contain a Read button
    assert.doesNotMatch(
      workspacePageCode,
      /mobileDrawer === 'read'/,
      'Mobile drawer must not have a read state'
    );

    // Synchronized auto-hide translate classes
    assert.match(workspacePageCode, /mobileNavHidden \? '-translate-y-full' : 'translate-y-0'/);
    assert.match(workspacePageCode, /mobileNavHidden \? 'translate-y-full' : 'translate-y-0'/);

    // Space reclamation padding transition
    assert.match(workspacePageCode, /mobileNavHidden \? 'pt-0' : 'pt-\[88px\]'/);
  });

  test('4. Reader and Outline are permanently mounted and memoized against unnecessary rerenders', () => {
    // DocumentReader and DocumentOutlinePane are wrapped in memo
    assert.match(documentReaderCode, /export const DocumentReader = memo\(/);
    assert.match(outlinePaneCode, /export const DocumentOutlinePane = memo\(/);

    // DocumentReader is always present in main stage (never inside activeView conditional branch)
    assert.match(workspacePageCode, /<DocumentReader\s+document=/);
    assert.match(workspacePageCode, /<DocumentOutlinePane\s+isOpen=/);

    // No activeView conditional on DocumentReader
    const mainSectionMatch = workspacePageCode.match(/<main[\s\S]*?<\/main>/);
    assert.ok(mainSectionMatch, 'Main section must exist');
    assert.doesNotMatch(
      mainSectionMatch[0],
      /activeView ===/,
      'DocumentReader in main section must not be conditionally rendered based on activeView'
    );
  });

  test('5. PDF and reading text selection is natively restored and selectable', () => {
    // Global workspace shell must NOT have select-none
    const rootDivMatch = workspacePageCode.match(/return \(\s*<div className="([^"]*)"/);
    assert.ok(rootDivMatch && rootDivMatch[1], 'Root workspace div must exist');
    assert.doesNotMatch(
      rootDivMatch[1],
      /\bselect-none\b/,
      'Root workspace container must not have select-none'
    );

    // globals.css textLayer rules have user-select: text !important and terracotta selection tint
    assert.match(globalsCssCode, /\.textLayer[\s\S]*?user-select:\s*text\s*!important/);
    assert.match(globalsCssCode, /rgba\(232,\s*114,\s*44,\s*0\.2[58]\)/);

    // DocumentReader has Copy and Ask AI contextual buttons with onMouseDown preventDefault
    assert.match(documentReaderCode, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/);
    assert.match(documentReaderCode, /navigator\.clipboard\.writeText/);
    assert.match(documentReaderCode, /Ask AI/);
  });

  test('6. Secondary reader toolbar standardizes on paginated reading, removes Continuous/Embed toggle, and avoids overlap', () => {
    // Continuous vs Embed toggle is removed from toolbar UI
    assert.doesNotMatch(documentReaderCode, /Continuous PDF Reader/);
    assert.doesNotMatch(documentReaderCode, /Browser Native PDF Embed/);

    // Flex-based non-overlapping page navigation
    assert.match(documentReaderCode, /ChevronLeft/);
    assert.match(documentReaderCode, /ChevronRight/);

    // Compact bookmark toggle and zoom
    assert.match(documentReaderCode, /Bookmark/);
    assert.match(documentReaderCode, /onToggleBookmark/);
    assert.match(documentReaderCode, /ZoomIn/);
    assert.match(documentReaderCode, /ZoomOut/);
  });

  test('7. Desktop Zen Focus Mode provides distraction-free reading canvas with ghost bar', () => {
    // DocumentReader has Focus button in toolbar and minimal ghost bar
    assert.match(documentReaderCode, /title="Zen Reading Mode"/);
    assert.match(documentReaderCode, /Exit Focus \(Esc\)/);
    assert.match(documentReaderCode, /isFocusMode \? 'max-w-5xl mx-auto'/);

    // Workspace page manages isFocusMode state, Escape handler, and collapsing sidebars
    assert.match(workspacePageCode, /const \[isFocusMode, setIsFocusMode\] = useState\(false\)/);
    assert.match(workspacePageCode, /isFocusMode \? '-translate-y-full h-0/);
    assert.match(workspacePageCode, /isOpen=\{!isFocusMode && outlineOpen/);
    assert.match(workspacePageCode, /!isFocusMode && copilotOpen/);
  });

  test('8. Marketing HeroUpload has simulated interactive showcase without live file input', () => {
    const heroUploadPath = path.join(baseDir, 'components/marketing/HeroUpload.tsx');
    const heroUploadCode = fs.readFileSync(heroUploadPath, 'utf8');

    // No live file picker input
    assert.doesNotMatch(heroUploadCode, /<input[^>]*type="file"/);

    // Simulated sample selector
    assert.match(heroUploadCode, /SAMPLE_MATERIALS/);
    assert.match(heroUploadCode, /Neuroscience/);
    assert.match(heroUploadCode, /Macroeconomics/);

    // Conversion CTAs to /login and /register
    assert.match(heroUploadCode, /href="\/login"/);
    assert.match(heroUploadCode, /href="\/register"/);
  });

  test('9. ProfileMenu provides floating anchored popover on desktop and mobile', () => {
    // Desktop anchored dropdown
    assert.match(profileMenuCode, /hidden sm:block absolute right-0 top-full mt-2 w-72/);

    // Mobile viewport-bounded floating popover (escapes header containing block, never centered modal)
    assert.match(profileMenuCode, /createPortal\(/);
    assert.match(profileMenuCode, /role="dialog"/);
    assert.match(profileMenuCode, /aria-modal="true"/);
    assert.match(profileMenuCode, /fixed right-3 top-14 w-\[calc\(100vw-24px\)\] max-w-\[300px\] z-50 sm:hidden/);
    assert.match(profileMenuCode, /fixed inset-0 bg-black\/20 z-40 sm:hidden/);
    assert.match(profileMenuCode, /e\.key === 'Escape'/);
    assert.match(profileMenuCode, /mobileCardRef\.current\?\.contains\(target\)/);
  });

  test('10. Responsive navigation eliminates header collisions at tablet and constrained widths', () => {
    // Zone 1: Compact brand and outline icon on tablet (< xl); document title removed to prevent collisions
    assert.match(tutorHeaderCode, /hidden xl:inline">\s*Lernivox/);
    assert.match(tutorHeaderCode, /hidden xl:inline">\s*Outline/);
    assert.doesNotMatch(tutorHeaderCode, /doc\?\.title/);

    // Zone 2: Responsive labels preventing overflow
    assert.match(tutorHeaderCode, /<span className="hidden xl:inline whitespace-nowrap">Flashcards<\/span>\s*<span className="xl:hidden whitespace-nowrap">Cards<\/span>/);
    assert.match(tutorHeaderCode, /<span className="hidden xl:inline whitespace-nowrap">My Progress<\/span>\s*<span className="xl:hidden whitespace-nowrap">Progress<\/span>/);

    // Zone 3: Compact books launcher and group collaborator pill
    assert.match(tutorHeaderCode, /hidden xl:inline whitespace-nowrap">Books<\/span>/);
    assert.match(tutorHeaderCode, /workspaceType === 'GROUP' && onOpenManageGroupModal/);

    // Secondary toolbar: Document title truncated responsibly to avoid center stepper collision
    assert.match(documentReaderCode, /truncate max-w-\[130px\] lg:max-w-\[200px\] xl:max-w-\[300px\]/);
  });

  test('11. PDF text-layer ghosting is eliminated with transparent text and unshifted container', () => {
    // Transparent text fill for spans and br
    assert.match(globalsCssCode, /\.textLayer span,\s*\.textLayer :is\(span, br\)[\s\S]*?color:\s*transparent\s*!important/);
    assert.match(globalsCssCode, /-webkit-text-fill-color:\s*transparent\s*!important/);

    // No sub-pixel flex centering offset on ContinuousPdfPage container
    assert.doesNotMatch(documentReaderCode, /relative w-full overflow-hidden flex justify-center/);
  });

  test('12. Left TOC 48px rail is completely removed from collapsed layout', () => {
    // When !isOpen && !isMobileDrawer, DocumentOutlinePane must return null (zero width remnant)
    assert.match(outlinePaneCode, /if \(!isOpen && !isMobileDrawer\) \{\s*return null;\s*\}/);
    // 48px aside rail must NOT exist in the code
    assert.doesNotMatch(
      outlinePaneCode,
      /hidden lg:flex w-12/,
      'DocumentOutlinePane must not contain a 48px (w-12) collapsed rail'
    );
  });

  test('13. Chat text selection is enabled and composer textarea expands dynamically', () => {
    // Both CopilotSidecar and RightWorkspacePanel must NOT have select-none on root container
    assert.doesNotMatch(copilotCode, /flex-col select-none/);
    assert.doesNotMatch(rightPanelCode, /flex-col select-none/);

    // Message bubbles must explicitly have select-text cursor-text
    assert.match(copilotCode, /select-text cursor-text/);

    // Textarea must auto-expand with scrollHeight calculation up to max 160px
    assert.match(copilotCode, /textarea\.scrollHeight/);
    assert.match(copilotCode, /maxHeight\s*=\s*160/);
    assert.match(copilotCode, /minHeight\s*=\s*44/);
  });

  test('14. Phase 3B Flashcards integrates preview before saving, SM-2 ratings, and deck management', () => {
    // GenerateFlashcardsModal must support two-step flow with PREVIEW before saving
    assert.match(flashcardsModalCode, /step === 'PREVIEW'/);
    assert.match(flashcardsModalCode, /generatePreview/);
    assert.match(flashcardsModalCode, /handleCardChange/);
    assert.match(flashcardsModalCode, /handleDeleteCard/);
    assert.match(flashcardsModalCode, /Save & Create Deck/);

    // FlashcardStudyRunner must implement SuperMemo SM-2 ratings (1: Again, 2: Hard, 3: Good, 4: Easy)
    assert.match(runnerCode, /handleRate\(1\)/);
    assert.match(runnerCode, /handleRate\(2\)/);
    assert.match(runnerCode, /handleRate\(3\)/);
    assert.match(runnerCode, /handleRate\(4\)/);
    assert.match(runnerCode, /filterMode === 'due'/);

    // WorkspaceFlashcardsView must support deck renaming and study initiation
    assert.match(flashcardsViewCode, /handleRenameDeck/);
    assert.match(flashcardsViewCode, /handleStartReview/);
  });

  test('15. Application-wide responsiveness eliminates rigid pixel min-widths and enables tablet slide-over drawers', () => {
    // Navbar: No rigid pixel min-widths causing 768px-900px tablet collisions
    assert.doesNotMatch(navbarCode, /md:min-w-\[220px\]/);
    assert.doesNotMatch(navbarCode, /md:min-w-\[240px\]/);
    assert.match(navbarCode, /hidden md:flex items-center justify-center/);

    // Homepage photo showcase: fluid percentage widths preventing horizontal overflow across 320px–1024px
    assert.match(marketingPageCode, /w-\[27%\] max-w-\[220px\]/);
    assert.match(marketingPageCode, /w-\[38%\] max-w-\[320px\]/);
    assert.match(marketingPageCode, /w-\[28%\] max-w-\[240px\]/);

    // Workspace: Breakpoint consistency (< 768px mobile, >= 768px tablet/desktop)
    assert.match(workspacePageCode, /window\.innerWidth < 768/);

    // Workspace: Dedicated tablet slide-over drawers preventing crushed PDF reader
    assert.match(workspacePageCode, /hidden md:block fixed inset-0 top-14 z-40 bg-black\/30/);
    assert.match(workspacePageCode, /Tablet Left Outline Overlay/);
    assert.match(workspacePageCode, /Tablet Right Companion Sidecar Overlay/);
  });

  test('16. Final responsive corrections: single-docked-sidebar below 1280px, reader 620px floor, explore navbar dropdown, quiz CTA hierarchy, clean typography', () => {
    // Single-docked-sidebar rule below 1280px
    assert.match(workspacePageCode, /isBelow1280 && copilotOpen/);
    assert.match(workspacePageCode, /isOpen=\{!isFocusMode && outlineOpen && \(!isBelow1280 \|\| !copilotOpen\)\}/);

    // Reading canvas minimum usable width floor
    assert.match(workspacePageCode, /md:min-w-\[620px\] max-md:min-w-0 max-md:w-full/);

    // Outline drawer has NO duplicate collapse button inside header
    assert.doesNotMatch(outlinePaneCode, /PanelLeftClose/);

    // Quiz CTA hierarchy: only single primary button
    assert.match(quizzesViewCode, /quizzes\.length > 0 && \(/);
    assert.match(quizzesViewCode, /\+ Create New Quiz/);
    assert.doesNotMatch(quizzesViewCode, /Book Assessment Center/);

    // Flashcards & Progress typography cleanups
    assert.doesNotMatch(flashcardsViewCode, /Active Recall Decks/);
    assert.doesNotMatch(progressViewCode, /Individual Learning Report/);
    assert.doesNotMatch(progressViewCode, /Status in &ldquo;/);

    // Homepage tablet navigation (768px-1100px) compact Explore dropdown
    assert.match(navbarCode, /Explore/);
    assert.match(navbarCode, /min-\[1101px\]:hidden/);
    assert.match(navbarCode, /hidden min-\[1101px\]:flex/);
  });
});
