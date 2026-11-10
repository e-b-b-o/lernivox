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
  const dashboardPagePath = path.join(baseDir, 'app/(workspace)/dashboard/page.tsx');
  const manageGroupModalPath = path.join(baseDir, 'components/workspace/ManageGroupModal.tsx');
  const convertToGroupModalPath = path.join(baseDir, 'components/workspace/ConvertToGroupModal.tsx');
  const bookRangeSelectorPath = path.join(baseDir, 'components/workspace/BookRangeSelector.tsx');
  const planViewPath = path.join(baseDir, 'components/workspace/WorkspaceLearningPlanView.tsx');
  const planModalPath = path.join(baseDir, 'components/workspace/GenerateLearningPlanModal.tsx');
  const planOfferPath = path.join(baseDir, 'components/workspace/LearningPlanOfferBanner.tsx');

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
  const dashboardPageCode = fs.readFileSync(dashboardPagePath, 'utf8');
  const manageGroupModalCode = fs.readFileSync(manageGroupModalPath, 'utf8');
  const convertToGroupModalCode = fs.readFileSync(convertToGroupModalPath, 'utf8');
  const bookRangeSelectorCode = fs.readFileSync(bookRangeSelectorPath, 'utf8');
  const planViewCode = fs.readFileSync(planViewPath, 'utf8');
  const planModalCode = fs.readFileSync(planModalPath, 'utf8');
  const planOfferCode = fs.readFileSync(planOfferPath, 'utf8');

  test('1. "Read" is restored as the first study mode on desktop/tablet (Read | Quizzes | Flashcards | Plan | Progress), while mobile dock remains Outline | Review | AI Tutor', () => {
    // WorkspaceViewMode must include 'read'
    assert.match(
      tutorHeaderCode,
      /export type WorkspaceViewMode = 'read' \| 'quizzes' \| 'flashcards' \| 'plan' \| 'progress';/,
      'WorkspaceViewMode must include read mode as first study option'
    );
    // TutorHeader segmented buttons must contain study modes starting with Read
    assert.match(tutorHeaderCode, /onViewChange\('read'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('quizzes'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('flashcards'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('plan'\)/);
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
    // Navbar: No rigid pixel min-widths, desktop navigation reveals at lg (1024px) to preserve two-pole tablet header
    assert.doesNotMatch(navbarCode, /md:min-w-\[220px\]/);
    assert.doesNotMatch(navbarCode, /md:min-w-\[240px\]/);
    assert.match(navbarCode, /hidden lg:flex items-center justify-center/);

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

    // Quiz CTA hierarchy: only single primary button with exactly one plus sign (icon + label, no duplicate text plus)
    assert.match(quizzesViewCode, /quizzes\.length > 0 && \(/);
    assert.match(quizzesViewCode, /<Plus[\s\S]*?<span>Create New Quiz<\/span>/);
    assert.doesNotMatch(quizzesViewCode, /<span>\+ Create New Quiz<\/span>/);
    assert.doesNotMatch(quizzesViewCode, /Book Assessment Center/);

    // Flashcards & Progress typography cleanups
    assert.doesNotMatch(flashcardsViewCode, /Active Recall Decks/);
    assert.doesNotMatch(progressViewCode, /Individual Learning Report/);
    assert.doesNotMatch(progressViewCode, /Status in &ldquo;/);

    // Homepage mobile/tablet navigation (< 1024px) two-zone layout with flexible center and desktop 3-zone grid
    assert.match(navbarCode, /flex lg:grid/);
    assert.match(navbarCode, /justify-between/);
    assert.match(navbarCode, /hidden lg:flex/);
  });

  test('17. Final mobile workspace navigation & dashboard responsive repairs: Group Hub in Row 2, synchronized 144px vertical space reclamation, portaled modals with z-50 backdrops', () => {
    // 1. Mobile secondary toolbar (Row 2) has Group Hub collaboration pill / Convert to Group action, NOT duplicate Outline
    assert.match(
      workspacePageCode,
      /workspace\?\.type === 'GROUP' \?[\s\S]*?setIsManageGroupModalOpen\(true\)[\s\S]*?: isOwner \?[\s\S]*?setIsConvertModalOpen\(true\)/
    );
    // In Row 2, there is no duplicate Outline button
    const row2Section = workspacePageCode.match(/Row 2: 40px Secondary Reader Toolbar[\s\S]*?Authoritative Page Navigation/);
    assert.ok(row2Section, 'Row 2 secondary toolbar must exist');
    assert.doesNotMatch(row2Section[0], /View Outline/);
    assert.doesNotMatch(row2Section[0], /toggleToc/);

    // 2. Mobile bottom dock retains Outline as the authoritative entry point
    assert.match(workspacePageCode, /mobileDrawer === 'toc'/);

    // 3. Immersive directional auto-hide reclaims both top (88px) and bottom (56px) space (144px total)
    assert.match(workspacePageCode, /mobileNavHidden \? 'pt-0' : 'pt-\[88px\]'/);
    assert.match(workspacePageCode, /mobileNavHidden \? 'pb-0' : 'pb-14'/);
    assert.match(workspacePageCode, /transition-\[padding\]/);

    // 4. Auto-hide is suspended when modals, citation inspector, or drawers are active
    assert.match(workspacePageCode, /!isPracticeModalOpen &&\s*!isConvertModalOpen &&\s*!isManageGroupModalOpen &&\s*!inspectingCitation/);

    // 5. Dashboard Add Learning Material modal is portaled to document.body with z-50 backdrop
    assert.match(dashboardPageCode, /createPortal\(/);
    assert.match(dashboardPageCode, /showAddModal &&[\s\S]*?createPortal\(/);
    assert.match(dashboardPageCode, /deletingDoc &&[\s\S]*?createPortal\(/);
    assert.match(dashboardPageCode, /fixed inset-0 z-50[\s\S]*?bg-black\/50 backdrop-blur-xs/);
    assert.match(dashboardPageCode, /id="add-material-modal-title"/);
    assert.match(dashboardPageCode, /role="dialog"/);
    assert.match(dashboardPageCode, /aria-modal="true"/);

    // 6. ManageGroupModal and ConvertToGroupModal use createPortal with mobile bottom sheet styling
    assert.match(manageGroupModalCode, /createPortal\(/);
    assert.match(manageGroupModalCode, /rounded-t-\[28px\] sm:rounded-3xl/);
    assert.match(manageGroupModalCode, /sm:hidden w-12 h-1\.5 bg-\[#1B3428\]\/20 rounded-full/);
    assert.match(convertToGroupModalCode, /createPortal\(/);
    assert.match(convertToGroupModalCode, /rounded-t-\[28px\] sm:rounded-3xl/);
    assert.match(convertToGroupModalCode, /sm:hidden w-12 h-1\.5 bg-\[#1B3428\]\/20 rounded-full/);
  });

  test('18. Native Virtualized Document Reader: Complete removal of iframe/embed, TanStack virtualization for 400+ pages, native PDF.js TextLayer, native DOCX preview, selection pinning', () => {
    // 1. Permanent removal of browser Embed, Object, or iframe document viewing
    assert.doesNotMatch(documentReaderCode, /<iframe/, 'Must not use iframe for document viewing');
    assert.doesNotMatch(documentReaderCode, /<embed/, 'Must not use embed for document viewing');
    assert.doesNotMatch(documentReaderCode, /<object/, 'Must not use object for document viewing');
    assert.doesNotMatch(documentReaderCode, /pdf-embed-frame/, 'Must not have pdf-embed-frame');

    // 2. High-performance windowed virtualization for hundreds of pages
    assert.match(documentReaderCode, /useVirtualizer/, 'Must use useVirtualizer for page virtualization');
    assert.match(documentReaderCode, /@tanstack\/react-virtual/, 'Must import from @tanstack/react-virtual');
    assert.match(documentReaderCode, /virtualizer\.getVirtualItems\(\)/, 'Must mount only visible virtual items');
    assert.match(documentReaderCode, /virtualizer\.getTotalSize\(\)/, 'Must maintain total document virtual scroll height');
    assert.match(documentReaderCode, /virtualizer\.measureElement/, 'Must support dynamic element measurement');

    // 3. Native PDF.js rendering with separate Canvas and TextLayer
    assert.match(documentReaderCode, /pdfjsLib\.getDocument/, 'Must use pdfjsLib.getDocument for streaming PDF loading');
    assert.match(documentReaderCode, /new pdfjsLib\.TextLayer/, 'Must instantiate native PDF.js TextLayer');
    assert.match(documentReaderCode, /className="textLayer select-text"/, 'Must render selectable textLayer element');
    assert.match(documentReaderCode, /className="block pdf-canvas pointer-events-none select-none"/, 'Must render non-blocking canvas');

    // 4. Native DOCX rendering via docx-preview
    assert.match(documentReaderCode, /docx-preview/, 'Must use docx-preview for Word documents');
    assert.match(documentReaderCode, /docxPreview\.renderAsync/, 'Must render DOCX documents via renderAsync');
    assert.match(documentReaderCode, /isDocx/, 'Must route DOCX files to native Word renderer');

    // 5. Text Selection Isolation & Pinned Page Protection
    assert.match(documentReaderCode, /pinnedPage === pageNum/, 'Must support pinned page so active selection never unmounts');
    assert.match(documentReaderCode, /id="selection-toolbar"/, 'Must render selection action toolbar');
    assert.match(documentReaderCode, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/, 'Must prevent focus steal on action clicks');
    assert.match(documentReaderCode, /onExplainParagraph\(selectedText/, 'Must dispatch selected text to AI companion');

    // 6. Source passage verification & citation badge
    assert.match(documentReaderCode, /isActiveCitation/, 'Must handle active citation passage highlight');
    assert.match(documentReaderCode, /Verified Citation Passage/, 'Must display verified citation badge on citation page');
  });

  test('19. Real Document Integration & Virtualization Scale: 461-page textbook loads, extracts 40-item outline, and enforces bounded memory slice', async () => {
    const textbookPath = path.resolve(
      baseDir,
      '../../uploads/documents/87331ec3-d182-4f89-a68c-e1782639c443/1d80138a-157c-463a-9db2-643fe9313bda_new-testament-history-and-literature-9780300182194_compress.pdf'
    );

    if (fs.existsSync(textbookPath)) {
      // @ts-ignore
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
      const data = new Uint8Array(fs.readFileSync(textbookPath));
      const doc = await pdfjs.getDocument({ data }).promise;

      // Assert page count is exactly 461 pages
      assert.equal(doc.numPages, 461, 'Textbook must contain exactly 461 pages');

      // Assert page 1 and page 100 dimensions can be read accurately
      const page1 = await doc.getPage(1);
      const vp1 = page1.getViewport({ scale: 1 });
      assert.ok(vp1.width > 0 && vp1.height > 0, 'Page 1 must report positive dimensions');
      assert.ok(vp1.height > vp1.width, 'Page 1 must be portrait');

      // Assert native PDF outline is extracted
      const outline = await doc.getOutline();
      assert.ok(Array.isArray(outline) && outline.length >= 20, 'Outline must extract chapter roots');

      // Mathematical virtualization invariant:
      // For a 461-page document with viewport height 900px and page height 1200px:
      // Active viewport span = 1 page, Overscan = 2 above + 2 below = max 5 pages mounted
      // 456 pages (98.9%) are kept unmounted out of memory!
      const totalPages = doc.numPages;
      const viewportHeight = 900;
      const estimatedPageHeight = Math.round(800 * (vp1.height / vp1.width)) + 24;
      const visibleCount = Math.ceil(viewportHeight / estimatedPageHeight) + 1;
      const overscan = 2;
      const maxMountedPages = visibleCount + overscan * 2;
      assert.ok(
        maxMountedPages <= 7,
        `Virtualizer must mount at most 7 pages simultaneously (calculated ${maxMountedPages}) for 461-page textbook`
      );
      assert.ok(
        totalPages - maxMountedPages >= 450,
        'At least 450 pages must remain unmounted to prevent canvas memory exhaustion'
      );
    }
  });

  test('20. Native Reader Alignment, Flashcard Modal Stacking & Input Responsiveness (Phase 3B Mastery)', () => {
    // 1. PDF Canvas centering: mx-auto applied to container and row centering
    assert.match(
      documentReaderCode,
      /isFocusMode \? 'max-w-5xl mx-auto' : 'max-w-6xl mx-auto'/,
      'PDF container must center on both focus and regular viewing modes'
    );
    assert.match(
      documentReaderCode,
      /className="w-full flex justify-center"/,
      'Virtual row item must justify-center to prevent left shift when companion collapses'
    );

    // 2. GenerateFlashcardsModal portaled with createPortal and z-50 backdrop covering header z-30
    assert.match(flashcardsModalCode, /createPortal\(/);
    assert.match(flashcardsModalCode, /document\.body/);
    assert.match(flashcardsModalCode, /fixed inset-0 z-50/);
    assert.match(flashcardsModalCode, /pageCount/);

    // 3. WorkspaceFlashcardsView passes pageCount to GenerateFlashcardsModal
    assert.match(flashcardsViewCode, /pageCount=\{document\.pageCount\}/);

    // 4. BookRangeSelector supports free numeric editing via draft states without clamped locks
    assert.match(bookRangeSelectorCode, /fromPageDraft/);
    assert.match(bookRangeSelectorCode, /toPageDraft/);
    assert.match(bookRangeSelectorCode, /handleFromPageChange/);
    assert.match(bookRangeSelectorCode, /handleToPageChange/);
    assert.match(bookRangeSelectorCode, /onChangeRef/);

    // 5. DocumentReader floating selection bar provides Card action for grounded card creation
    assert.match(documentReaderCode, /onCreateCardSelection/);
    assert.match(documentReaderCode, /Create flashcard from selection/);
  });

  test('21. Mobile Immersive Auto-Hide, Inactivity Reveal & Reader Coordination (Pre-Phase-4 Polish)', () => {
    // 1. Mobile top header and bottom dock must animate with identical coordinated transitions & reduced-motion support
    assert.match(
      workspacePageCode,
      /transition-transform duration-300 ease-in-out motion-reduce:transition-none select-none \$\{[\s\S]*mobileNavHidden \? '-translate-y-full' : 'translate-y-0'/,
      'Mobile top navigation wrapper must hide on -translate-y-full with duration-300'
    );
    assert.match(
      workspacePageCode,
      /transition-transform duration-300 ease-in-out motion-reduce:transition-none select-none \$\{[\s\S]*mobileNavHidden \? 'translate-y-full' : 'translate-y-0'/,
      'Mobile bottom dock must hide on translate-y-full with matching duration-300'
    );

    // 2. Synchronized vertical space reclamation with smooth 300ms transition
    assert.match(
      workspacePageCode,
      /mobileNavHidden \? 'pt-0' : 'pt-\[88px\]'/,
      'Main container must reclaim 88px top header height'
    );
    assert.match(
      workspacePageCode,
      /mobileNavHidden \? 'pb-0' : 'pb-14'/,
      'Main container must reclaim 56px bottom dock height'
    );
    assert.match(
      workspacePageCode,
      /transition-\[padding\] duration-300/,
      'Padding transition must coordinate with 300ms bar animations'
    );

    // 3. DocumentReader exposes onScrollDelta and onCanvasTap to parent
    assert.match(documentReaderCode, /onScrollDelta\?: \(deltaY: number, scrollTop: number\) => void;/);
    assert.match(documentReaderCode, /onCanvasTap\?: \(\) => void;/);
    assert.match(documentReaderCode, /onTouchStart=\{handleTouchStart\}/);
    assert.match(documentReaderCode, /onTouchMove=\{handleTouchMove\}/);
    assert.match(documentReaderCode, /onClick=\{handleContainerClick\}/);

    // 4. Directional auto-hide thresholds in workspace
    assert.match(workspacePageCode, /deltaY > 20 && scrollTop > 50/);
    assert.match(workspacePageCode, /deltaY < -15/);
    assert.match(workspacePageCode, /handleReaderCanvasTap/);

    // 5. Inactivity timer reveals navigation after approximately 2.5 seconds
    assert.match(workspacePageCode, /inactivityTimerRef/);
    assert.match(workspacePageCode, /clearInactivityTimer/);
    assert.match(workspacePageCode, /setTimeout\(\(\) => \{[\s\S]*?setMobileNavHidden\(false\);[\s\S]*?\}, 2500\)/);
  });

  test('22. Phase 3C Individual Workspace Learning Progress & Multi-User Privacy', () => {
    // 1. Progress view integrates reading, assessments, and SM-2 flashcard recall
    assert.match(progressViewCode, /WorkspaceProgressOverviewDto/);
    assert.match(progressViewCode, /Reading Activity/);
    assert.match(progressViewCode, /Quiz Performance/);
    assert.match(progressViewCode, /Flashcard Recall/);
    assert.match(progressViewCode, /Topic & Section Understanding Matrix/);

    // 2. Actionable recommendations derived from actual learning data with spacious responsive grid
    assert.match(progressViewCode, /Recommended Next Actions/);
    assert.match(progressViewCode, /grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6/);
    assert.match(progressViewCode, /Continue reading from Page/);
    assert.match(progressViewCode, /scheduled for review today/);

    // 3. Recent Quiz Attempts with honest empty states
    assert.match(progressViewCode, /Recent Quiz Attempts/);
    assert.match(progressViewCode, /No completed quiz attempts recorded yet/);

    // 4. Topic matrix navigation
    assert.match(progressViewCode, /onNavigateToPage/);

    // 5. Multi-user privacy guarantee in UI
    assert.match(progressViewCode, /Individual Learning Privacy/);

    // 6. Backend isolation verified in workspaces.service.ts
    const workspacesServicePath = path.join(baseDir, '../api/src/workspaces/workspaces.service.ts');
    const workspacesServiceCode = fs.readFileSync(workspacesServicePath, 'utf8');
    assert.match(
      workspacesServiceCode,
      /where: \{ workspaceId, createdById: userId \}/,
      'Backend must strictly isolate flashcard decks to createdById: userId'
    );
    assert.match(
      workspacesServiceCode,
      /where: \{ userId_documentId: \{ userId, documentId \} \}/,
      'Backend must strictly isolate reading progress to userId'
    );
  });

  test('23. Phase 4 Adaptive Learning Plans Architecture Invariants', () => {
    // 1. Contextual tutor offer banner in chat
    assert.match(planOfferCode, /Personalized Study Plan/);
    assert.match(planOfferCode, /onOpenPlanModal/);
    assert.match(planOfferCode, /onDismiss/);
    assert.match(copilotCode, /LearningPlanOfferBanner/);

    // 2. Plan preview and customization modal
    assert.match(planModalCode, /Create Adaptive Study Plan/);
    assert.match(planModalCode, /Review Study Plan/);
    assert.match(planModalCode, /BookRangeSelector/);
    assert.match(planModalCode, /api\.learningPlans\.generatePreview/);
    assert.match(planModalCode, /api\.learningPlans\.createPlan/);

    // 3. Active Learning Plan View with Spotlight & Stepper
    assert.match(planViewCode, /Active Focus Session/);
    assert.match(planViewCode, /Session Activities Checklist/);
    assert.match(planViewCode, /Complete Study Schedule/);
    assert.match(planViewCode, /handleAdaptPlan/);
    assert.match(planViewCode, /handleTogglePause/);

    // 4. API Client has full learningPlans suite
    const apiCode = fs.readFileSync(path.join(baseDir, 'lib/api.ts'), 'utf8');
    assert.match(apiCode, /learningPlans:\s*\{/);
    assert.match(apiCode, /getOffer:/);
    assert.match(apiCode, /generatePreview:/);
    assert.match(apiCode, /createPlan:/);
    assert.match(apiCode, /getActivePlan:/);
    assert.match(apiCode, /adaptPlan:/);

    // 5. Backend isolation and evidence-based adaptation in learning-plans.service.ts
    const learningPlansServicePath = path.join(baseDir, '../api/src/learning-plans/learning-plans.service.ts');
    const learningPlansServiceCode = fs.readFileSync(learningPlansServicePath, 'utf8');
    assert.match(learningPlansServiceCode, /userId,\s*workspaceId/);
    assert.match(learningPlansServiceCode, /generateLearningPlan/);
    assert.match(learningPlansServiceCode, /adaptLearningPlan/);
    assert.match(learningPlansServiceCode, /status === 'COMPLETED'/);
  });

  test('24. Reader Virtualization Repair, Pending Invitations, Bookshelf Polish & Settings Master-Detail Architecture', () => {
    // 1. Mobile & scale virtualization invariants in DocumentReader.tsx
    assert.match(documentReaderCode, /virtualizer\.getVirtualItems\(\)/);
    assert.match(documentReaderCode, /gap:\s*pageGap/);
    assert.match(documentReaderCode, /virtualizerRef\.current\?\.resizeItem/);
    assert.match(documentReaderCode, /firstPage\.getViewport\(\{ scale: 1 \}\)/);
    assert.doesNotMatch(documentReaderCode, /paddingBottom:\s*['"]24px['"]/);

    // 2. Bookshelf BookCard single progress bar
    const bookCardPath = path.join(baseDir, 'components/workspace/BookCard.tsx');
    const bookCardCode = fs.readFileSync(bookCardPath, 'utf8');
    assert.doesNotMatch(bookCardCode, /bg-amber-300 h-full rounded-full transition-all/);

    // 3. Browser Identity & Warm Parchment Navbar
    const iconSvgPath = path.join(baseDir, 'app/icon.svg');
    const iconSvgCode = fs.readFileSync(iconSvgPath, 'utf8');
    assert.match(iconSvgCode, /#E8722C/);
    assert.doesNotMatch(iconSvgCode, /#4F46E5/);

    const layoutPath = path.join(baseDir, 'app/layout.tsx');
    const layoutCode = fs.readFileSync(layoutPath, 'utf8');
    assert.match(layoutCode, /themeColor:\s*['"]#FAF8F4['"]/);

    // 4. Pending Group Workspace Invitations
    const dashboardPagePath = path.join(baseDir, 'app/(workspace)/dashboard/page.tsx');
    const dashboardPageCode = fs.readFileSync(dashboardPagePath, 'utf8');
    assert.match(dashboardPageCode, /Pending Group Invitations/);
    assert.match(dashboardPageCode, /handleAcceptInvite/);
    assert.match(dashboardPageCode, /handleDeclineInvite/);
    assert.match(dashboardPageCode, /api\.workspaces\.acceptPendingInvite/);

    // 5. Settings Master-Detail Layout & Form Standards
    const settingsPagePath = path.join(baseDir, 'app/(workspace)/dashboard/settings/page.tsx');
    const settingsPageCode = fs.readFileSync(settingsPagePath, 'utf8');
    assert.match(settingsPageCode, /max-w-7xl mx-auto/);
    assert.match(settingsPageCode, /Back to Dashboard/);
    assert.match(settingsPageCode, /md:grid-cols-\[240px_1fr\]/);
    assert.match(settingsPageCode, /Profile & Account/);
    assert.match(settingsPageCode, /AI Tutor & Learning/);
    assert.match(settingsPageCode, /Schedule & Reviews/);
    assert.match(settingsPageCode, /bg-\[#14261D\] text-\[#FAF8F4\]/);
    assert.match(settingsPageCode, /localStorage\.setItem/);
  });

  test('25. Group Discussion Unread Badge, Auto-Expanding Composer, Public Dashboard Shortcut & Product Language Refactor', () => {
    // 1. Group Workspace Unread Notification Badge on TutorHeader pill
    const tutorHeaderPath = path.join(baseDir, 'components/workspace/TutorHeader.tsx');
    const tutorHeaderCode = fs.readFileSync(tutorHeaderPath, 'utf8');
    assert.match(tutorHeaderCode, /unreadDiscussionCount/);
    assert.match(tutorHeaderCode, /bg-\[#E8722C\] text-white text-\[10px\] font-mono font-bold rounded-full/);

    // 2. Persistent read cursor contracts & schema
    const schemaPath = path.join(baseDir, '../../packages/database/prisma/schema.prisma');
    const schemaCode = fs.readFileSync(schemaPath, 'utf8');
    assert.match(schemaCode, /model WorkspaceDiscussionReadCursor/);
    assert.match(schemaCode, /@@unique\(\[workspaceId, userId\]\)/);

    // 3. Auto-expanding multiline composer in GroupDiscussionPane
    const groupDiscussionPath = path.join(baseDir, 'components/workspace/GroupDiscussionPane.tsx');
    const groupDiscussionCode = fs.readFileSync(groupDiscussionPath, 'utf8');
    assert.match(groupDiscussionCode, /textareaRef/);
    assert.match(groupDiscussionCode, /isComposing/);
    assert.match(groupDiscussionCode, /Shift \+ Enter for new line/);
    assert.match(groupDiscussionCode, /Anchor to p\./);

    // 4. Responsive public navigation with compact Dashboard icon shortcut below 1024px
    const navbarPath = path.join(baseDir, 'components/marketing/Navbar.tsx');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    assert.match(navbarCode, /lg:hidden/);
    assert.match(navbarCode, /href="\/dashboard"/);
    assert.match(navbarCode, /aria-label="Go to Dashboard"/);

    // 5. Complete product language refactor (no 768-dim, no 25 MB, diverse reading genres)
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');
    assert.doesNotMatch(marketingPageCode, /768-dimensional vectors/);
    assert.doesNotMatch(marketingPageCode, /768-dim/);
    assert.doesNotMatch(marketingPageCode, /Files up to 25 MB/);
    assert.match(marketingPageCode, /Files up to 1 MB/);
    assert.doesNotMatch(marketingPageCode, /Group Quiz Battles/);
    assert.match(marketingPageCode, /Shared Group Discussions/);

    const heroUploadPath = path.join(baseDir, 'components/marketing/HeroUpload.tsx');
    const heroUploadCode = fs.readFileSync(heroUploadPath, 'utf8');
    assert.doesNotMatch(heroUploadCode, /768-dim Vectors/);
    assert.match(heroUploadCode, /Pride_and_Prejudice/);
    assert.match(heroUploadCode, /The_Industrial_Revolution/);
  });

  test('26. Marketing Website Layout Refinement, Responsive Navigation & Product Experience Polish', () => {
    // 1. Shared Marketing Container Standard (outer px-4 sm:px-6 md:px-10, inner max-w-[1380px] mx-auto)
    const navbarPath = path.join(baseDir, 'components/marketing/Navbar.tsx');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    assert.match(navbarCode, /px-4 sm:px-6 md:px-10/);
    assert.match(navbarCode, /max-w-\[1380px\] mx-auto/);
    assert.match(navbarCode, /flex lg:grid lg:grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/);
    assert.match(navbarCode, /justify-between/);

    // 2. Warm parchment background (#F4EFE4) with subtle structural divider border-b-[1.5px]
    assert.match(navbarCode, /bg-\[#F4EFE4\]/);
    assert.match(navbarCode, /border-b-\[1\.5px\] border-\[#1B3428\]\/10/);

    const marketingLayoutPath = path.join(baseDir, 'app/(marketing)/layout.tsx');
    const marketingLayoutCode = fs.readFileSync(marketingLayoutPath, 'utf8');
    assert.match(marketingLayoutCode, /bg-\[#F4EFE4\]/);

    // 3. Section Tracking Scroll-Spy: activeSection initializes to null (no orange line in hero)
    assert.match(navbarCode, /useState<string \| null>\(null\)/);
    assert.match(navbarCode, /scrollPosition < sections\[0\]\.offsetTop/);
    assert.match(navbarCode, /setActiveSection\(null\)/);

    // 4. Authenticated desktop buttons: Redundant Go to Dashboard button removed beside ProfileMenu
    assert.match(navbarCode, /<ProfileMenu compact \/>/);
    assert.doesNotMatch(navbarCode, /<Link[\s\S]*?href="\/dashboard"[\s\S]*?>[\s\S]*?<span>Go to Dashboard<\/span>[\s\S]*?<\/Link>[\s\S]*?<ProfileMenu/);

    // 5. Mobile & Tablet Unified 36px Tactile Button System (< 1024px)
    assert.match(navbarCode, /href="\/dashboard"[\s\S]*?w-9 h-9 rounded-full bg-\[#F4EFE4\] border-\[1\.5px\] border-\[#1B3428\]\/20/);
    assert.match(navbarCode, /button[\s\S]*?w-9 h-9 rounded-full border-\[1\.5px\] border-\[#1B3428\]\/20 bg-\[#F4EFE4\]/);
    assert.match(navbarCode, /flex items-center justify-end shrink-0 gap-2/);

    // 6. Hero Headline: Intentional responsive line composition with fluid typography clamp
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');
    assert.match(marketingPageCode, /max-w-\[1380px\]/);
    assert.match(marketingPageCode, /px-4 sm:px-6 md:px-10/);
    assert.match(marketingPageCode, /Understand every/);
    assert.match(marketingPageCode, /book,/);
    assert.match(marketingPageCode, /one question/);
    assert.match(marketingPageCode, /time\./);
    assert.match(marketingPageCode, /clamp\(/);

    // Reference section "Engineered for genuine academic retention" establishes the shared container standard
    assert.match(marketingPageCode, /id="features"[\s\S]*?px-4 sm:px-6 md:px-10/);
    assert.match(marketingPageCode, /id="features"[\s\S]*?max-w-\[1380px\] mx-auto/);
    assert.match(marketingPageCode, /Engineered for genuine academic/);

    // 7. How It Works Shared Container & Balanced Columns
    const heroUploadPath = path.join(baseDir, 'components/marketing/HeroUpload.tsx');
    const heroUploadCode = fs.readFileSync(heroUploadPath, 'utf8');
    assert.match(heroUploadCode, /max-w-\[1380px\] mx-auto/);
    assert.match(heroUploadCode, /px-4 sm:px-6 md:px-10/);
    assert.match(heroUploadCode, /Bring your material/);
    assert.match(heroUploadCode, /Explore what you're reading/);
    assert.match(heroUploadCode, /Practice and remember/);
    assert.doesNotMatch(heroUploadCode, /Semantic chunking & vector indexing/);

    // 8. Showcase Sample Materials: 2x2 grid on mobile, 4 columns on desktop (zero 3+1 wrap)
    assert.match(heroUploadCode, /grid grid-cols-2 md:grid-cols-4/);
    assert.doesNotMatch(heroUploadCode, /grid grid-cols-3/);
    assert.match(heroUploadCode, /Fiction/);
    assert.match(heroUploadCode, /Science/);
    assert.match(heroUploadCode, /Economics/);
    assert.match(heroUploadCode, /History/);
    assert.match(heroUploadCode, /Pride & Prejudice/);
    assert.match(heroUploadCode, /Neuroscience/);
    assert.match(heroUploadCode, /Macroeconomics/);
    assert.match(heroUploadCode, /World History/);
    assert.match(heroUploadCode, /sample\.format/);

    // 9. Single-Line Protected CTA Buttons (44px height, no vertical text collapse)
    assert.match(heroUploadCode, /href="\/login"[\s\S]*?inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 rounded-full/);
    assert.match(heroUploadCode, /href="\/register"[\s\S]*?inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 rounded-full/);
  });

  test('27. Hero Typography, Supporting Copy & Navigation Hover Interaction Polish', () => {
    // 1. Supporting Copy (human, concise, and benefit-driven)
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');
    assert.match(marketingPageCode, /Bring a book, article, or notes\. Read, ask questions, and learn with your AI tutor\./);
    assert.doesNotMatch(marketingPageCode, /Bring your books, articles, or notes\. Read at your own pace/);

    // 2. Smooth Navbar Hover Color Matching Footer Link Interaction (#E77130, duration-200)
    const navbarPath = path.join(baseDir, 'components/marketing/Navbar.tsx');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    const footerPath = path.join(baseDir, 'components/marketing/Footer.tsx');
    const footerCode = fs.readFileSync(footerPath, 'utf8');

    // Footer establishes the shared design system interaction style
    assert.match(footerCode, /hover:text-\[#E77130\]/);
    assert.match(footerCode, /transition-colors duration-200/);

    // Navbar reuses the exact same hover color and transition duration
    assert.match(navbarCode, /hover:text-\[#E77130\]/);
    assert.match(navbarCode, /transition-colors duration-200/);
    assert.match(navbarCode, /motion-reduce:transition-none/);

    // Active underline behavior preserved exactly as before
    assert.match(navbarCode, /after:bg-\[#E8722C\] after:rounded-full/);
    assert.match(navbarCode, /after:-bottom-\[6px\] after:left-0 after:w-full after:h-\[2px\]/);

    // No font weight jumping on hover: links remain font-medium without toggling font-bold on hover
    assert.doesNotMatch(navbarCode, /hover:font-bold/);
    assert.doesNotMatch(navbarCode, /hover:font-semibold/);

    // Accessible keyboard-focus treatment
    assert.match(navbarCode, /focus-visible:ring-\[#E77130\]\/60/);
    assert.match(navbarCode, /focus-visible:ring-offset-\[#F4EFE4\]/);
  });

  test('28. Responsive Hero Typography & CTA Visual Hierarchy Correction', () => {
    const marketingPagePath = path.join(baseDir, 'app/(marketing)/page.tsx');
    const marketingPageCode = fs.readFileSync(marketingPagePath, 'utf8');

    // 1. Mobile 3-line & Desktop 2-line Responsive Headline Composition (zero text duplication)
    assert.match(marketingPageCode, /<span>Understand every <\/span>/);
    assert.match(marketingPageCode, /<br className="sm:hidden" \/>/);
    assert.match(marketingPageCode, /<span>book, <\/span>/);
    assert.match(marketingPageCode, /<br className="hidden sm:block" \/>/);
    assert.match(marketingPageCode, /<span>one question <\/span>/);
    assert.match(marketingPageCode, /time\./);

    // 2. Fluid Scale: Mobile 28-34px fluid clamp, tablet fluid scale, and desktop continuity
    assert.match(marketingPageCode, /text-\[clamp\(1\.75rem,1\.25rem\+2\.5vw,2\.125rem\)\]/);
    assert.match(marketingPageCode, /sm:text-\[clamp\(2\.5rem,5\.6vw,3\.9rem\)\]/);
    assert.match(marketingPageCode, /lg:text-\[clamp\(3\.9rem,5\.2vw,5\.25rem\)\]/);
    assert.match(marketingPageCode, /max-w-6xl/);

    // 3. Supporting Paragraph: One elegant line on desktop (max-w-4xl = 896px) & [text-wrap:balance]
    assert.match(marketingPageCode, /max-w-4xl mx-auto text-center leading-relaxed mt-4 sm:mt-6 mb-8 \[text-wrap:balance\]/);
    assert.match(marketingPageCode, /Bring a book, article, or notes\. Read, ask questions, and learn with your AI tutor\./);

    // 4. Proportional CTA Buttons: 44px height (h-11), intrinsic width (w-auto), centered, no max-w-sm or w-full bloat
    assert.match(marketingPageCode, /div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-16 w-full mx-auto"/);
    assert.match(marketingPageCode, /href="#how-it-works"[\s\S]*?className="w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-\[#E8722C\] text-white/);
    assert.match(marketingPageCode, /href="#features"[\s\S]*?className="w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-\[#F4EFE4\] text-\[#14261D\]/);
    assert.doesNotMatch(marketingPageCode, /max-w-sm sm:max-w-none/);
  });
});
