// Builds assets/hot-take.svg — an auto-rotating panel of rxit.os hot-takes.
// The panel cycles through the pool on its own (CSS), so there's always a fresh
// one on screen. Run reshuffles the order. No dependencies (Node 20+).
import { writeFileSync, mkdirSync } from 'node:fs';

const TAKES = [
  "most 'AI strategy' is three prompts in a trench coat.",
  'the best team i ever hired was a for-loop.',
  "if your agent needs babysitting, it's an intern.",
  'ship it tuesday, feel things about it wednesday.',
  'headcount is a lagging indicator of avoiding automation.',
  'agents don’t do standups. that’s the whole pitch.',
  'every manual process is a script nobody wrote yet.',
  'senior means you delete more than you add.',
  'the demo is the spec.',
  'one human, a fleet of agents, zero all-hands.',
  'prod is the only staging that tells the truth.',
  "if it isn't live, it's a rumor.",
  "'we'll need a team for that' is usually a weekend.",
  'the roadmap is written in pencil and shipped in prod.',
  'i don’t have work-life balance, i have a deploy pipeline.',
  'meetings are standups that lost the plot.',
];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// shuffle (Fisher-Yates)
for (let i = TAKES.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [TAKES[i], TAKES[j]] = [TAKES[j], TAKES[i]];
}

// wrap to <= width chars, max 2 lines
function wrap(t, width) {
  const words = t.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= width) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

const N = TAKES.length;
const SLIDE = 3.6;                 // seconds each take is shown
const DUR = (N * SLIDE).toFixed(1);
const visPct = (100 / N);          // window width in %
const fadeIn = 0.6, hold = visPct - 1.2, fadeOut = visPct - 0.6;
const kf = `@keyframes cyc{0%{opacity:0}${fadeIn.toFixed(2)}%{opacity:1}${hold.toFixed(2)}%{opacity:1}${fadeOut.toFixed(2)}%{opacity:0}100%{opacity:0}}`;

const takesSvg = TAKES.map((t, i) => {
  const lines = wrap(t, 40);
  const tspans = lines
    .map((l, k) => `<tspan x="420" dy="${k === 0 ? 0 : 32}">${esc(l)}</tspan>`)
    .join('');
  const y = lines.length === 1 ? 98 : 84;
  return `<text class="t" x="420" y="${y}" text-anchor="middle" font-size="22" font-weight="700" fill="#e9e9ff" style="animation-delay:${(i * SLIDE).toFixed(2)}s">${tspans}</text>`;
}).join('\n    ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 168" width="840" height="168" fill="none" role="img" aria-label="rxit.os hot-take, auto-rotating">
  <title>rxit.os // transmission</title>
  <defs>
    <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="hedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#ff00e5"/></linearGradient>
    <clipPath id="hw"><rect x="6" y="6" width="828" height="156" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .t{ opacity:0; animation:cyc ${DUR}s linear infinite }
      ${kf}
      .p{ animation:pl 1.5s ease-in-out infinite } @keyframes pl{0%,100%{opacity:1}50%{opacity:.3}}
      @media (prefers-reduced-motion:reduce){ .t{animation:none} .t:first-of-type{opacity:1} .p{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#hw)">
    <rect x="6" y="6" width="828" height="156" rx="14" fill="url(#hbg)"/>
    <circle cx="30" cy="32" r="5" fill="#00f0ff" class="p"/>
    <text x="44" y="37" font-size="12" letter-spacing="3" fill="#00f0ff">◉ rxit.os // transmission</text>
    <text x="810" y="37" text-anchor="end" font-size="11" fill="#7f7fb0">auto-rotating · ${N} takes</text>
    <line x1="20" y1="50" x2="820" y2="50" stroke="#2a2a55" stroke-opacity="0.5"/>
    ${takesSvg}
    <text x="810" y="150" text-anchor="end" font-size="12" fill="#39ff14">— rxit</text>
    <rect x="7" y="7" width="826" height="154" rx="13" fill="none" stroke="url(#hedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;

mkdirSync('assets', { recursive: true });
writeFileSync('assets/hot-take.svg', svg);
console.log(`hot-take panel built (${N} takes, ${DUR}s loop)`);
