# Walkthrough: how the page is built and how it moves

One part per top-level section, top to bottom, as measured at 1440 px. Sizes are CSS pixels; colours are as computed. Every file named here is in this folder. How things move and behave (scrolling, page changes, the menu, hovers, clicks), step by step, is in `reference/motion/README.md`.

## 01 · nav

- **Box:** 1440×86 px, starting 0 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 10px, center/center.
- **Type:** Instrument Sans 500 16px/22.4px (family weight size/line-height, most text first).
- **Inside:** 6 paragraphs, 7 links, 1 picture.
- **Look:** `reference/sections/01-nav.jpg` and its anatomy `reference/sections/01-nav.anatomy.jpg`.
- **Markup:** `reference/sections/01-nav.html`.
- **Motion:**
  - script writes `box-shadow` on `div.framer-1r5rn89:nth-of-type(1) > div.framer-1s4y7z3 > div.framer-1edkcy3:nth-of-type(3) > div.framer-wpvdnk-container > a.framer-vmrH1.framer-yZYSQ` 11 times over 9181 ms (on load): from `0px 4px 0px 0px var(--token-1d403a9e-a47a-49fa-b259-3726165583a7,` to `0px 4px 0px 0px var(--token-1d403a9e-a47a-49fa-b259-3726165583a7,`
  - script writes `background-color` on `div.framer-1r5rn89:nth-of-type(1) > div.framer-1s4y7z3 > div.framer-1edkcy3:nth-of-type(3) > div.framer-wpvdnk-container > a.framer-vmrH1.framer-yZYSQ` 5 times over 9181 ms (on load): from `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` to `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))`
  - script writes `will-change` on `div.framer-1r5rn89:nth-of-type(1) > div.framer-1s4y7z3 > div.framer-1edkcy3:nth-of-type(3) > div.framer-wpvdnk-container > a.framer-vmrH1.framer-yZYSQ` 4 times over 580 ms (loops): from `auto` to ``
- **Hover:** `a.framer-text:hover` changes color, background, text-decoration; `a.framer-text[data-framer-page-link-current]:hover` changes color, background, text-decoration; `a.framer-text:hover` changes font, text-transform, border, corner-top-left-shape, corner-top-right-shape, corner-bottom-right-shape, corner-bottom-left-shape, padding; `a.framer-text:hover` changes color, text-decoration, text-underline-offset, background; `a.framer-text:hover` changes color, background, text-decoration; `a.framer-text[data-framer-page-link-current]:hover` changes color, font, text-transform, border, corner-top-left-shape, corner-top-right-shape, corner-bottom-right-shape, corner-bottom-left-shape; `a.framer-text[data-framer-page-link-current]:hover` changes color, text-decoration, text-underline-offset, background; `a.framer-text[data-framer-page-link-current]:hover` changes color, background, text-decoration.
- **Control states:** `reference/components/01-nav-link.jpg` (nav-link a.framer-text.framer-styles-preset-eke6e: rest, hover, focus).
- **Control states:** `reference/components/02-nav-link.jpg` (nav-link a.framer-text.framer-styles-preset-eke6e: rest, hover, focus).
- **Control states:** `reference/components/03-button.jpg` (button a.framer-vmrH1.framer-yZYSQ: rest, hover, focus).

## 02 · hero

