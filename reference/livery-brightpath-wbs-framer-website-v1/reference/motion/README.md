# How it moves, step by step

Every animation and behaviour found on the page, as recipes: what starts it, which element, which property from what to what, for how long, on which curve, in what order. Times are from the moment the trigger happens. Build them one at a time and check each against its film (frames captioned with their time, or with the scroll position).

Measured at 1440 px on brightpath-wbs.framer.website. Values in `code` are exactly as the browser reported them.

## The page's motion language

- **Curves:** `cubic-bezier(0.44, 0, 0.56, 1)` (40×).
- **Durations:** 400 ms.

## Moving scenes (filmed)

### 1. Looping div: 12 moving parts (transform)

- **Film:** `reference/motion/films/01-scripted-testimonial.jpg` (captions are ms).
- **Element:** `div.framer-tGarp.framer-Qa4tV:nth-of-type(2) > main.framer-1pwritj > section.framer-1qz9sya:nth-of-type(8) > div.framer-1fjdtnj > div.framer-1e9xds5` in section `09-testimonial`.

### 2. Looping div: 12 moving parts (transform, startOffset)

- **Film:** `reference/motion/films/02-scripted-hero.jpg` (captions are ms).
- **Element:** `div.framer-Kxk9R.framer-1at5jdz:nth-of-type(1) > div.framer-tGarp.framer-Qa4tV:nth-of-type(2) > main.framer-1pwritj > section.framer-horakz:nth-of-type(1) > div.framer-1z04r43:nth-of-type(2)` in section `02-hero`.

### 3. Looping div: 8 moving parts (transform)

- **Film:** `reference/motion/films/03-scripted-step.jpg` (captions are ms).
- **Element:** `main.framer-1pwritj > section.framer-1v54aht:nth-of-type(4) > div.framer-m7x2m1 > div.framer-1288zei > div.framer-1ky5bq3:nth-of-type(1)` in section `05-step`.

## Going from page to page

### 4. / → /about (the `About` link)

