# Lernivox — Visual Reference & Design System

## 1. Primary Design Reference
- Since most things are implemented use other pages that are already implemented as reference 
- **Design Philosophy**: Warm academic elegance, high readability, subtle contrasting borders, rounded card elevations, and human-centered educational aesthetics.

---

## 2. Verified Design Tokens

### Color Palette

| Token Name | Hex Code | Role in BrightPath | Adapted Role in Lernivox |
|---|---|---|---|
| **Warm Cream** | `#f4f0e5` | Primary Canvas Background | Global app canvas background (light warm theme) |
| **Card Off-White** | `#faf7f3` | Card & Container Fill | Elevated cards, document preview containers |
| **Deep Forest Green** | `#14261d` | Dark Text & Primary CTA Fill | High-contrast headings, primary buttons, brand accents |
| **Mid Forest Green** | `#1b3428` | Hover States on Forest CTAs | Interactive hover/active states |
| **Muted Sage** | `#45564b` | Secondary & Supporting Text | Explanatory text, metadata labels, footnotes |
| **Vibrant Terracotta** | `#e8722c` | Hero Highlight & Accent Fill | Primary action buttons, upload entry CTA, badges |
| **Soft Peach** | `#f9d8c0` | Accent Badge Background | Subtitle pill badges, active tab highlights |
| **Warm Stone** | `#eae4d3` | Border & Divider Lines | Subtle card borders, navigation dividers |

### Typography

| Family | Role | Web Source |
|---|---|---|
| **Bricolage Grotesque** | Display Headings, Hero titles, Big Numbers | Google Fonts (`font-display`) |
| **Instrument Sans** / **Inter** | Body copy, UI controls, navigation labels | Google Fonts (`font-sans`) |
| **Geist** | Accents, code snippets, citation indices | Google Fonts (`font-mono`) |

---

## 3. Layout & Visual Principles

1. **Warm Canvas vs. Elevated Card Containers**:
   - The root background is an organic warm cream (`#f4f0e5`) rather than harsh sterile white (`#ffffff`).
   - Cards use a subtle off-white fill (`#faf7f3`) framed by hairline warm stone borders (`#eae4d3`) with generous rounded corners (`1rem` - `1.5rem` / `rounded-2xl` - `rounded-3xl`).
2. **Obvious Textbook / Document Upload Entry Point**:
   - The homepage hero directs immediate attention to a prominent dashed upload zone that invites students to drop course materials.
   - The upload CTA uses Vibrant Terracotta (`#e8722c`) for high conversion and obvious visual affordance.
3. **Contrast-Rich Typography**:
   - Large display headlines using `Bricolage Grotesque` with tight line spacing (`leading-tight`).
   - Clear visual hierarchy with deep forest green (`#14261d`) titles and sage (`#45564b`) paragraph copy.
4. **Subtle Micro-Interactions**:
   - Clean transitions on buttons and card hover states (`transition duration-200 ease-in-out`).
   - Rounded pill badges for status indicators (e.g., `READY`, `PROCESSING`, `VERIFIED CITATION`).
