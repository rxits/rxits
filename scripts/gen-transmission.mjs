// Builds assets/transmission.svg — an auto-rotating "open to work" board.
// Content is curated (edit CONTENT below). Rotation is pure CSS inside the SVG,
// so this only needs to run when the content here changes — no schedule.
// No dependencies (Node 20+).
import { writeFileSync, mkdirSync } from 'node:fs';

// ── edit me ────────────────────────────────────────────────────────────────
const CONTENT = [
  { label: 'OPEN TO', color: '#39ff14', text: 'AI / Full-stack Engineer · remote, international', meta: 'available now' },
  { label: 'STACK',   color: '#00f0ff', text: 'TypeScript · Next.js · Python · Dart/Flutter',      meta: 'shipped in prod' },
  { label: 'BUILDING',color: '#ff2ee6', text: 'Aumiqx — an agent-run software studio',             meta: 'founder' },
  { label: 'REACH',   color: '#00f0ff', text: 'rakshitsharma4179@gmail.com',                        meta: '— rxit' },
];
// ─────────────────────────────────────────────────────────────────────────────

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

function wrap(t, width) {
  const words = t.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= width) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) { lines[1] = cap(lines[1] + ' ' + lines.slice(2).join(' '), width); lines.length = 2; }
  return lines;
}

function build(items) {
  const N = items.length;
  const SLIDE = 6; // seconds per slide
  const DUR = (N * SLIDE).toFixed(1);
  const visPct = 100 / N;
  const kf = `@keyframes cyc{0%{opacity:0}0.6%{opacity:1}${(visPct - 1.4).toFixed(2)}%{opacity:1}${(visPct - 0.6).toFixed(2)}%{opacity:0}100%{opacity:0}}`;

  const slides = items.map((it, i) => {
    const lines = wrap(it.text, 44);
    const y = lines.length === 1 ? 104 : 90;
    const tspans = lines.map((l, k) => `<tspan x="420" dy="${k === 0 ? 0 : 30}">${esc(l)}</tspan>`).join('');
    const delay = (i * SLIDE).toFixed(2);
    return `<g class="s" style="animation-delay:${delay}s">
      <text x="30" y="76" font-size="12" letter-spacing="3" fill="${it.color}">▸ ${esc(it.label)}</text>
      <text x="420" y="${y}" text-anchor="middle" font-size="20" font-weight="700" fill="#e9e9ff">${tspans}</text>
      <text x="810" y="150" text-anchor="end" font-size="12" fill="#7f7fb0">${esc(it.meta)}</text>
    </g>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 172" width="840" height="172" fill="none" role="img" aria-label="open to work — roles, stack, and how to reach rxit">
  <title>rxit.os // open to work</title>
  <defs>
    <linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="tedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#ff00e5"/></linearGradient>
    <clipPath id="tw"><rect x="6" y="6" width="828" height="160" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .s{ opacity:0; animation:cyc ${DUR}s linear infinite }
      ${kf}
      .p{ animation:pl 1.5s ease-in-out infinite } @keyframes pl{0%,100%{opacity:1}50%{opacity:.3}}
      @media (prefers-reduced-motion:reduce){ .s{animation:none} .s:first-of-type{opacity:1} .p{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#tw)">
    <rect x="6" y="6" width="828" height="160" rx="14" fill="url(#tbg)"/>
    <circle cx="30" cy="34" r="5" fill="#39ff14" class="p"/>
    <text x="44" y="39" font-size="12" letter-spacing="3" fill="#39ff14">◉ rxit.os // open to work</text>
    <text x="810" y="39" text-anchor="end" font-size="11" fill="#7f7fb0">remote · international · available now</text>
    <line x1="20" y1="52" x2="820" y2="52" stroke="#2a2a55" stroke-opacity="0.5"/>
    ${slides}
    <rect x="7" y="7" width="826" height="158" rx="13" fill="none" stroke="url(#tedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;
}

if (!CONTENT.length) { console.error('CONTENT is empty'); process.exit(1); }
mkdirSync('assets', { recursive: true });
writeFileSync('assets/transmission.svg', build(CONTENT));
console.log(`open-to-work board built · ${CONTENT.length} slides ·`, CONTENT.map((i) => i.label).join(','));
