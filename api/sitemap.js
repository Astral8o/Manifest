// /sitemap.xml: only pages that are indexable (enough inventory, not a
// duplicate of a parent page), generated from live data.
const SEO = require('../js/seo-core.js');
const { loadData } = require('./_data.js');

module.exports = async (req, res) => {
  const ix = SEO.build(await loadData());
  const urls = SEO.sitemapEntries(ix);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${SEO.esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.end(xml);
};