- **Box:** 1440×1200 px, starting 0 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 10px, flex-start/center.
- **Type:** Bricolage Grotesque 500 22px/normal · Instrument Sans 400 16px/22.4px · Instrument Sans 500 16px/22.4px · Bricolage Grotesque 700 103px/103px (family weight size/line-height, most text first).
- **Inside:** 5 headings, 3 paragraphs, 2 links, 7 pictures, 1 drawing.
- **Look:** `reference/sections/02-hero.jpg` and its anatomy `reference/sections/02-hero.anatomy.jpg`.
- **Markup:** `reference/sections/02-hero.html`.
- **Drawings:** `reference/assets/svg/001-illustration-hero.svg` (illustration, 1617×411).
- **Motion:**
  - script `element.animate` on `section.framer-horakz:nth-of-type(1) > div.framer-ys2jnx:nth-of-type(1) > div.framer-13m72pr > div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1)`: 10000 ms linear, 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `section.framer-horakz:nth-of-type(1) > div.framer-ys2jnx:nth-of-type(1) > div.framer-13m72pr > div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1)`: 400 ms cubic-bezier(0.44, 0, 0.56, 1), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `section.framer-horakz:nth-of-type(1) > div.framer-ys2jnx:nth-of-type(1) > div.framer-13m72pr > div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1)`: 400 ms cubic-bezier(0.44, 0, 0.56, 1), 2 keyframes (transform, computedOffset)
  - script `element.animate` on `section.framer-horakz:nth-of-type(1) > div.framer-ys2jnx:nth-of-type(1) > div.framer-13m72pr > div.framer-1pwx3yz > div.framer-1ff9vru:nth-of-type(2)`: 400 ms cubic-bezier(0.44, 0, 0.56, 1), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `section.framer-horakz:nth-of-type(1) > div.framer-ys2jnx:nth-of-type(1) > div.framer-13m72pr > div.framer-1pwx3yz > div.framer-1ff9vru:nth-of-type(2)`: 400 ms cubic-bezier(0.44, 0, 0.56, 1), 2 keyframes (transform, computedOffset)
  - choreography: 6 elements (div) animate `transform` starting 8823–8823 ms after load together, each for about 2912 ms, and keep looping
  - script writes `startOffset` on `div.ssr-variant.hidden-bcge12 > div > svg > text:nth-of-type(2) > textpath` 85 times over 9230 ms (on load): from `0` to `2504.14`
  - script writes `transform` on `div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1) > div.framer-1dksp2g:nth-of-type(2) > div.framer-3me2fc:nth-of-type(5) > div.framer-1jpu99j:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`
  - script writes `transform` on `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-16f0o6z:nth-of-type(1) > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-qdx3pg` 16 times over 2912 ms (loops): from `none` to `rotate(-4deg)`
  - script writes `transform` on `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-5ivlul:nth-of-type(2) > div.ssr-variant > div.framer-ml63o3` 16 times over 2912 ms (loops): from `none` to `rotate(-4deg)`
  - script writes `transform` on `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-1ez819k:nth-of-type(3) > div.ssr-variant.hidden-bcge12 > div.framer-10tciei` 16 times over 2912 ms (loops): from `none` to `rotate(-4deg)`
  - script writes `transform` on `main.framer-1pwritj > section.framer-horakz:nth-of-type(1) > div.framer-1z04r43:nth-of-type(2) > div.framer-1hw68xg:nth-of-type(2) > div.framer-t7n6sr-container` 16 times over 2912 ms (loops): from `none` to `rotate(-4deg)`
  - and 3 more recorded tracks (motion.json `recorded`)
- **Film:** `reference/motion/films/02-scripted-hero.jpg` (Looping div: 12 moving parts (transform, startOffset); it is `div.framer-Kxk9R.framer-1at5jdz:nth-of-type(1) > div.framer-tGarp.framer-Qa4tV:nth-of-type(2) > main.framer-1pwritj > section.framer-horakz:nth-of-type(1) > div.framer-1z04r43:nth-of-type(2)` in the markup; frames captioned with ms).
- **Control states:** `reference/components/04-button.jpg` (button a.framer-vmrH1.framer-yZYSQ: rest, hover, focus).

## 03 · program

