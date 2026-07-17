// Builds assets/transmission.svg — an auto-rotating panel that mixes:
//   • live tech NEWS (Hacker News, filtered to AI / modern-stack topics)
//   • FACTS about Claude + modern, useful tech (curated)
//   • rxit's HOT TAKES (humour)
// Each slide shows ~6s. HN fetch is best-effort; curated content is the fallback.
// No dependencies (Node 20+).
import { writeFileSync, mkdirSync } from 'node:fs';

const HOT_TAKES = [
  "most 'AI strategy' is three prompts in a trench coat.",
  'the best team i ever hired was a for-loop.',
  "if your agent needs babysitting, it's an intern.",
  'ship it tuesday, feel things about it wednesday.',
  'agents don’t do standups. that’s the whole pitch.',
  'every manual process is a script nobody wrote yet.',
  'senior means you delete more than you add.',
  'the demo is the spec.',
  'one human, a fleet of agents, zero all-hands.',
  "if it isn't live, it's a rumor.",
  "'we'll need a team for that' is usually a weekend.",
  'i don’t have work-life balance, i have a deploy pipeline.',
];

// facts about Claude + the modern, useful stack — no dusty trivia
const TECH_FACTS = [
  'Claude can hold up to a 1M-token context — roughly a 700k-word book, in memory at once.',
  'Claude is named after Claude Shannon, the father of information theory.',
  'MCP (Model Context Protocol) is a standard that lets any agent plug into any tool.',
  'prompt caching can cut repeated-context LLM costs by up to ~90%.',
  'RAG grounds a model in your data instead of trusting its training memory.',
  'Next.js server components render on the server, so the browser ships less JS.',
  "TypeScript's types vanish at runtime — a compile-time safety net, nothing more.",
  'an LLM at temperature 0 is near-deterministic; crank it up for more chaos.',
  'vector embeddings turn meaning into coordinates you can literally do math on.',
  'streaming makes an LLM feel faster — tokens render as they’re generated.',
  'Claude Code runs an agentic loop in your terminal: read, edit, run, repeat.',
  'edge functions run near the user, shaving real latency off every request.',
];

const NEWS_KW = /\b(ai|claude|anthropic|llm|gpt|openai|gemini|agent|agents|typescript|javascript|react|next\.?js|node|rust|python|postgres|redis|docker|kubernetes|vercel|serverless|api|mcp|rag|model|ml|prompt|compiler|database|wasm|open.?source|self-?host)\b/i;

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'news.ycombinator.com'; } };
const cap = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);

async function safe(fn, fallback) { try { return await fn(); } catch { return fallback; } }

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

async function collect() {
  const items = [];

  // NEWS — Hacker News, filtered to AI / modern-stack topics only
  const hn = await safe(async () => {
    const r = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=40', { headers: { 'User-Agent': 'rxits-profile' } });
    return (await r.json()).hits;
  }, []);
  // take the top keyword matches, then randomly pick from them so each run differs
  const newsMatches = hn
    .filter((h) => h.title && NEWS_KW.test(h.title))
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 12);
  shuffle(newsMatches).slice(0, 4)
    .forEach((h) => items.push({ type: 'news', text: cap(h.title, 90), meta: h.url ? domain(h.url) : 'news.ycombinator.com' }));

  // FACTS — Claude + modern tech
  shuffle(TECH_FACTS).slice(0, 5).forEach((t) => items.push({ type: 'fact', text: cap(t, 92), meta: 'tech fact' }));

  // HOT TAKES — humour
  shuffle(HOT_TAKES).slice(0, 5).forEach((t) => items.push({ type: 'take', text: t, meta: '— rxit' }));

  return shuffle(items).slice(0, 14);
}

const STYLE = {
  news: { label: 'NEWS', color: '#00f0ff' },
  fact: { label: 'FACT', color: '#39ff14' },
  take: { label: 'HOT TAKE', color: '#ff2ee6' },
};

function build(items) {
  const N = items.length;
  const SLIDE = 6; // seconds per slide
  const DUR = (N * SLIDE).toFixed(1);
  const visPct = 100 / N;
  const kf = `@keyframes cyc{0%{opacity:0}0.6%{opacity:1}${(visPct - 1.4).toFixed(2)}%{opacity:1}${(visPct - 0.6).toFixed(2)}%{opacity:0}100%{opacity:0}}`;

  const slides = items.map((it, i) => {
    const s = STYLE[it.type];
    const lines = wrap(it.text, 44);
    const y = lines.length === 1 ? 104 : 90;
    const tspans = lines.map((l, k) => `<tspan x="420" dy="${k === 0 ? 0 : 30}">${esc(l)}</tspan>`).join('');
    const delay = (i * SLIDE).toFixed(2);
    return `<g class="s" style="animation-delay:${delay}s">
      <text x="30" y="76" font-size="12" letter-spacing="3" fill="${s.color}">▸ ${s.label}</text>
      <text x="420" y="${y}" text-anchor="middle" font-size="20" font-weight="700" fill="#e9e9ff">${tspans}</text>
      <text x="810" y="150" text-anchor="end" font-size="12" fill="#7f7fb0">${esc(it.meta)}</text>
    </g>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 172" width="840" height="172" fill="none" role="img" aria-label="transmission — Claude &amp; modern tech news, facts, hot takes">
  <title>rxit.os // transmission</title>
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
    <circle cx="30" cy="34" r="5" fill="#00f0ff" class="p"/>
    <text x="44" y="39" font-size="12" letter-spacing="3" fill="#00f0ff">◉ rxit.os // transmission</text>
    <text x="810" y="39" text-anchor="end" font-size="11" fill="#7f7fb0">Claude &amp; modern tech · auto-rotating</text>
    <line x1="20" y1="52" x2="820" y2="52" stroke="#2a2a55" stroke-opacity="0.5"/>
    ${slides}
    <rect x="7" y="7" width="826" height="158" rx="13" fill="none" stroke="url(#tedge)" stroke-width="1.3" opacity="0.85"/>
  </g>
</svg>
`;
}

const items = await collect();
mkdirSync('assets', { recursive: true });
writeFileSync('assets/transmission.svg', build(items));
console.log(`transmission built · ${items.length} slides ·`, items.map((i) => i.type).join(','));