- **How the address changes:** history.pushState, no page load: the script swaps the content itself (a client-side router).
- **Takes:** 1975 ms from the click until the last change.
- **In order:**
  1. 833 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` `rotate(2deg)` → `none`
  1. 833 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` `rotate(-2deg)` → `none`
  1. 833 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` `rotate(2deg)` → `none`
  1. 833 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` `rotate(-6deg)` → `none`
  1. 833 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` `transform` `rotate(6deg)` → `none`
  1. 833 ms: `div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1) > div.framer-1dksp2g:nth-of-type(2) > div.framer-3me2fc:nth-of-type(5) > div.framer-1jpu99j:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 833 ms: `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-16f0o6z:nth-of-type(1) > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-qdx3pg` `transform` `rotate(-4deg)` → `none`
  1. 833 ms: `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-5ivlul:nth-of-type(2) > div.ssr-variant > div.framer-ml63o3` `transform` `rotate(-4deg)` → `none`
  1. 833 ms: `div.framer-1z04r43:nth-of-type(2) > div.framer-1lo7yl2:nth-of-type(1) > div.framer-1ez819k:nth-of-type(3) > div.ssr-variant.hidden-bcge12 > div.framer-10tciei` `transform` `rotate(-4deg)` → `none`
  1. 833 ms: `main.framer-1pwritj > section.framer-horakz:nth-of-type(1) > div.framer-1z04r43:nth-of-type(2) > div.framer-1hw68xg:nth-of-type(2) > div.framer-t7n6sr-container` `transform` `rotate(-4deg)` → `none`
  1. 833 ms: `div.framer-i85edc > div.framer-t2zri2:nth-of-type(1) > div.framer-itwba7:nth-of-type(1) > div.framer-1e67fbm:nth-of-type(3) > div.framer-1ndmou2:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 833 ms: `div.framer-1tt5inq > div.framer-qp82qt:nth-of-type(2) > div.framer-bps8x7:nth-of-type(2) > div.ssr-variant.hidden-18afziw > div.framer-1rvk88l` `transform` `rotate(3deg)` → `none`
  1. 833 ms: `div.framer-nj1or > div.framer-10xczcq:nth-of-type(1) > div.framer-1u7fori:nth-of-type(1) > div.framer-1sq9c4d:nth-of-type(3) > div.framer-1ay52vm:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 833 ms: `div.framer-a7hccw > div.framer-m6jfy4 > div.framer-4th0yu:nth-of-type(1) > div.framer-7ol6en:nth-of-type(3) > div.framer-cttg6j:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
- **Animations that ran:**
  - 22 ms: `div.framer-mtbx3v > div.framer-16vhzhe > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(20, 38, 29) → rgb(232, 114, 44))
  - 22 ms: `div.framer-mtbx3v > div.framer-16vhzhe > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgba(0, 0, 0, 0) → rgb(232, 114, 44))
  - 900 ms: `div.framer-mtbx3v > div.framer-1gmb2ft > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(20, 38, 29))
  - 900 ms: `div.framer-mtbx3v > div.framer-1gmb2ft > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgb(232, 114, 44) → rgba(0, 0, 0, 0))
  - 900 ms: `div.framer-12ettlo > div.framer-1yfe4 > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(244, 240, 229))
  - 900 ms: `div.framer-12ettlo > div.framer-x4b8h > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(244, 240, 229) → rgb(232, 114, 44))
  - 1180 ms: `div.framer-1tj0mv0 > div.framer-1heq79x > div.framer-10w0dc5 > div.framer-18nkot` script animation (element.animate) on `opacity`, 400 ms after 200 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 1180 ms: `section.framer-1imgzda > div.framer-1tj0mv0 > div.framer-1heq79x > div.framer-10w0dc5` script animation (element.animate) on `opacity`, 400 ms after 200 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 1330 ms: `div.framer-1tj0mv0 > div.framer-1heq79x > div.framer-10w0dc5 > div.framer-19aidst` script animation (element.animate) on `opacity`, 400 ms after 350 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 1380 ms: `section.framer-1imgzda > div.framer-1tj0mv0 > div.framer-1heq79x > div.framer-1uab6yr` script animation (element.animate) on `opacity`, 400 ms after 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 1380 ms: `div.framer-mSQ22.framer-Qa4tV > main.framer-492ptd > section.framer-1imgzda > div.framer-ppoljm-container.hidden-d34g1y` script animation (element.animate) on `opacity`, 400 ms after 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
- **Film:** `reference/motion/transitions/01-to-about.jpg` (frames from the click, captioned with ms).

### 5. /about → /program (the `Program` link)

- **How the address changes:** history.pushState, no page load: the script swaps the content itself (a client-side router).
- **Takes:** 1692 ms from the click until the last change.
- **In order:**
  1. 31 ms: `div.framer-ppoljm-container.hidden-d34g1y:nth-of-type(2) > div > svg > text:nth-of-type(2) > textpath` `startOffset` `2525.96` → `2524.91` (4 steps)
  1. 465 ms: `main.framer-492ptd > section.framer-1jx7tdf:nth-of-type(3) > div.framer-23yp > div.framer-1mu7d2f:nth-of-type(2) > div.framer-p0exyh-container:nth-of-type(1)` `transform` `translateY(30px) rotate(-6deg)` → `translateY(30px)`
  1. 465 ms: `main.framer-492ptd > section.framer-1jx7tdf:nth-of-type(3) > div.framer-23yp > div.framer-1mu7d2f:nth-of-type(2) > div.framer-ogfy18-container:nth-of-type(3)` `transform` `translateY(30px) rotate(6deg)` → `translateY(30px)`
  1. 465 ms: `section.framer-1jx7tdf:nth-of-type(3) > div.framer-23yp > div.framer-j1o6sy:nth-of-type(1) > div.framer-48wyyh:nth-of-type(3) > div.framer-13hu69z:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-83t744:nth-of-type(1) > div.framer-1uocsi3:nth-of-type(1) > div.framer-302c1b:nth-of-type(2) > div.framer-gfd225:nth-of-type(4) > div.framer-kkp75x:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-s1l5jc > div.framer-1i4nrva > div.framer-dg7rtb:nth-of-type(1) > div.framer-jyx90g:nth-of-type(3) > div.framer-d3qhkk:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-1a3imkb > div.framer-12o96rm > div.framer-swg57y:nth-of-type(1) > div.framer-19pgfca:nth-of-type(3) > div.framer-1eql6mx:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-10w0dc5:nth-of-type(1) > div.framer-18nkot:nth-of-type(1) > div.framer-rch2s2:nth-of-type(2) > div.framer-1urc8ri:nth-of-type(6) > div.framer-lfyd5:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-v8ybv9 > div.framer-1jp107b:nth-of-type(1) > div.framer-14jffb6:nth-of-type(2) > div.framer-1901v0o:nth-of-type(5) > div.framer-61dcxc:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 465 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-16vhzhe:nth-of-type(2) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to ``
  1. 465 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-r7lwo6:nth-of-type(3) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to `true`
  1. 465 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-12ettlo:nth-of-type(1) > div.framer-x4b8h:nth-of-type(2) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to ``
  1. 465 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-12ettlo:nth-of-type(1) > div.framer-ww2634:nth-of-type(3) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to `true`
  1. 481 ms: `section.framer-17snapa > div.framer-7aiddv > div.framer-umsn1w > div.framer-rd32wh:nth-of-type(1) > div.framer-138rhtp:nth-of-type(1)` `transform` `translateY(30px)` → `none` (4 steps)