- **Box:** 1440×869 px, starting 1200 px from the top. Background rgb(234, 228, 211), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 30px, center/center.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 30px/36px · Bricolage Grotesque 600 82px/90.2px · Instrument Sans 500 16px/22.4px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 5 paragraphs, 5 links, 10 pictures.
- **Look:** `reference/sections/03-program.jpg` and its anatomy `reference/sections/03-program.anatomy.jpg`.
- **Markup:** `reference/sections/03-program.html`.
- **Motion:**
  - script writes `transform` on `div.framer-i85edc > div.framer-t2zri2:nth-of-type(1) > div.framer-itwba7:nth-of-type(1) > div.framer-1e67fbm:nth-of-type(3) > div.framer-1ndmou2:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`
- **Control states:** `reference/components/05-card.jpg` (card a.framer-nX3Fq.framer-ingnX: rest, hover, focus).
- **Control states:** `reference/components/06-card.jpg` (card a.framer-nX3Fq.framer-ingnX: rest, hover, focus).

## 04 · counter

- **Box:** 1440×1266 px, starting 2069 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** grid, 2 columns (495px 495px), gap 0px.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 46px/55.2px · Bricolage Grotesque 600 62px/62px · Instrument Sans 500 16px/22.4px (family weight size/line-height, most text first).
- **Inside:** 4 headings, 5 paragraphs, 1 link, 1 picture.
- **Look:** `reference/sections/04-counter.jpg` and its anatomy `reference/sections/04-counter.anatomy.jpg`.
- **Markup:** `reference/sections/04-counter.html`.
- **Motion:**
  - script writes `transform` on `div.framer-1tt5inq > div.framer-qp82qt:nth-of-type(2) > div.framer-bps8x7:nth-of-type(2) > div.ssr-variant.hidden-18afziw > div.framer-1rvk88l` 16 times over 2912 ms (loops): from `none` to `rotate(3deg)`

## 05 · step

- **Box:** 1440×926 px, starting 3335 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** grid, 2 columns (640px 640px), gap 100px.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 20px/24px · Bricolage Grotesque 500 30px/36px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 10 headings, 11 paragraphs, 7 pictures.
- **Look:** `reference/sections/05-step.jpg` and its anatomy `reference/sections/05-step.anatomy.jpg`.
- **Markup:** `reference/sections/05-step.html`.
- **Motion:**
  - choreography: 4 elements (div) animate `transform` starting 4978–8823 ms after load, about 3845 ms apart, each for about 6757 ms, and keep looping
  - script writes `transform` on `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` 18 times over 6757 ms (loops): from `translateY(30px) rotate(2deg)` to `rotate(2deg)`
  - script writes `transform` on `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` 18 times over 6757 ms (loops): from `translateY(30px) rotate(-2deg)` to `rotate(-2deg)`
  - script writes `transform` on `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` 18 times over 6757 ms (loops): from `translateY(30px) rotate(2deg)` to `rotate(2deg)`
  - script writes `transform` on `div.framer-nj1or > div.framer-10xczcq:nth-of-type(1) > div.framer-1u7fori:nth-of-type(1) > div.framer-1sq9c4d:nth-of-type(3) > div.framer-1ay52vm:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`
- **Film:** `reference/motion/films/03-scripted-step.jpg` (Looping div: 8 moving parts (transform); it is `main.framer-1pwritj > section.framer-1v54aht:nth-of-type(4) > div.framer-m7x2m1 > div.framer-1288zei > div.framer-1ky5bq3:nth-of-type(1)` in the markup; frames captioned with ms).

## 06 · team

- **Box:** 1440×1027 px, starting 4261 px from the top. Background rgb(201, 224, 242), text rgb(0, 0, 0).
- **Layout:** flex row of 3, gap 0px 12px, center/flex-start.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 20px/24px · Bricolage Grotesque 500 24px/28.8px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 8 paragraphs, 5 links, 7 pictures.
- **Look:** `reference/sections/06-team.jpg` and its anatomy `reference/sections/06-team.anatomy.jpg`.
- **Markup:** `reference/sections/06-team.html`.
- **Motion:**
  - script writes `transform` on `div.framer-a7hccw > div.framer-m6jfy4 > div.framer-4th0yu:nth-of-type(1) > div.framer-7ol6en:nth-of-type(3) > div.framer-cttg6j:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`

