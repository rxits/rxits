// Signal wall: appends a visitor's signal (when run from the issue workflow)
// and re-renders assets/wall.svg from data/signals.json. No dependencies (Node 20+).
//
// Append mode: set env SIGNAL_USER (+ optional SIGNAL_BODY). Otherwise just re-renders.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const DB = 'data/signals.json';
const SHOW = 6, MAX_MSG = 60;

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const relTime = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

const load = () => { try { return JSON.parse(readFileSync(DB, 'utf8')); } catch { return []; } };

// first non-empty, non-comment line of the issue body
const firstLine = (body) =>
  String(body || '').replace(/<!--[\s\S]*?-->/g, '').split('\n').map((x) => x.trim()).find(Boolean) || '';

let signals = load();

const user = process.env.SIGNAL_USER;
if (user) {
  let msg = firstLine(process.env.SIGNAL_BODY).replace(/[\r\n\t]/g, ' ').slice(0, MAX_MSG).trim();
  if (!msg) msg = 'left a signal';
  signals.push({ user: String(user).slice(0, 39), msg, at: new Date().toISOString() });
  signals = signals.slice(-200);
  mkdirSync('data', { recursive: true });
  writeFileSync(DB, JSON.stringify(signals, null, 2) + '\n');
}

const rows = signals.slice(-SHOW).reverse();
const rowH = 34, top = 70;
const H = top + Math.max(1, rows.length) * rowH + 20;

const rowSvg = rows.length
  ? rows.map((s, i) => {
      const y = top + i * rowH;
      return `<text x="30" y="${y}" font-size="14" class="c">@${esc(s.user)}</text>` +
             `<text x="150" y="${y}" font-size="14" class="w">${esc(s.msg)}</text>` +
             `<text x="810" y="${y}" text-anchor="end" font-size="12" class="d">${esc(relTime(s.at))}</text>`;
    }).join('\n    ')
  : `<text x="420" y="${top + 10}" text-anchor="middle" font-size="15" class="d">be the first to leave a signal ↗</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 ${H}" width="840" height="${H}" fill="none" role="img" aria-label="signal wall">
  <title>signal wall — ${signals.length} signals</title>
  <defs>
    <linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="wedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff00e5"/><stop offset="1" stop-color="#00f0ff"/></linearGradient>
    <clipPath id="ww"><rect x="6" y="6" width="828" height="${H - 12}" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .d{ fill:#7f7fb0 } .w{ fill:#e9e9ff } .c{ fill:#00f0ff } .m{ fill:#ff2ee6 }
      .p{ animation:pl 1.6s ease-in-out infinite } @keyframes pl{0%,100%{opacity:1}50%{opacity:.3}}
      @media (prefers-reduced-motion:reduce){ .p{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#ww)">
    <rect x="6" y="6" width="828" height="${H - 12}" rx="14" fill="url(#wbg)"/>
    <circle cx="30" cy="34" r="5" fill="#ff2ee6" class="p"/>
    <text x="44" y="39" font-size="12" letter-spacing="3" class="m">◉ SIGNAL WALL</text>
    <text x="810" y="39" text-anchor="end" font-size="11" class="d">${signals.length} signals · leave yours ↗</text>
    <line x1="20" y1="52" x2="820" y2="52" stroke="#2a2a55" stroke-opacity="0.5"/>
    ${rowSvg}
    <rect x="7" y="7" width="826" height="${H - 14}" rx="13" fill="none" stroke="url(#wedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;

mkdirSync('assets', { recursive: true });
writeFileSync('assets/wall.svg', svg);
console.log('wall updated · total signals:', signals.length);