- **Animations that ran:**
  - 28 ms: `div.framer-mtbx3v > div.framer-r7lwo6 > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(20, 38, 29) → rgb(232, 114, 44))
  - 28 ms: `div.framer-mtbx3v > div.framer-r7lwo6 > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgba(0, 0, 0, 0) → rgb(232, 114, 44))
  - 507 ms: `div.framer-mtbx3v > div.framer-16vhzhe > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(20, 38, 29))
  - 507 ms: `div.framer-mtbx3v > div.framer-16vhzhe > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgb(232, 114, 44) → rgba(0, 0, 0, 0))
  - 507 ms: `div.framer-12ettlo > div.framer-x4b8h > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(244, 240, 229))
  - 507 ms: `div.framer-12ettlo > div.framer-ww2634 > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(244, 240, 229) → rgb(232, 114, 44))
  - 786 ms: `div.framer-7aiddv > div.framer-umsn1w > div.framer-rd32wh > div.framer-138rhtp` script animation (element.animate) on `opacity`, 400 ms after 200 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 936 ms: `div.framer-7aiddv > div.framer-umsn1w > div.framer-rd32wh > div.framer-1d72dob` script animation (element.animate) on `opacity`, 400 ms after 350 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 4 × 1086 ms: `div.framer-umsn1w > div.framer-m1sme0 > div.framer-1fzw7jo > div.framer-blh4nb` script animation (element.animate) on `opacity`, 400 ms after 500 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1), each starting 100 ms after the one before
- **Film:** `reference/motion/transitions/02-to-program.jpg` (frames from the click, captioned with ms).

### 6. /program → /mentor (the `Mentor` link)

- **How the address changes:** history.pushState, no page load: the script swaps the content itself (a client-side router).
- **Takes:** 1128 ms from the click until the last change.
- **In order:**
  1. 327 ms: `div.framer-rd32wh:nth-of-type(1) > div.framer-138rhtp:nth-of-type(1) > div.framer-3y3hmx:nth-of-type(2) > div.framer-la2tps:nth-of-type(5) > div.framer-15sxjn5:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 327 ms: `div.framer-18d5zt6:nth-of-type(1) > div.framer-1maj4ac:nth-of-type(1) > div.framer-epwxiy:nth-of-type(2) > div.framer-oei5cq:nth-of-type(5) > div.framer-1u0hnko:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 327 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-r7lwo6:nth-of-type(3) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to ``
  1. 327 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-4zh0jl:nth-of-type(4) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to `true`
  1. 327 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-12ettlo:nth-of-type(1) > div.framer-ww2634:nth-of-type(3) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to ``
  1. 327 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-12ettlo:nth-of-type(1) > div.framer-19am20h:nth-of-type(4) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to `true`
  1. 334 ms: `main.framer-auoxfv > section.framer-7rxg2t:nth-of-type(1) > div.framer-n9x8i4 > div.framer-1x3d2x5 > div.framer-xfbb6q:nth-of-type(1)` `transform` `translateY(30px)` → `none` (11 steps)
  1. 334 ms: `section.framer-15965p3:nth-of-type(2) > div.framer-y7tbpv > div.framer-putvph > div.framer-mb8igo > div.framer-u02ja0:nth-of-type(1)` `transform` `translateY(30px)` → `none` (11 steps)
  1. 334 ms: `section.framer-15965p3:nth-of-type(2) > div.framer-y7tbpv > div.framer-putvph > div.framer-mb8igo > div.framer-u02ja0:nth-of-type(2)` `transform` `translateY(30px)` → `none` (12 steps)
  1. 334 ms: `section.framer-15965p3:nth-of-type(2) > div.framer-y7tbpv > div.framer-putvph > div.framer-mb8igo > div.framer-u02ja0:nth-of-type(3)` `transform` set to `translateY(30px)`
  1. 334 ms: `section.framer-15965p3:nth-of-type(2) > div.framer-y7tbpv > div.framer-putvph > div.framer-mb8igo > div.framer-u02ja0:nth-of-type(4)` `transform` set to `translateY(30px)`
  1. 334 ms: `section.framer-15965p3:nth-of-type(2) > div.framer-y7tbpv > div.framer-putvph > div.framer-mb8igo > div.framer-19js942:nth-of-type(5)` `transform` set to `translateY(30px)`
  1. 334 ms: `div.framer-1xpkpt0-container > section.framer-fLY7v.framer-KrJS4 > div.framer-18nf041:nth-of-type(1) > div.framer-xy79ny > div.framer-6u7ipj:nth-of-type(2)` `transform` set to `translateY(30px)`
  1. 334 ms: `section.framer-fLY7v.framer-KrJS4 > div.framer-18nf041:nth-of-type(1) > div.framer-xy79ny > div.framer-19o8lku:nth-of-type(1) > div.framer-vhve7i:nth-of-type(2)` `transform` set to `translateY(30px)`
