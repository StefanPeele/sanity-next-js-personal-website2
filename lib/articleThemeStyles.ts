// lib/articleThemeStyles.ts
// The single source of truth for all article theming.
// Injected as a <style> tag in the article page — does not affect the rest of the site.
// Toolbar switches themes by toggling CSS classes on [data-article].

export const ARTICLE_THEME_CSS = `

/* ═══════════════════════════════════════════════════════════════
   BASE ARTICLE IMPROVEMENTS — applies across all themes
   ═══════════════════════════════════════════════════════════════ */

[data-article] {
  position: relative;
  transition: background-color 0.5s ease, color 0.4s ease,
              padding 0.4s ease, box-shadow 0.4s ease;
}

[data-article] p {
  line-height: 1.85;
  letter-spacing: 0.01em;
}

/* ── Ink bleed underline effect ──────────────────────────────── */
/* Links get a left-to-right color fill on hover instead of
   a static underline. More editorial, more intentional. */
[data-article] a:not([class]) {
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-size: 0% 1.5px;
  background-repeat: no-repeat;
  background-position: 0% 100%;
  transition: background-size 0.35s ease, color 0.2s ease;
  padding-bottom: 1px;
}

[data-article] a:not([class]):hover {
  background-size: 100% 1.5px;
}

/* ── Image focus pull ────────────────────────────────────────── */
/* Images start slightly desaturated. They come to life on hover. */
[data-article] img {
  transition: filter 0.55s ease;
  filter: grayscale(25%) brightness(0.9);
}

[data-article] img:hover {
  filter: grayscale(0%) brightness(1);
}

/* ── Text selection — Archive default ────────────────────────── */
[data-article] ::selection {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}


/* ═══════════════════════════════════════════════════════════════
   TERMINAL THEME — phosphor green on near-black, monospace
   ═══════════════════════════════════════════════════════════════ */

[data-article].theme-terminal {
  background-color: #0d1117;
  color: rgba(0, 255, 65, 0.85);
  font-family: var(--font-mono), 'IBM Plex Mono', 'Courier New', monospace;
}

[data-article].theme-terminal p {
  color: rgba(0, 255, 65, 0.82);
  line-height: 1.8;
  letter-spacing: 0.025em;
}

[data-article].theme-terminal h1,
[data-article].theme-terminal h2,
[data-article].theme-terminal h3,
[data-article].theme-terminal h4 {
  color: #00ff41;
  font-family: var(--font-mono), monospace;
  letter-spacing: 0.02em;
}

[data-article].theme-terminal h2 {
  border-bottom-color: rgba(0, 255, 65, 0.12);
}

[data-article].theme-terminal strong {
  color: #00ff41;
  font-weight: 700;
}

[data-article].theme-terminal em {
  color: rgba(0, 255, 65, 0.7);
  font-style: italic;
}

[data-article].theme-terminal a:not([class]) {
  color: #00ff41;
  background-image: linear-gradient(#00ff41, #00ff41);
}

[data-article].theme-terminal a:not([class]):hover {
  color: #ffffff;
  background-image: linear-gradient(#ffffff, #ffffff);
}

[data-article].theme-terminal code {
  background-color: rgba(0, 255, 65, 0.08) !important;
  border-color: rgba(0, 255, 65, 0.2) !important;
  color: #00ff41 !important;
  font-family: var(--font-mono), monospace !important;
}

[data-article].theme-terminal blockquote {
  border-left-color: rgba(0, 255, 65, 0.3);
  color: rgba(0, 255, 65, 0.6);
}

[data-article].theme-terminal li {
  color: rgba(0, 255, 65, 0.8);
}

/* Terminal — selection */
[data-article].theme-terminal ::selection {
  background-color: rgba(0, 255, 65, 0.25);
  color: #0d1117;
}

/* Terminal — subtle flicker (very mild, doesn't cause headaches) */
@keyframes sp-flicker {
  0%, 97%, 100% { opacity: 1; }
  98% { opacity: 0.97; }
  99% { opacity: 1; }
}

[data-article].theme-terminal {
  animation: sp-flicker 12s ease-in-out infinite;
}

/* Terminal — ink bleed is green */
[data-article].theme-terminal img {
  filter: grayscale(60%) brightness(0.7) sepia(20%) hue-rotate(80deg);
}

[data-article].theme-terminal img:hover {
  filter: grayscale(40%) brightness(0.85) sepia(10%) hue-rotate(80deg);
}


/* ═══════════════════════════════════════════════════════════════
   PAPER THEME — warm cream, book-like, serif-focused
   ═══════════════════════════════════════════════════════════════ */

[data-article].theme-paper {
  background-color: #f8f4ef;
  color: #3d2b1f;
  padding: 2.5rem 3rem 3.5rem;
  border-radius: 2px;
  box-shadow:
    0 2px 8px rgba(61, 43, 31, 0.08),
    0 8px 32px rgba(61, 43, 31, 0.06),
    inset 0 0 0 1px rgba(61, 43, 31, 0.06);
}

[data-article].theme-paper p {
  color: #3d2b1f;
  line-height: 1.92;
  letter-spacing: 0.005em;
}

[data-article].theme-paper h1,
[data-article].theme-paper h2,
[data-article].theme-paper h3,
[data-article].theme-paper h4 {
  color: #1a0f08;
  letter-spacing: -0.015em;
}

[data-article].theme-paper h2 {
  border-bottom-color: rgba(61, 43, 31, 0.1);
}

[data-article].theme-paper strong {
  color: #1a0f08;
}

[data-article].theme-paper em {
  color: #5a3a28;
}

[data-article].theme-paper a:not([class]) {
  color: #7b3f1e;
  background-image: linear-gradient(#7b3f1e, #7b3f1e);
}

[data-article].theme-paper a:not([class]):hover {
  color: #5a2d12;
  background-image: linear-gradient(#5a2d12, #5a2d12);
}

[data-article].theme-paper code {
  background-color: rgba(61, 43, 31, 0.07) !important;
  border-color: rgba(61, 43, 31, 0.15) !important;
  color: #5a2d12 !important;
}

[data-article].theme-paper blockquote {
  border-left-color: rgba(123, 63, 30, 0.4);
  color: #6b4c3b;
  font-style: italic;
}

[data-article].theme-paper li {
  color: #3d2b1f;
}

[data-article].theme-paper ::selection {
  background-color: rgba(123, 63, 30, 0.2);
  color: #1a0f08;
}

/* Paper — images warm slightly */
[data-article].theme-paper img {
  filter: sepia(12%) brightness(0.97) contrast(1.02);
}

[data-article].theme-paper img:hover {
  filter: sepia(0%) brightness(1) contrast(1);
}

/* Paper — subtle grain texture overlay */
[data-article].theme-paper::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 2px;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  z-index: 0;
}


/* ═══════════════════════════════════════════════════════════════
   BROADCAST THEME — high contrast white, news editorial
   ═══════════════════════════════════════════════════════════════ */

[data-article].theme-broadcast {
  background-color: #ffffff;
  color: #141414;
  padding: 2.5rem 3rem 3.5rem;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
}

[data-article].theme-broadcast p {
  color: #1a1a1a;
  line-height: 1.72;
  letter-spacing: -0.002em;
}

[data-article].theme-broadcast h1,
[data-article].theme-broadcast h2,
[data-article].theme-broadcast h3,
[data-article].theme-broadcast h4 {
  color: #000000;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

[data-article].theme-broadcast h2 {
  border-bottom-color: #e8e8e8;
}

[data-article].theme-broadcast h3 {
  font-weight: 800;
  letter-spacing: -0.025em;
}

[data-article].theme-broadcast strong {
  color: #000000;
  font-weight: 800;
}

[data-article].theme-broadcast em {
  color: #333333;
}

[data-article].theme-broadcast a:not([class]) {
  color: #cc0000;
  background-image: linear-gradient(#cc0000, #cc0000);
}

[data-article].theme-broadcast a:not([class]):hover {
  color: #990000;
  background-image: linear-gradient(#990000, #990000);
}

[data-article].theme-broadcast code {
  background-color: #f4f4f4 !important;
  border-color: #e0e0e0 !important;
  color: #cc0000 !important;
}

[data-article].theme-broadcast blockquote {
  border-left-color: #cc0000;
  border-left-width: 3px;
  color: #444444;
  font-style: normal;
  font-weight: 600;
}

[data-article].theme-broadcast li {
  color: #1a1a1a;
}

[data-article].theme-broadcast ::selection {
  background-color: rgba(204, 0, 0, 0.1);
  color: #000000;
}

/* Broadcast — images full color, no desaturation */
[data-article].theme-broadcast img {
  filter: none;
  border: 1px solid #e8e8e8;
}

[data-article].theme-broadcast img:hover {
  filter: none;
  border-color: #cccccc;
}


/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITY MODES
   Applied as additional classes on [data-article].
   Stack on top of any theme — order: theme first, then a11y.
   ═══════════════════════════════════════════════════════════════ */

/* ── Dyslexia mode — Lexend font + enhanced spacing ─────────── */
/* Lexend is loaded dynamically by the toolbar when this is activated */
[data-article].a11y-dyslexia,
[data-article].a11y-dyslexia p,
[data-article].a11y-dyslexia li,
[data-article].a11y-dyslexia span {
  font-family: 'Lexend', 'OpenDyslexic', system-ui, sans-serif !important;
  letter-spacing: 0.06em !important;
  word-spacing: 0.18em !important;
  line-height: 2.1 !important;
}

[data-article].a11y-dyslexia p {
  margin-bottom: 1.6em !important;
  max-width: 65ch !important;
}

[data-article].a11y-dyslexia h1,
[data-article].a11y-dyslexia h2,
[data-article].a11y-dyslexia h3,
[data-article].a11y-dyslexia h4 {
  font-family: 'Lexend', system-ui, sans-serif !important;
  letter-spacing: 0.02em !important;
  line-height: 1.3 !important;
}

/* Dyslexia — no justified text */
[data-article].a11y-dyslexia {
  text-align: left !important;
}

/* ── High contrast mode ──────────────────────────────────────── */
/* Overrides all themes with maximum contrast ratios */
[data-article].a11y-high-contrast {
  background-color: #000000 !important;
  color: #ffffff !important;
  box-shadow: none !important;
}

[data-article].a11y-high-contrast p,
[data-article].a11y-high-contrast li,
[data-article].a11y-high-contrast span {
  color: #ffffff !important;
}

[data-article].a11y-high-contrast h1,
[data-article].a11y-high-contrast h2,
[data-article].a11y-high-contrast h3,
[data-article].a11y-high-contrast h4 {
  color: #ffffff !important;
}

[data-article].a11y-high-contrast a:not([class]) {
  color: #ffff00 !important;
  text-decoration: underline !important;
  background-image: none !important;
}

[data-article].a11y-high-contrast code {
  background-color: #222222 !important;
  border-color: #555555 !important;
  color: #00ff00 !important;
}

[data-article].a11y-high-contrast blockquote {
  border-left-color: #ffff00 !important;
  color: #ffffff !important;
}

[data-article].a11y-high-contrast img {
  filter: none !important;
  border: 2px solid #ffffff !important;
}

[data-article].a11y-high-contrast ::selection {
  background-color: #ffffff !important;
  color: #000000 !important;
}

/* ── Reduced motion mode ─────────────────────────────────────── */
[data-article].a11y-reduced-motion *,
[data-article].a11y-reduced-motion *::before,
[data-article].a11y-reduced-motion *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

/* Also respect OS-level preference */
@media (prefers-reduced-motion: reduce) {
  [data-article] *,
  [data-article] *::before,
  [data-article] *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}


/* ═══════════════════════════════════════════════════════════════
   CRT OVERLAY — terminal theme visual effect
   Controlled by .crt-active class on the overlay element
   ═══════════════════════════════════════════════════════════════ */

.sp-crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.sp-crt-overlay.crt-active {
  opacity: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 2px,
    rgba(0, 0, 0, 0.04) 4px
  );
}

/* CRT corner vignette */
.sp-crt-overlay.crt-active::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
}


/* ═══════════════════════════════════════════════════════════════
   MAGNETIC CURSOR — desktop only
   ═══════════════════════════════════════════════════════════════ */

.sp-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  transform: translate(-50%, -50%);
  transition: width 0.2s ease, height 0.2s ease, opacity 0.3s ease;
  opacity: 0;
}

.sp-cursor.cursor-visible {
  opacity: 1;
}

.sp-cursor.cursor-hover {
  width: 32px;
  height: 32px;
}

/* Hide default cursor on article when magnetic cursor is active */
.sp-cursor-active [data-article] * {
  cursor: none !important;
}

`