## 07 · level

- **Box:** 1440×775 px, starting 5288 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 50px, flex-start/center.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 30px/36px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 6 paragraphs, 4 links, 10 pictures.
- **Look:** `reference/sections/07-level.jpg` and its anatomy `reference/sections/07-level.anatomy.jpg`.
- **Markup:** `reference/sections/07-level.html`.
- **Motion:**
  - script writes `transform` on `div.framer-14qs9fm:nth-of-type(1) > div.framer-1mz23uj:nth-of-type(1) > div.framer-buh3zj:nth-of-type(2) > div.framer-1t7jzm2:nth-of-type(3) > div.framer-tslpdh:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`
  - script writes `background-color` on `div.framer-j9451v-container > div.ssr-variant.hidden-18afziw > a.framer-5ZKE1.framer-ingnX > div.framer-140za1a:nth-of-type(2) > div.framer-11cpwsc` 7 times over 6797 ms (on load): from `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` to `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))`

## 08 · online

- **Box:** 1440×798 px, starting 6063 px from the top. Background rgb(214, 229, 154), text rgb(0, 0, 0).
- **Layout:** grid, 7 columns (128.562px 128.562px 128.562px 128.562px 128.562px 128.562px 128.562px), gap 80px.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 600 82px/90.2px · Instrument Sans 500 16px/22.4px (family weight size/line-height, most text first).
- **Inside:** 4 headings, 7 paragraphs, 1 link, 3 pictures.
- **Look:** `reference/sections/08-online.jpg` and its anatomy `reference/sections/08-online.anatomy.jpg`.
- **Markup:** `reference/sections/08-online.html`.
- **Motion:**
  - script writes `transform` on `div.framer-13x0nho:nth-of-type(1) > div.framer-d2lpr2:nth-of-type(1) > div.framer-sj5y41:nth-of-type(2) > div.framer-1njdg5t:nth-of-type(4) > div.framer-1y8sjv2:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`

## 09 · testimonial

- **Box:** 1440×942 px, starting 6862 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 3, gap 0px 12px, center/flex-start.
- **Type:** Bricolage Grotesque 500 24px/28.8px · Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 20px/24px · Instrument Sans 500 16px/22.4px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 3 headings, 4 paragraphs, 9 pictures.
- **Look:** `reference/sections/09-testimonial.jpg` and its anatomy `reference/sections/09-testimonial.anatomy.jpg`.
- **Markup:** `reference/sections/09-testimonial.html`.
- **Motion:**
  - choreography: 6 elements (div) animate `transform` starting 2999–8823 ms after load, about 3845 ms apart, each for about 8736 ms, and keep looping
  - script writes `transform` on `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` 18 times over 6757 ms (loops): from `translateY(30px) rotate(-6deg)` to `rotate(-6deg)`
  - script writes `transform` on `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` 18 times over 6757 ms (loops): from `translateY(30px) rotate(6deg)` to `rotate(6deg)`
  - script writes `transform` on `div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container > div.framer-kzGSa.framer-xgT8x > div.framer-1n10hea:nth-of-type(1)` 17 times over 8736 ms (loops): from `rotate(-6deg)` to `rotate(-6deg)`
  - script writes `transform` on `div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(2) > div.framer-12mf2sx-container > div.framer-kzGSa.framer-xgT8x > div.framer-1n10hea:nth-of-type(1)` 17 times over 8736 ms (loops): from `rotate(-6deg)` to `rotate(-6deg)`
  - script writes `transform` on `div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container > div.framer-kzGSa.framer-xgT8x > div.framer-1n10hea:nth-of-type(1)` 17 times over 8736 ms (loops): from `rotate(-6deg)` to `rotate(-6deg)`
  - script writes `transform` on `div.framer-1e9xds5 > div.framer-10p5lo:nth-of-type(1) > div.framer-14gtx4r > div.framer-1bsygp9:nth-of-type(3) > div.framer-b10oed:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`
