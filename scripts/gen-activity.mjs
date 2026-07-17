// Builds assets/activity.svg — a hand-built, animated "activity" heatmap.
// Ambient/decorative (not scraped stats): a flowing grid that ripples in waves.
// No dependencies (Node 20+). Run: node scripts/gen-activity.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const COLS = 30, ROWS = 7, SIZE = 18, GAP = 8, X0 = 30, Y0 = 66;
const SHADES = ['#141433', '#12351f', '#1c6b2e', '#27bf40', '#39ff14'];

const cells = [];
for (let c = 0; c < COLS; c++) {
  for (let r = 0; r < ROWS; r++) {
    const v = (Math.sin(c * 0.5) + Math.sin(r * 0.9 + c * 0.22) + Math.sin(c * 0.17) + 3) / 6; // 0..1
    const idx = Math.min(SHADES.length - 1, Math.max(0, Math.round(v * (SHADES.length - 1))));
    const x = X0 + c * (SIZE + GAP);
    const y = Y0 + r * (SIZE + GAP);
    const delay = (c * 0.05 + r * 0.04).toFixed(2);
    cells.push(`<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="4" fill="${SHADES[idx]}" class="q" style="animation-delay:${delay}s"/>`);
  }
}

const W = X0 * 2 + COLS * (SIZE + GAP) - GAP;
const H = Y0 + ROWS * (SIZE + GAP) + 24;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" role="img" aria-label="activity — always building">
  <title>activity — always building</title>
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="aedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#39ff14"/><stop offset="1" stop-color="#00f0ff"/></linearGradient>
    <clipPath id="aw"><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .q{ animation:rp 3.2s ease-in-out infinite }
      @keyframes rp{ 0%,100%{opacity:.55} 50%{opacity:1} }
      @media (prefers-reduced-motion:reduce){ .q{animation:none;opacity:1} }
    </style>
  </defs>
  <g clip-path="url(#aw)">
    <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="16" fill="url(#abg)"/>
    <circle cx="30" cy="34" r="5" fill="#39ff14"/>
    <text x="46" y="39" font-size="12" letter-spacing="3" fill="#39ff14">ACTIVITY</text>
    <text x="${W - 24}" y="39" text-anchor="end" font-size="11" fill="#7f7fb0">something's always building</text>
    ${cells.join('\n    ')}
    <rect x="7" y="7" width="${W - 14}" height="${H - 14}" rx="15" fill="none" stroke="url(#aedge)" stroke-width="1.3" opacity="0.8"/>
  </g>
</svg>
`;

mkdirSync('assets', { recursive: true });
writeFileSync('assets/activity.svg', svg);
console.log('activity heatmap generated');
