/**
 * Search engine setup, run after every build.
 * Writes a real HTML page for each route (title, description, link preview,
 * structured data, and a readable summary), plus sitemap.xml.
 * The React app still takes over as soon as the page loads.
 */
import fs from 'node:fs';
import path from 'node:path';
import { BUSINESSES, DEALS, type Deal } from '../src/data';

export const SITE = 'https://www.eventorytt.com';
const OG = `${SITE}/og-image.jpg`;
const TAGLINE = 'The best deals, sales and things to do in Trinidad & Tobago, all in one place.';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const abs = (u?: string) => (!u ? OG : u.startsWith('http') ? u : SITE + u);
const clip = (s: string, n = 155) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

interface Page { path: string; title: string; description: string; image?: string; jsonld?: object[]; body: string; noindex?: boolean }

const ORG = {
  '@context': 'https://schema.org', '@type': 'Organization', name: 'EventoryTT', url: SITE, logo: `${SITE}/icon-512.png`,
  areaServed: 'Trinidad and Tobago',
  sameAs: ['https://www.instagram.com/eventory_tt/', 'https://www.threads.net/@eventory_tt'],
};
const WEBSITE = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'EventoryTT', url: SITE };

function eventLd(d: Deal) {
  const hasPrice = Number.isFinite(d.price);
  // When the listing went up: offers are valid from then.
  const listed = new Date(); listed.setHours(0, 0, 0, 0); listed.setDate(listed.getDate() - d.added);
  const biz = BUSINESSES.find((b) => b.name === d.biz);
  const orgUrl = biz?.website ?? d.url ?? `${SITE}/deal/${d.id}`;
  const performers = (d.performer ?? d.biz).split(/,\s*/).map((name) => ({ '@type': 'PerformingGroup', name }));
  return {
    '@context': 'https://schema.org', '@type': 'Event', name: d.title, description: d.blurb,
    startDate: iso(d.eventDate!), endDate: iso(d.eventEnd ?? d.eventDate!),
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: d.area, address: { '@type': 'PostalAddress', streetAddress: d.address || d.area, addressCountry: 'TT' } },
    image: [abs(d.image)],
    organizer: { '@type': 'Organization', name: d.biz, url: orgUrl },
    performer: performers.length === 1 ? performers[0] : performers,
    offers: {
      '@type': 'Offer', url: d.url ?? `${SITE}/deal/${d.id}`, priceCurrency: 'TTD', ...(hasPrice ? { price: String(d.price) } : {}),
      availability: 'https://schema.org/InStock', validFrom: iso(listed),
    },
  };
}

function dealPage(d: Deal): Page {
  const isEvent = !!d.eventDate;
  const when = isEvent ? d.validity : d.endsLabel;
  const price = d.priceLabel && !/^(TICKETS|POP-UP|CRAFT)/.test(d.priceLabel) ? d.priceLabel : '';
  const desc = clip([price && `${price}.`, d.blurb, when && `${when}.`, isEvent ? d.area : `From ${d.biz}.`].filter(Boolean).join(' '));
  return {
    path: `/deal/${d.id}`,
    title: isEvent ? `${d.title} · ${d.validity.split(' · ')[0]} | EventoryTT` : `${d.title} at ${d.biz}${price ? ` · ${price}` : ''} | EventoryTT`,
    description: desc, image: d.image,
    jsonld: isEvent ? [eventLd(d)] : undefined,
    body: `<h1>${esc(d.title)}</h1><p>${esc(d.biz)}</p><p>${esc(d.blurb)}</p>${price ? `<p>${esc(price)}</p>` : ''}${when ? `<p>${esc(when)}</p>` : ''}<p>${esc(d.area)}</p><a href="${esc(d.url ?? "")}">${esc(d.action)}</a>`,
  };
}

const list = (ds: Deal[]) => `<ul>${ds.map((d) => `<li><a href="/deal/${d.id}">${esc(d.title)}</a> · ${esc(d.biz)} · ${esc(d.priceLabel)}</li>`).join('')}</ul>`;

