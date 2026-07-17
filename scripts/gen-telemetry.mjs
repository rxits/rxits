// Regenerates assets/telemetry.svg from live GitHub data. No dependencies (Node 20+).
// Run by .github/workflows/live-telemetry.yml on a schedule; also runnable locally.
import { writeFileSync, mkdirSync } from 'node:fs';

const USER = 'rxits';
const token = process.env.GITHUB_TOKEN;
const headers = { 'User-Agent': USER, Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

const api = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

const relTime = (iso) => {
  if (!iso) return '—';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildSvg(d) {
  const cols = [
    { v: d.commits30, l: 'COMMITS / 30d' },
    { v: d.repos, l: 'PUBLIC REPOS' },
    { v: d.followers, l: 'FOLLOWERS' },
    { v: d.lastShip, l: 'LAST SHIP' },
  ];
  const cells = cols.map((c, i) => {
    const x = 60 + i * 195;
    return `<text x="${x}" y="70" font-size="34" font-weight="700" class="w">${esc(c.v)}</text>` +
           `<text x="${x}" y="94" font-size="11" letter-spacing="2" class="d">${esc(c.l)}</text>` +
           (i < 3 ? `<line x1="${x + 168}" y1="44" x2="${x + 168}" y2="92" stroke="#2a2a55" stroke-opacity="0.5"/>` : '');
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 130" width="840" height="130" fill="none" role="img" aria-label="live telemetry">
  <title>live telemetry — auto-synced from GitHub</title>
  <defs>
    <linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="tedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#ff00e5"/></linearGradient>
    <clipPath id="tw"><rect x="6" y="6" width="828" height="118" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace; }
      .d{ fill:#7f7fb0 } .w{ fill:#e9e9ff } .c{ fill:#00f0ff } .g{ fill:#39ff14 }
      .p{ animation:pl 1.6s ease-in-out infinite } @keyframes pl{ 0%,100%{opacity:1} 50%{opacity:.25} }
      @media (prefers-reduced-motion:reduce){ .p{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#tw)">
    <rect x="6" y="6" width="828" height="118" rx="14" fill="url(#tbg)"/>
    <circle cx="30" cy="30" r="5" fill="#39ff14" class="p"/>
    <text x="44" y="35" font-size="12" letter-spacing="3" class="g">LIVE TELEMETRY</text>
    <text x="814" y="35" text-anchor="end" font-size="11" class="d">synced ${esc(d.stamp)}</text>
    <line x1="20" y1="46" x2="820" y2="46" stroke="#2a2a55" stroke-opacity="0.5"/>
    ${cells}
    <rect x="7" y="7" width="826" height="116" rx="13" fill="none" stroke="url(#tedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;
}

async function main() {
  const user = await api(`https://api.github.com/users/${USER}`);
  let commits30 = 0, lastPush = null;
  try {
    const events = await api(`https://api.github.com/users/${USER}/events/public?per_page=100`);
    const cutoff = Date.now() - 30 * 86400000;
    for (const e of events) {
      if (e.type === 'PushEvent') {
        if (!lastPush) lastPush = e.created_at;
        if (new Date(e.created_at).getTime() > cutoff) commits30 += e.payload?.size || 0;
      }
    }
  } catch (e) { console.error('events fetch failed:', e.message); }

  const data = {
    commits30,
    repos: user.public_repos ?? '—',
    followers: user.followers ?? '—',
    lastShip: relTime(lastPush),
    stamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  };

  mkdirSync('assets', { recursive: true });
  writeFileSync('assets/telemetry.svg', buildSvg(data));
  console.log('telemetry updated:', data);
}

main().catch((e) => { console.error(e); process.exit(1); });
