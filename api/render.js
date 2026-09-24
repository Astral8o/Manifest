// Serves every page URL. Resolves the path against Eventory's data, then
// returns the app shell with that page's title, description, canonical,
// robots, Open Graph/Twitter tags, JSON-LD, and a crawlable HTML version of
// the page content. The app then opens on the same screen in the browser.
const fs = require('fs');
const path = require('path');
const SEO = require('../js/seo-core.js');
const { loadData } = require('./_data.js');

// Version our scripts per deploy so a browser never pairs a new page with an
// older cached /js/ file (they're cached for an hour).
const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 12);
const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8')
  .replace(/(<script src="\/js\/[^"?]+\.js)"/g, `$1?v=${BUILD}"`);
// Shown for every page while site_settings.coming_soon is on (switch it in
// /admin/). Visiting any page with ?preview=on sets a cookie that shows the
// real site to that browser; ?preview=off clears it.
const COMING_SOON = fs.readFileSync(path.join(__dirname, '..', 'coming-soon.html'), 'utf8');
const PREVIEW_COOKIE = 'ev_preview';
const esc = SEO.esc;

// Head tags owned by this function; the template's copies are removed first.
const OWNED_HEAD = /\s*<(?:title>[\s\S]*?<\/title>|meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>|link\s+rel="canonical"[^>]*>)/g;

function headTags(m) {
  const img = 'https://www.eventorytt.com/og-image.jpg';
  const ogImg = m.type === 'vendor' && m.vendor.photos && m.vendor.photos[0] ? m.vendor.photos[0]
    : m.type === 'post' && m.post.img_path ? SEO.abs(m.post.img_path) : img;
  const t = [
    `<title>${esc(m.title)}</title>`,
    m.description ? `<meta name="description" content="${esc(m.description)}">` : '',
    `<meta name="robots" content="${m.robots}">`,
    m.canonical ? `<link rel="canonical" href="${esc(m.canonical)}">` : '',
    `<meta property="og:site_name" content="Eventory">`,
    `<meta property="og:type" content="${m.type === 'post' ? 'article' : m.type === 'vendor' ? 'profile' : 'website'}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    m.description ? `<meta property="og:description" content="${esc(m.description)}">` : '',
    m.canonical ? `<meta property="og:url" content="${esc(m.canonical)}">` : '',
    `<meta property="og:image" content="${esc(ogImg)}">`,
    `<meta property="og:locale" content="en_TT">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    m.description ? `<meta name="twitter:description" content="${esc(m.description)}">` : '',
    `<meta name="twitter:image" content="${esc(ogImg)}">`,
    ...m.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ];
  return t.filter(Boolean).join('\n');
}

function render(data, pathname, query) {
  const ix = SEO.build(data);
  const route = SEO.resolve(ix, pathname);
  const m = SEO.page(ix, route, query);
  const boot = { route, state: SEO.appState(ix, route), data };
  let html = TEMPLATE.replace(OWNED_HEAD, '');
  html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1">',
    (s) => `${s}\n${headTags(m)}\n<link rel="preconnect" href="https://oiwjuvzsydhuhmetcuqk.supabase.co" crossorigin>` +
      // Browsers running JS get the app; the crawlable copy below is for everything else.
      `\n<script>document.documentElement.classList.add('js')</script><style>html.js #ev-ssr{display:none}</style>` +
      `\n<script>window.__EV_BOOT=${JSON.stringify(boot).replace(/</g, '\\u003c')}</script>`);
  html = html.replace(/<body([^>]*)>/, (s) => `${s}\n<div id="ev-ssr">${SEO.renderHtml(ix, m)}</div>`);
  // The design runtime's {{ }} templates are meaningless to crawlers: keep
  // them in an inert <template> and put them back in place before it runs.
  html = html.replace('<x-dc>', '<template id="ev-app"><x-dc>').replace('</x-dc>',
    '</x-dc></template>\n<script>(function(t){t.replaceWith(t.content)})(document.getElementById("ev-app"))</script>');
  return { status: m.status, robots: m.robots, html };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://www.eventorytt.com');
  const pathname = url.searchParams.get('__p') || url.pathname;
  url.searchParams.delete('__p');
  const query = Object.fromEntries(url.searchParams);
  let data;
  try {
    data = await loadData();
  } catch (e) {
    console.error('[render] data load failed', e);
    // Serve the plain app shell rather than an error page; the browser
    // loads its data itself, and crawlers retry.
    res.statusCode = 503;
    res.setHeader('Retry-After', '120');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(TEMPLATE);
  }
  if (data.settings && data.settings.coming_soon === true) {
    const cookies = req.headers.cookie || '';
    let preview = new RegExp('(?:^|;\\s*)' + PREVIEW_COOKIE + '=1').test(cookies);
    if (query.preview === 'on' || query.preview === 'off') {
      preview = query.preview === 'on';
      res.setHeader('Set-Cookie', `${PREVIEW_COOKIE}=${preview ? '1; Max-Age=2592000' : '; Max-Age=0'}; Path=/; Secure; SameSite=Lax`);
      delete query.preview;
    }
    // Never cached at the edge while the switch is on: the answer depends
    // on the cookie, and flipping the switch should take effect at once.
    res.setHeader('Cache-Control', 'private, no-store');
    if (!preview) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      return res.end(COMING_SOON);
    }
    const out = render(data, pathname, query);
    res.statusCode = out.status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.end(out.html);
  }
  const out = render(data, pathname, query);
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (out.robots.indexOf('noindex') >= 0) res.setHeader('X-Robots-Tag', out.robots);
  res.setHeader('Cache-Control', out.status === 200 ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' : 'public, max-age=0, s-maxage=60');
  res.end(out.html);
};
module.exports.render = render;