export function writeSeo(outDir: string) {
  const deals = DEALS.filter((d) => !d.eventDate);
  const events = DEALS.filter((d) => d.eventDate).sort((a, b) => +a.eventDate! - +b.eventDate!);
  const pages: Page[] = [
    { path: '/', title: 'EventoryTT · Today’s best deals in T&T', description: TAGLINE, jsonld: [WEBSITE, ORG],
      body: `<h1>Today’s best deals in Trinidad &amp; Tobago</h1><p>${TAGLINE}</p>${list(deals)}` },
    { path: '/browse', title: 'All deals in Trinidad & Tobago | EventoryTT', description: `Browse ${deals.length} deals and sales from stores across Trinidad & Tobago. Filter by price, category and area.`,
      body: `<h1>All deals</h1>${list(deals)}` },
    { path: '/things', title: 'Things to do in Trinidad & Tobago: events calendar | EventoryTT',
      description: `Parang, concerts, tours and parties across Trinidad & Tobago. ${events.length} events coming up, in date order.`,
      body: `<h1>Things to do in Trinidad &amp; Tobago</h1><ul>${events.map((d) => `<li><a href="/deal/${d.id}">${esc(d.title)}</a> · ${esc(d.validity)} · ${esc(d.area)}</li>`).join('')}</ul>` },
    { path: '/directory', title: 'Business directory | EventoryTT', description: 'Stores and businesses in Trinidad & Tobago with deals on EventoryTT.', body: '<h1>Business directory</h1>' },
    { path: '/submit', title: 'List your deal for free | EventoryTT', description: 'Have a sale, offer or event in Trinidad & Tobago? Send it to EventoryTT and we’ll list it.', body: '<h1>List your deal</h1>' },
    { path: '/how-it-works', title: 'How it works: list your deal free | EventoryTT', description: 'List your deal or event on EventoryTT for free. Get your own deal page and a spot in search and on the events calendar. Featured plans from TT$100. Send it by form, WhatsApp or tag @eventory_tt.', body: '<h1>Your deal, in front of all of T&amp;T</h1><p>Put your sale, special or event where people in Trinidad &amp; Tobago look for things to buy and do. Free to list.</p>' },
    { path: '/privacy', title: 'Privacy | EventoryTT', description: 'What EventoryTT collects, why, and the choices you have.', body: '<h1>Privacy</h1><p>EventoryTT uses Google Analytics to count visits and see which deals are viewed and clicked. Saved deals stay on your device. We never sell personal information.</p>' },
    { path: '/saved', title: 'Saved deals | EventoryTT', description: TAGLINE, body: '<h1>Saved</h1>', noindex: true },
    ...DEALS.map(dealPage),
  ];

  const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  for (const p of pages) {
    const url = SITE + (p.path === '/' ? '/' : p.path);
    const head = [
      `<title>${esc(p.title)}</title>`,
      `<meta name="description" content="${esc(p.description)}" />`,
      `<link rel="canonical" href="${url}" />`,
      p.noindex ? '<meta name="robots" content="noindex" />' : '',
      `<meta property="og:site_name" content="EventoryTT" />`, `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${esc(p.title.replace(/ \| EventoryTT$/, ''))}" />`,
      `<meta property="og:description" content="${esc(p.description)}" />`,
      `<meta property="og:url" content="${url}" />`, `<meta property="og:image" content="${abs(p.image)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      ...(p.jsonld ?? []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
    ].filter(Boolean).join('\n    ');
    const html = template
      .replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, head)
      .replace('<div id="root"></div>', `<div id="root"><div class="boot" aria-hidden="true"><span class="boot-logo">EVENTORY<b>TT</b></span></div><main class="boot-text">${p.body}</main></div>`);
    // /deal/x is served from deal/x.html (Vercel cleanUrls).
    const file = p.path === '/' ? path.join(outDir, 'index.html') : path.join(outDir, `${p.path}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }

  const today = iso(new Date());
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter((p) => !p.noindex)
    .map((p) => `  <url><loc>${SITE}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
  return pages.length;
}
