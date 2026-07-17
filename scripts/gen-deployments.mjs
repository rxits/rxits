// Generates one clickable "deployment tile" SVG per live product into assets/dep/.
// Each tile is wrapped in a link in the README, so clicking opens the live site.
// No dependencies (Node 20+). Run: node scripts/gen-deployments.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const PRODUCTS = [
  { slug: 'nyelizabeth', name: 'NY Elizabeth', tag: 'real-time auctions', accent: '#ff2ee6' },
  { slug: 'salesclawd',  name: 'SalesClawd',   tag: 'autonomous agents', accent: '#39ff14' },
  { slug: 'artindex',    name: 'Art Index',    tag: 'art marketplace',   accent: '#00f0ff' },
  { slug: 'aumiqx',      name: 'Aumiqx',       tag: 'the company',       accent: '#ff2d6f' },
  { slug: 'airup',       name: 'air-up',       tag: '€200M DTC brand',   accent: '#00f0ff' },
  { slug: 'beast',       name: 'Beast',        tag: 'Cannes Lions studio', accent: '#ff2ee6' },
  { slug: 'yoginii',     name: 'Yoginii',      tag: 'wellness platform', accent: '#39ff14' },
  { slug: 'rockport',    name: 'Rockport IN',  tag: 'footwear commerce', accent: '#ffb020' },
];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tile = (p) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 116" width="400" height="116" fill="none" role="img" aria-label="${esc(p.name)} — live">
  <title>${esc(p.name)} — open live site</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e0e22"/><stop offset="1" stop-color="#120a1e"/></linearGradient>
    <clipPath id="c"><rect x="4" y="4" width="392" height="108" rx="14"/></clipPath>
    <style>
      text{ font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace }
      .dot{ animation:b 1.7s ease-in-out infinite } @keyframes b{0%,100%{opacity:1}50%{opacity:.3}}
      @media (prefers-reduced-motion:reduce){ .dot{animation:none} }
    </style>
  </defs>
  <g clip-path="url(#c)">
    <rect x="4" y="4" width="392" height="108" rx="14" fill="url(#bg)"/>
    <circle cx="30" cy="34" r="6" fill="#39ff14" class="dot"/>
    <text x="48" y="40" font-size="12" letter-spacing="2" fill="#39ff14">LIVE</text>
    <text x="392" y="40" text-anchor="end" font-size="12" fill="#7f7fb0">200 · OK</text>
    <text x="26" y="76" font-size="24" font-weight="700" fill="#e9e9ff">${esc(p.name)}</text>
    <text x="26" y="98" font-size="13" fill="#7f7fb0">${esc(p.tag)}</text>
    <text x="392" y="98" text-anchor="end" font-size="13" fill="${p.accent}">open ↗</text>
    <rect x="5" y="5" width="390" height="106" rx="13" fill="none" stroke="${p.accent}" stroke-width="1.4" opacity="0.85"/>
  </g>
</svg>
`;

mkdirSync('assets/dep', { recursive: true });
for (const p of PRODUCTS) writeFileSync(`assets/dep/${p.slug}.svg`, tile(p));
console.log(`generated ${PRODUCTS.length} deployment tiles`);