- **Film:** `reference/motion/films/01-scripted-testimonial.jpg` (Looping div: 12 moving parts (transform); it is `div.framer-tGarp.framer-Qa4tV:nth-of-type(2) > main.framer-1pwritj > section.framer-1qz9sya:nth-of-type(8) > div.framer-1fjdtnj > div.framer-1e9xds5` in the markup; frames captioned with ms).

## 10 · price

- **Box:** 1440×971 px, starting 7804 px from the top. Background rgb(234, 228, 211), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 20px, flex-start/center.
- **Type:** Instrument Sans 400 16px/22.4px · Instrument Sans 500 16px/22.4px · Bricolage Grotesque 500 20px/24px · Bricolage Grotesque 700 46px/50.6px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 2 headings, 23 paragraphs, 3 links, 14 pictures.
- **Look:** `reference/sections/10-price.jpg` and its anatomy `reference/sections/10-price.anatomy.jpg`.
- **Markup:** `reference/sections/10-price.html`.
- **Motion:**
  - script writes `box-shadow` on `div.framer-ugkfba-container > div.framer-TNrt0.framer-g0owW > div.framer-3ycjh6:nth-of-type(2) > div.framer-aw3s9p-container > a.framer-3MKD0.framer-yZYSQ` 23 times over 7637 ms (on load): from `0px 4px 0px 0px var(--token-a225ace6-638e-469b-9793` to `0px 4px 0px 0px var(--token-a225ace6-638e-469b-9793`
  - script writes `background-color` on `div.framer-ugkfba-container > div.framer-TNrt0.framer-g0owW > div.framer-3ycjh6:nth-of-type(2) > div.framer-aw3s9p-container > a.framer-3MKD0.framer-yZYSQ` 17 times over 7637 ms (on load): from `var(--token-e079c459-c6e9-4577-8c52-a24b838cfa37, rgb(234, 228, 211))` to `var(--token-e079c459-c6e9-4577-8c52-a24b838cfa37, rgb(234, 228, 211))`
  - script writes `transform` on `div.framer-cdae3m > div.framer-vxgnum:nth-of-type(1) > div.framer-q0hrw2:nth-of-type(1) > div.framer-12s7x3j:nth-of-type(2) > div.framer-61ukli:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`

## 11 · faq

- **Box:** 1440×1045 px, starting 8774 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 4, gap 0px 12px, center/flex-start.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 24px/28.8px · Bricolage Grotesque 600 82px/90.2px (family weight size/line-height, most text first).
- **Inside:** 4 headings, 5 paragraphs, 2 pictures.
- **Look:** `reference/sections/11-faq.jpg` and its anatomy `reference/sections/11-faq.anatomy.jpg`.
- **Markup:** `reference/sections/11-faq.html`.
- **Motion:**
  - choreography: 3 elements (div) animate `transform` starting 2999–8823 ms after load, about 5824 ms apart, each for about 8736 ms, and keep looping
  - script writes `transform` on `div.framer-1voba55-container:nth-of-type(1) > div.framer-2Kaps.framer-xgT8x > div.framer-1frh9mr:nth-of-type(1) > div.framer-6qhlpq:nth-of-type(2) > div.framer-1xwpwo8:nth-of-type(1)` 17 times over 8736 ms (loops): from `rotate(180deg)` to `rotate(180deg)`
  - script writes `transform` on `div.framer-1voba55-container:nth-of-type(1) > div.framer-2Kaps.framer-xgT8x > div.framer-1frh9mr:nth-of-type(1) > div.framer-6qhlpq:nth-of-type(2) > div.framer-bna4yy:nth-of-type(2)` 17 times over 8736 ms (loops): from `rotate(90deg)` to `rotate(90deg)`
  - script writes `transform` on `div.framer-1vrwac6 > div.framer-duiqzy:nth-of-type(1) > div.framer-1bjlxcd > div.framer-1hm2wn4:nth-of-type(4) > div.framer-usmh2b:nth-of-type(1)` 16 times over 2912 ms (loops): from `none` to `rotate(5deg)`

