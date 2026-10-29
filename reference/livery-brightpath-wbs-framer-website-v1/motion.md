# Motion and Interactions

Expressive: some motion runs as long as 400ms.

- Default to 400ms transitions (100% of measured ones).
- Ease with cubic-bezier(0.44, 0, 0.56, 1).
- Animate color, text-decoration-color, text-decoration-thickness, text-underline-offset; avoid animating layout.
- Respect prefers-reduced-motion.

## Interactions

- **Hover** changes text colour (89% of hover rules), background colour (44% of hover rules), underline (44% of hover rules), border (11% of hover rules). Things rarely move on hover; they change colour.

## Measurements

- Durations: 400ms (100%)
- Easings: `cubic-bezier(0.44, 0, 0.56, 1)`
- Animated properties: color, text-decoration-color, text-decoration-thickness, text-underline-offset, background, box-shadow

Always respect `prefers-reduced-motion: reduce`.
