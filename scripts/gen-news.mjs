// Regenerates assets/news.svg with a fresh top tech/AI headline from Hacker News.
// No dependencies (Node 20+). Run by .github/workflows/live-signal.yml on a schedule.
import { writeFileSync, mkdirSync } from 'node:fs';

const KEYWORDS = /\b(ai|agent|agents|llm|gpt|claude|anthropic|openai|gemini|model|prompt|rag|ml|neural|inference)\b/i;

const relTime = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const domain = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'news.ycombinator.com'; } };

// wrap into at most `maxLines` lines of ~`width` chars; ellipsize overflow
function wrap(text, width, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= width) cur = (cur + ' ' + w).trim();
    else { lines.push(cur); cur = w; if (lines.length === maxLines) break; }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines) {
    const used = lines.join(' ').split(/\s+/).length;
    if (used < words.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…');
  }
  return lines.slice(0, maxLines);
}

function buildSvg(story) {
  const lines = wrap(story.title, 46, 2);
  const titleTspans = lines.map((l, i) => `<tspan x="34" dy="${i === 0 ? 0 : 30}">${esc(l)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 156" width="840" height="156" fill="none" role="img" aria-label="incoming signal — ${esc(story.title)}">
  <title>incoming signal — ${esc(story.title)}</title>
  <defs>
    <linearGradient id="nbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0d20"/><stop offset="1" stop-color="#100a1c"/></linearGradient>
    <linearGradient id="nedge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#ff00e5"/></linearGradient>
    <clipPath id="nw"><rect x="6" y="6" width="828" height="144" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .d{ fill:#7f7fb0 } .w{ fill:#e9e9ff } .c{ fill:#00f0ff } .g{ fill:#39ff14 }
      .p{ animation:pl 1.5s ease-in-out infinite } @keyframes pl{0%,100%{opacity:1}50%{opacity:.3}}
      @media (prefers-reduced-motion:reduce){ .p{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#nw)">
    <rect x="6" y="6" width="828" height="144" rx="14" fill="url(#nbg)"/>
    <circle cx="30" cy="32" r="5" fill="#00f0ff" class="p"/>
    <text x="44" y="37" font-size="12" letter-spacing="3" class="c">◉ INCOMING SIGNAL</text>
    <text x="814" y="37" text-anchor="end" font-size="11" class="d">${esc(relTime(story.created_at))} · via Hacker News</text>
    <line x1="20" y1="50" x2="820" y2="50" stroke="#2a2a55" stroke-opacity="0.5"/>
    <text y="88" font-size="21" font-weight="700" class="w">${titleTspans}</text>
    <text x="34" y="136" font-size="13" class="g">▸ ${esc(story.host)}</text>
    <text x="814" y="136" text-anchor="end" font-size="13" class="d">▲ ${story.points} points · ${story.comments} comments</text>
    <rect x="7" y="7" width="826" height="142" rx="13" fill="none" stroke="url(#nedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;
}

async function main() {
  const r = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40', { headers: { 'User-Agent': 'rxits-profile' } });
  if (!r.ok) throw new Error('HN API ' + r.status);
  const { hits } = await r.json();
  const valid = hits.filter((h) => h.title);
  const pick = valid.find((h) => KEYWORDS.test(h.title)) || valid.sort((a, b) => (b.points || 0) - (a.points || 0))[0];
  const story = {
    title: pick.title,
    host: pick.url ? domain(pick.url) : 'news.ycombinator.com',
    points: pick.points ?? 0,
    comments: pick.num_comments ?? 0,
    created_at: pick.created_at,
  };
  mkdirSync('assets', { recursive: true });
  writeFileSync('assets/news.svg', buildSvg(story));
  console.log('signal updated:', story.title, '·', story.host);
}

main().catch((e) => { console.error(e); process.exit(1); });