- **Animations that ran:**
  - 16 ms: `div.framer-mtbx3v > div.framer-4zh0jl > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(20, 38, 29) → rgb(232, 114, 44))
  - 19 ms: `div.framer-mtbx3v > div.framer-4zh0jl > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgba(0, 0, 0, 0) → rgb(232, 114, 44))
  - 348 ms: `div.framer-mtbx3v > div.framer-r7lwo6 > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(20, 38, 29))
  - 348 ms: `div.framer-mtbx3v > div.framer-r7lwo6 > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgb(232, 114, 44) → rgba(0, 0, 0, 0))
  - 348 ms: `div.framer-12ettlo > div.framer-ww2634 > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(244, 240, 229))
  - 348 ms: `div.framer-12ettlo > div.framer-19am20h > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(244, 240, 229) → rgb(232, 114, 44))
  - 601 ms: `section.framer-7rxg2t > div.framer-n9x8i4 > div.framer-1x3d2x5 > div.framer-xfbb6q` script animation (element.animate) on `opacity`, 400 ms after 200 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 751 ms: `section.framer-7rxg2t > div.framer-n9x8i4 > div.framer-1x3d2x5 > div.framer-1pd9qrz` script animation (element.animate) on `opacity`, 400 ms after 350 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
- **Film:** `reference/motion/transitions/03-to-mentor.jpg` (frames from the click, captioned with ms).

### 7. /mentor → /contact (the `Contact` link)