## 12 · div

- **Box:** 1440×835 px, starting 9820 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 2, gap 10px, flex-start/center.
- **Type:** Instrument Sans 400 16px/22.4px · Instrument Sans 500 16px/22.4px · Bricolage Grotesque 600 98px/107.8px (family weight size/line-height, most text first).
- **Inside:** 4 headings, 4 paragraphs, 2 links, 6 pictures.
- **Look:** `reference/sections/12-div.jpg` and its anatomy `reference/sections/12-div.anatomy.jpg`.
- **Markup:** `reference/sections/12-div.html`.
- **Motion:**
  - script writes `transform` on `div.framer-1m4mmul > div.framer-ixplj4:nth-of-type(1) > div.framer-1cfgdco:nth-of-type(2) > div.framer-a9gfjg:nth-of-type(4) > div.framer-n3foqy:nth-of-type(1)` 17 times over 8736 ms (loops): from `rotate(5deg)` to `rotate(5deg)`
  - script writes `transform` on `section.framer-zkyT3.framer-KrJS4 > div.framer-1xa4jnn:nth-of-type(2) > div.framer-513zc8:nth-of-type(1) > div.framer-ig3iao:nth-of-type(2) > div.framer-jbbf79:nth-of-type(2)` 17 times over 8736 ms (loops): from `rotate(-40deg)` to `rotate(-40deg)`

## 13 · footer

- **Box:** 1440×594 px, starting 10655 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 3, gap normal, space-between/flex-start.
- **Type:** Instrument Sans 400 16px/22.4px · Bricolage Grotesque 500 24px/28.8px · Geist 700 12px/14.4px (family weight size/line-height, most text first).
- **Inside:** 2 headings, 14 paragraphs, 1 button, 17 links, 9 pictures, 12 fields.
- **Look:** `reference/sections/13-footer.jpg` and its anatomy `reference/sections/13-footer.anatomy.jpg`.
- **Markup:** `reference/sections/13-footer.html`.
- **Hover:** `a.framer-text:hover` changes color, background, text-decoration; `a.framer-text[data-framer-page-link-current]:hover` changes color, background, text-decoration; `a.framer-text:hover` changes font, text-transform, border, corner-top-left-shape, corner-top-right-shape, corner-bottom-right-shape, corner-bottom-left-shape, padding; `a.framer-text:hover` changes color, text-decoration, text-underline-offset, background; `a.framer-text:hover` changes color, background, text-decoration; `a.framer-text[data-framer-page-link-current]:hover` changes color, font, text-transform, border, corner-top-left-shape, corner-top-right-shape, corner-bottom-right-shape, corner-bottom-left-shape; `a.framer-text[data-framer-page-link-current]:hover` changes color, text-decoration, text-underline-offset, background; `a.framer-text[data-framer-page-link-current]:hover` changes color, background, text-decoration.

## 14 · framer-badge-contai

- **Box:** 1440×78 px, starting 822 px from the top. Background rgb(244, 240, 229), text rgb(0, 0, 0).
- **Layout:** flex row of 3, gap 10px, flex-start/center.
- **Type:** sans-serif 400 12px/normal (family weight size/line-height, most text first).
- **Inside:** 1 paragraph, 1 link.
- **Look:** `reference/sections/14-framer-badge-contai.jpg` and its anatomy `reference/sections/14-framer-badge-contai.anatomy.jpg`.
- **Markup:** `reference/sections/14-framer-badge-contai.html`.
