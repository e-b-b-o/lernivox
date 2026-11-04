import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Unified Workspace Architecture Invariants', () => {
  const baseDir = path.resolve(import.meta.dirname, '..');
  const tutorHeaderPath = path.join(baseDir, 'components/workspace/TutorHeader.tsx');
  const documentReaderPath = path.join(baseDir, 'components/workspace/DocumentReader.tsx');
  const outlinePanePath = path.join(baseDir, 'components/workspace/DocumentOutlinePane.tsx');
  const workspacePagePath = path.join(
    baseDir,
    'app/(workspace)/dashboard/workspaces/[workspaceId]/page.tsx'
  );
  const globalsCssPath = path.join(baseDir, 'styles/globals.css');

  const tutorHeaderCode = fs.readFileSync(tutorHeaderPath, 'utf8');
  const documentReaderCode = fs.readFileSync(documentReaderPath, 'utf8');
  const outlinePaneCode = fs.readFileSync(outlinePanePath, 'utf8');
  const workspacePageCode = fs.readFileSync(workspacePagePath, 'utf8');
  const globalsCssCode = fs.readFileSync(globalsCssPath, 'utf8');

  test('1. "Read" is completely removed as a study mode from TutorHeader and workspace navigation', () => {
    // WorkspaceViewMode must not include 'read'
    assert.doesNotMatch(
      tutorHeaderCode,
      /export type WorkspaceViewMode =[^;]*'read'/,
      'WorkspaceViewMode must not include read mode'
    );
    // TutorHeader segmented buttons must not contain a Read button
    assert.doesNotMatch(
      tutorHeaderCode,
      /onViewChange\('read'\)/,
      'TutorHeader must not contain an onViewChange("read") button'
    );
    // TutorHeader must contain only Quizzes, Flashcards, My Progress
    assert.match(tutorHeaderCode, /onViewChange\('quizzes'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('flashcards'\)/);
    assert.match(tutorHeaderCode, /onViewChange\('progress'\)/);
  });

  test('2. TutorHeader implements Balanced Three-Zone True-Center Grid', () => {
    // Three-zone grid container
    assert.match(
      tutorHeaderCode,
      /grid grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/,
      'TutorHeader must use a three-zone CSS grid with centered middle track'
    );

    // Zone 1: Brand lockup, outline toggle, document title
    assert.match(tutorHeaderCode, /Lernivox/);
    assert.match(tutorHeaderCode, /onToggleOutline/);

    // Zone 2: Centered navigation + Dedicated AI Tutor action
    assert.match(tutorHeaderCode, /justify-self-center/);
    assert.match(tutorHeaderCode, /onToggleAiTutor/);
    assert.match(tutorHeaderCode, /AI Tutor/);

    // Zone 3: Books navigation to /dashboard + ProfileMenu
    assert.match(tutorHeaderCode, /href="\/dashboard"/);
    assert.match(tutorHeaderCode, /ProfileMenu/);
  });

  test('3. Mobile architecture has single 48px header, 56px bottom dock without Read, and auto-hide', () => {
    // 48px header on mobile
    assert.match(workspacePageCode, /md:hidden h-12/);
    // 56px dock on mobile (h-14)
    assert.match(workspacePageCode, /md:hidden fixed bottom-0 inset-x-0 h-14/);

    // Mobile dock buttons: Outline, Practice, AI Tutor
    assert.match(workspacePageCode, /mobileDrawer === 'toc'/);
    assert.match(workspacePageCode, /mobileDrawer === 'practice'/);
    assert.match(workspacePageCode, /mobileDrawer === 'chat'/);

    // Mobile dock must NOT contain a Read button
    assert.doesNotMatch(
      workspacePageCode,
      /mobileDrawer === 'read'/,
      'Mobile drawer must not have a read state'
    );

    // Auto-hide translate classes
    assert.match(workspacePageCode, /mobileNavHidden \? '-translate-y-full' : 'translate-y-0'/);
    assert.match(workspacePageCode, /mobileNavHidden \? 'translate-y-full' : 'translate-y-0'/);
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
    assert.match(globalsCssCode, /rgba\(232,\s*114,\s*44,\s*0\.25\)/);

    // DocumentReader has Copy and Ask AI contextual buttons with onMouseDown preventDefault
    assert.match(documentReaderCode, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/);
    assert.match(documentReaderCode, /navigator\.clipboard\.writeText/);
    assert.match(documentReaderCode, /Ask AI/);
  });

  test('6. Secondary reader toolbar has centered page jump, 2-state view toggle, and compact bookmark', () => {
    // Continuous vs Embed 2-state toggle
    assert.match(documentReaderCode, /setViewMode\('canvas'\)/);
    assert.match(documentReaderCode, /setViewMode\('embed'\)/);

    // Centered page navigation
    assert.match(documentReaderCode, /absolute left-1\/2 -translate-x-1\/2/);
    assert.match(documentReaderCode, /ChevronLeft/);
    assert.match(documentReaderCode, /ChevronRight/);

    // Compact bookmark toggle
    assert.match(documentReaderCode, /Bookmark/);
    assert.match(documentReaderCode, /onToggleBookmark/);
  });
});