- **How the address changes:** history.pushState, no page load: the script swaps the content itself (a client-side router).
- **Takes:** 1083 ms from the click until the last change.
- **In order:**
  1. 237 ms: `div.framer-1x3d2x5 > div.framer-xfbb6q:nth-of-type(1) > div.framer-bdxvhu:nth-of-type(2) > div.framer-1yiqv2b:nth-of-type(5) > div.framer-bbbbbo:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 237 ms: `div.framer-19o8lku:nth-of-type(1) > div.framer-1qg7ern:nth-of-type(1) > div.framer-1xtf8ag:nth-of-type(2) > div.framer-1b2evln:nth-of-type(4) > div.framer-8uvcru:nth-of-type(1)` `transform` `rotate(5deg)` → `none`
  1. 237 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-4zh0jl:nth-of-type(4) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to ``
  1. 237 ms: `div.framer-1s4y7z3 > div.framer-mtbx3v:nth-of-type(2) > div.framer-hx7r5v:nth-of-type(5) > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` `data-framer-page-link-current` set to `true`
  1. 237 ms: `div.framer-1r5rn89:nth-of-type(1) > div.framer-1s4y7z3 > div.framer-1edkcy3:nth-of-type(3) > div.framer-wpvdnk-container > a.framer-vmrH1.framer-yZYSQ` `data-framer-page-link-current` set to `true`
  1. 237 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-12ettlo:nth-of-type(1) > div.framer-19am20h:nth-of-type(4) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to ``
  1. 237 ms: `div.framer-y5offa:nth-of-type(2) > div.framer-183hcoh:nth-of-type(2) > div.framer-1l9hgmu:nth-of-type(2) > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` `data-framer-page-link-current` set to `true`
  1. 244 ms: `section.framer-1tzev6y:nth-of-type(1) > div.framer-ru1x5z:nth-of-type(1) > div.framer-vbtyo5 > div.framer-30td5f:nth-of-type(1) > div.framer-c07j8:nth-of-type(1)` `transform` `translateY(30px)` → `none` (4 steps)
  1. 244 ms: `section.framer-1tzev6y:nth-of-type(1) > div.framer-ru1x5z:nth-of-type(1) > div.framer-vbtyo5 > div.framer-30td5f:nth-of-type(1) > div.framer-fcc3g7:nth-of-type(2)` `transform` `translateY(30px)` → `none` (9 steps)
  1. 244 ms: `main.framer-1hvnfzr > section.framer-1tzev6y:nth-of-type(1) > div.framer-ru1x5z:nth-of-type(1) > div.framer-vbtyo5 > div.framer-1i262e7:nth-of-type(2)` `transform` `translateY(30px)` → `none` (7 steps)
  1. 244 ms: `main.framer-1hvnfzr > section.framer-11tcqkc:nth-of-type(2) > div.framer-16y9vo9 > div.framer-1djm1xq > div.framer-1eyv443:nth-of-type(1)` `transform` set to `translateY(30px)`
  1. 244 ms: `section.framer-11tcqkc:nth-of-type(2) > div.framer-16y9vo9 > div.framer-1djm1xq > div.framer-2rsa00:nth-of-type(2) > div.framer-btr609-container:nth-of-type(1)` `transform` set to `translateY(30px)`
  1. 244 ms: `section.framer-11tcqkc:nth-of-type(2) > div.framer-16y9vo9 > div.framer-1djm1xq > div.framer-2rsa00:nth-of-type(2) > div.framer-iwe7vr-container:nth-of-type(2)` `transform` set to `translateY(30px)`
  1. 244 ms: `section.framer-11tcqkc:nth-of-type(2) > div.framer-16y9vo9 > div.framer-1djm1xq > div.framer-2rsa00:nth-of-type(2) > div.framer-t20n2p-container:nth-of-type(3)` `transform` set to `translateY(30px)`
- **Animations that ran:**
  - 23 ms: `div.framer-mtbx3v > div.framer-hx7r5v > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(20, 38, 29) → rgb(232, 114, 44))
  - 23 ms: `div.framer-mtbx3v > div.framer-hx7r5v > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgba(0, 0, 0, 0) → rgb(232, 114, 44))
  - 276 ms: `div.framer-mtbx3v > div.framer-4zh0jl > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(20, 38, 29))
  - 276 ms: `div.framer-mtbx3v > div.framer-4zh0jl > p.framer-text.framer-styles-preset-bzg784 > a.framer-text.framer-styles-preset-eke6e` CSS transition on `textDecorationColor`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (textDecorationColor: rgb(232, 114, 44) → rgba(0, 0, 0, 0))
  - 276 ms: `div.framer-12ettlo > div.framer-19am20h > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(232, 114, 44) → rgb(244, 240, 229))
  - 276 ms: `div.framer-183hcoh > div.framer-1l9hgmu > p.framer-text.framer-styles-preset-7580yq > a.framer-text.framer-styles-preset-xtze3j` CSS transition on `color`, 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (color: rgb(244, 240, 229) → rgb(232, 114, 44))
  - 560 ms: `div.framer-ru1x5z > div.framer-vbtyo5 > div.framer-30td5f > div.framer-c07j8` script animation (element.animate) on `opacity`, 400 ms after 200 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 660 ms: `section.framer-1tzev6y > div.framer-ru1x5z > div.framer-vbtyo5 > div.framer-1i262e7` script animation (element.animate) on `opacity`, 400 ms after 300 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
  - 760 ms: `div.framer-ru1x5z > div.framer-vbtyo5 > div.framer-30td5f > div.framer-fcc3g7` script animation (element.animate) on `opacity`, 400 ms after 400 ms, `cubic-bezier(0.44, 0, 0.56, 1)` (opacity: 0.001 → 1)
- **Film:** `reference/motion/transitions/04-to-contact.jpg` (frames from the click, captioned with ms).

## Hovering (what scripts do; CSS hover rules are in styles.css)

### 8. Hovering `a.framer-vmrh1.framer-yzysq`

- 71 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 71 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 71 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- 71 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` set to `rotate(-6deg)`
- 71 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` `transform` set to `rotate(6deg)`
- 71 ms: `div.framer-1pwx3yz > div.framer-1gycpy5:nth-of-type(1) > div.framer-1dksp2g:nth-of-type(2) > div.framer-3me2fc:nth-of-type(5) > div.framer-1jpu99j:nth-of-type(1)` `transform` set to `rotate(5deg)`
- **Film:** `reference/motion/hovers/01-a-framer-vmrh1-framer-yz.jpg`.

### 9. Hovering `a.framer-nx3fq.framer-ingnx`

- 3 ms: `div.framer-i85edc > div.framer-t2zri2:nth-of-type(1) > div.framer-17nqq3s-container:nth-of-type(2) > div.ssr-variant.hidden-18afziw > a.framer-vmrH1.framer-yZYSQ` `box-shadow` `0px 5.94548px 0px 0px var(--token-23b59c71-bcd9-4239-8358-53b6c3cc209e, rgb(178, 110, 69))` → `0px 4px 0px 0px var(--token-23b59c71-bcd9-4239-8358-53b6c3cc209e, rgb(178, 110, 69))` (10 steps)
- 3 ms: `div.framer-i85edc > div.framer-t2zri2:nth-of-type(1) > div.framer-17nqq3s-container:nth-of-type(2) > div.ssr-variant.hidden-18afziw > a.framer-vmrH1.framer-yZYSQ` `background-color` `rgb(216, 103, 28)` → `var(--token-9be2179a-d4c3-4b1c-a57e-66ad0ebb844d, rgb(232, 114, 44))` (9 steps)
- 3 ms: `div.ssr-variant.hidden-18afziw > div.framer-3vkpoh-container > a.framer-nX3Fq.framer-ingnX > div.framer-1cfkl1n:nth-of-type(2) > div.framer-1ljowsp` `transform` `scale(1.00024)` → `scale(1.05)` (30 steps)
- 60 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 60 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 60 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- **Film:** `reference/motion/hovers/02-a-framer-nx3fq-framer-in.jpg`.

### 10. Hovering `a.framer-0uxln.framer-xgt8x`

- 6 ms: `div.ssr-variant.hidden-18afziw > div.framer-3vkpoh-container > a.framer-nX3Fq.framer-ingnX > div.framer-1cfkl1n:nth-of-type(2) > div.framer-1ljowsp` `transform` `scale(1.04049)` → `none` (8 steps)
- 32 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 32 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 32 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- 32 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` set to `rotate(-6deg)`
- 32 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` `transform` set to `rotate(6deg)`
- **Film:** `reference/motion/hovers/03-a-framer-0uxln-framer-xg.jpg`.

### 11. Hovering `a.framer-eaxl2.framer-g0oww`

- 1 ms: `div.framer-1t99w32-container > a.framer-0uXLN.framer-xgT8x > div.framer-77cf9r:nth-of-type(1) > div.framer-1504cxp:nth-of-type(2) > div.framer-1fo1dtb` `transform` `scale(1.04463)` → `none` (37 steps)
- 50 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 50 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 50 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- 50 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` set to `rotate(-6deg)`
- 50 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` `transform` set to `rotate(6deg)`

### 12. Hovering `a.framer-5zke1.framer-ingnx`

- 4 ms: `div.ssr-variant.hidden-18afziw > a.framer-EAXl2.framer-g0owW > div.framer-hxuuql > div.framer-c5nwyy:nth-of-type(2) > div.framer-taet1b` `transform` `translate3d(1.40603px, 0px, 0px)` → `none` (6 steps)
- 4 ms: `div.ssr-variant.hidden-18afziw > a.framer-EAXl2.framer-g0owW > div.framer-hxuuql > div.framer-l4d6cz:nth-of-type(1) > div.framer-4lz8as:nth-of-type(1)` `--extracted-tcooor` `rgba(52, 68, 59, 1)` → `var(--token-e7e6c389-54de-40d3-bd41-8072dc4a41a5, rgb(69, 86, 75))` (7 steps)
- 4 ms: `div.ssr-variant.hidden-18afziw > a.framer-EAXl2.framer-g0owW > div.framer-hxuuql > div.framer-l4d6cz:nth-of-type(1) > div.framer-qhfbb1:nth-of-type(2)` `background-color` `rgb(52, 68, 59)` → `var(--token-e7e6c389-54de-40d3-bd41-8072dc4a41a5, rgb(69, 86, 75))` (7 steps)
- 4 ms: `div.framer-qrt1y9-container > div.ssr-variant.hidden-18afziw > a.framer-5ZKE1.framer-ingnX > div.framer-140za1a:nth-of-type(2) > div.framer-11cpwsc` `background-color` `rgb(56, 57, 40)` → `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` (11 steps)
- 99 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 99 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`

