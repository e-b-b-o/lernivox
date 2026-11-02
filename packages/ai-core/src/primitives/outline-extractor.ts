/**
 * Deterministic document outline extraction utilities (Zero AI token spend).
 * Resolves PDF outline hierarchies, DOCX headings, and text section titles.
 */

export interface RawPdfOutlineNode {
  title: string;
  dest?: string | any[] | null;
  items?: RawPdfOutlineNode[];
}

export interface ResolvedOutlineItem {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
  isNative: boolean;
}

/**
 * Resolves a hierarchical PDF.js outline tree into flat indexed outline items.
 * Guaranteed 0 LLM / AI provider calls.
 */
export async function resolvePdfOutlineTree(
  nodes: RawPdfOutlineNode[],
  resolveDestToPage: (dest: string | any[] | null | undefined) => Promise<number | null>,
): Promise<ResolvedOutlineItem[]> {
  const result: ResolvedOutlineItem[] = [];

  async function traverse(nodeList: RawPdfOutlineNode[], level = 1) {
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];
      if (!node || !node.title) continue;

      let page = 1;
      try {
        const resolved = await resolveDestToPage(node.dest);
        if (resolved && resolved > 0) {
          page = resolved;
        }
      } catch {
        page = 1;
      }

      result.push({
        id: `pdf-outline-${result.length}-${encodeURIComponent(node.title.slice(0, 20))}`,
        title: node.title.trim(),
        pageNumber: page,
        level,
        isNative: true,
      });

      if (node.items && node.items.length > 0) {
        await traverse(node.items, level + 1);
      }
    }
  }

  await traverse(nodes, 1);
  return result;
}

/**
 * Deterministically extracts headings from structural DOCX paragraphs.
 */
export function extractDocxHeadings(
  paragraphs: { text: string; style?: string }[],
): ResolvedOutlineItem[] {
  const items: ResolvedOutlineItem[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (!p || !p.text) continue;

    const trimmed = p.text.trim();
    if (!trimmed) continue;

    const style = (p.style || '').toLowerCase();
    const isHeading1 = style.includes('heading 1') || /^chapter\s+\d+/i.test(trimmed);
    const isHeading2 = style.includes('heading 2') || /^\d+\.\d+\s+/i.test(trimmed);

    if (isHeading1 || isHeading2) {
      items.push({
        id: `docx-heading-${items.length}`,
        title: trimmed,
        pageNumber: Math.max(1, Math.floor(i / 15) + 1),
        level: isHeading1 ? 1 : 2,
        isNative: false,
      });
    }
  }

  return items;
}

/**
 * Deterministically extracts candidate chapter headings from plain text chunks.
 */
export function extractTextHeadings(text: string): ResolvedOutlineItem[] {
  const items: ResolvedOutlineItem[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    if (!line || line.length > 100) continue;

    // Detect chapter headings e.g. "Chapter 1: The Basics" or "1. Introduction"
    const match = line.match(/^(?:chapter\s+(\d+)[:\s]|(\d{1,2})\.[\s\t]+)(.+)$/i);
    if (match) {
      items.push({
        id: `text-heading-${items.length}`,
        title: line,
        pageNumber: Math.max(1, Math.floor(i / 35) + 1),
        level: 1,
        isNative: false,
      });
    }
  }

  return items;
}