### 13. Hovering `a.framer-3mkd0.framer-yzysq`

- 3 ms: `div.framer-j9451v-container > div.ssr-variant.hidden-18afziw > a.framer-5ZKE1.framer-ingnX > div.framer-140za1a:nth-of-type(2) > div.framer-11cpwsc` `background-color` `rgb(194, 99, 43)` → `var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` (14 steps)
- 61 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 61 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 61 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- 61 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` set to `rotate(-6deg)`
- 61 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(3) > div.framer-16dcfc6-container` `transform` set to `rotate(6deg)`

### 14. Hovering `a.framer-fxasn.framer-1yv5043`

- 3 ms: `div.framer-ugkfba-container > div.framer-TNrt0.framer-g0owW > div.framer-3ycjh6:nth-of-type(2) > div.framer-aw3s9p-container > a.framer-3MKD0.framer-yZYSQ` `box-shadow` `0px 5.80462px 0px 0px var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` → `0px 4px 0px 0px var(--token-a225ace6-638e-469b-9793-3ab54fcf3b3a, rgb(27, 52, 40))` (9 steps)
- 3 ms: `div.framer-ugkfba-container > div.framer-TNrt0.framer-g0owW > div.framer-3ycjh6:nth-of-type(2) > div.framer-aw3s9p-container > a.framer-3MKD0.framer-yZYSQ` `background-color` `rgb(247, 245, 238)` → `var(--token-e079c459-c6e9-4577-8c52-a24b838cfa37, rgb(234, 228, 211))` (8 steps)
- 92 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(1) > div.framer-18tazs6-container` `transform` set to `rotate(2deg)`
- 92 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(2) > div.framer-1v4hp66-container` `transform` set to `rotate(-2deg)`
- 92 ms: `div.framer-1ky5bq3:nth-of-type(1) > div.framer-e9y44s:nth-of-type(2) > div.framer-12j51kx > div.ssr-variant.hidden-bcge12:nth-of-type(3) > div.framer-rbt8o-container` `transform` set to `rotate(2deg)`
- 92 ms: `div.framer-1fjdtnj > div.framer-1e9xds5 > div.framer-11bt30x:nth-of-type(2) > div.ssr-variant:nth-of-type(1) > div.framer-13p3dzp-container` `transform` set to `rotate(-6deg)`

### 15. Hovering `a.framer-6jwyo.framer-n0ccwk`

- 1 ms: `div.framer-Kxk9R.framer-1at5jdz:nth-of-type(1) > div.framer-1rs71ji-container:nth-of-type(6) > a.framer-fxasn.framer-1yv5043 > div.framer-108wwvz:nth-of-type(1) > div.framer-150v12y:nth-of-type(1)` `transform` `translate3d(0px, -24.8635px, 0px)` → `none` (31 steps)
- 1 ms: `div.framer-Kxk9R.framer-1at5jdz:nth-of-type(1) > div.framer-1rs71ji-container:nth-of-type(6) > a.framer-fxasn.framer-1yv5043 > div.framer-108wwvz:nth-of-type(1) > div.framer-etuony:nth-of-type(2)` `transform` `translateX(-50%) translate3d(0.509895px, -24.8635px, 0px) scale(1.07797, 1.07797)` → `translateX(-50%) scale(1.2, 1.2)` (32 steps)
- **In the code:** `reference/scripts/08-script-main-d3lgcaa0.js` at character 2787 (`framer-108wwvz`: `-name":void 0}},g,x),children:[v(E.div,{className:'framer-108wwvz',"data-framer-name":'Text Wrap',layoutDependency:T,lay`); `reference/scripts/08-script-main-d3lgcaa0.js` at character 3406 (`framer-150v12y`: ` 12)))'},children:'Get it for FREE'})}),className:'framer-150v12y',fonts:['GF;Geist-700'],layoutDependency:T,layoutId:'F`).

## The page's own code

The scripts the page ran are in `reference/scripts/` (8 files), so you can read exactly how each effect is made. Don't paste them in whole: rebuild each effect in the project's own code, following the recipe and the source together.
