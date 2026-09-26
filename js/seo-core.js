// Eventory SEO core. Shared by the browser (js/eventory-data.js + page
// script) and the Vercel render function (api/render.js), so URLs, titles,
// descriptions, related links, index/noindex decisions and structured data
// are defined once and always agree with what the page shows.
//
// Input `data` is the raw public rows from Supabase:
//   { categories, events, locations, vendors (with .packages), posts }
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EventorySEO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SITE = 'https://www.eventorytt.com';
  var REGION = 'Trinidad & Tobago';

  // Minimum vendor inventory before a landing page is indexable. Below this
  // the page still works for visitors but is noindex and left out of the
  // sitemap, so Eventory never publishes empty or near-empty listing pages.
  var MIN = { category: 1, event: 2, eventCategory: 3, categoryLocation: 3, location: 3, section: 1 };

  var SECTIONS = ['Planning Guides', 'Vendor Guides', 'Event Types', 'Local Guides', 'Vendor Spotlights', 'Real Events'];
  var ISLANDS = [{ slug: 'trinidad', name: 'Trinidad' }, { slug: 'tobago', name: 'Tobago' }];
  // App screens that are personal or transactional: never indexed.
  var APP_PATHS = { plan: 'plan', saved: 'saved', join: 'join', 'sign-in': 'auth', account: 'account', inbox: 'inbox', inquire: 'inquire' };

  function slugify(s) { return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function cap(s) { return String(s || '').replace(/(^|\s)([a-z0-9])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\b(Or|And|Of|In)\b/g, function (w) { return w.toLowerCase(); }); }
  function listText(a) { a = a.filter(Boolean); return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function clip(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function abs(p) { return /^https?:/.test(p || '') ? p : SITE + (p && p[0] === '/' ? p : '/' + (p || '')); }

  // ---- Indexes over the data ------------------------------------------------
  function build(data) {
    var ix = {
      data: data, cat: {}, catSeo: {}, catCombo: {}, ev: {}, evSeo: {}, loc: {}, locByName: {}, vendor: {}, post: {}, section: {},
    };
    (data.categories || []).forEach(function (c) { ix.cat[c.id] = c; ix.catSeo[c.seo_slug] = c; ix.catCombo[c.combo_slug] = c; });
    (data.events || []).forEach(function (e) { ix.ev[e.id] = e; if (e.seo_slug) ix.evSeo[e.seo_slug] = e; });
    (data.locations || []).forEach(function (l) { ix.loc[l.slug] = l; ix.locByName[l.name.toLowerCase()] = l; });
    ISLANDS.forEach(function (i) { ix.loc[i.slug] = { slug: i.slug, name: i.name, island: i.name, isIsland: true }; });
    ix.vendorById = {};
    (data.vendors || []).forEach(function (v) { ix.vendor[v.slug] = v; ix.vendorById[v.id] = v; });
    (data.posts || []).forEach(function (p) { ix.post[p.id] = p; });
    SECTIONS.forEach(function (s) { ix.section[slugify(s)] = s; });
    ix.evSeoKeys = Object.keys(ix.evSeo).sort(function (a, b) { return b.length - a.length; });
    return ix;
  }

  // Where a vendor is based, from its own location text. Island comes from
  // the locations table; unknown place names are shown as written, never guessed.
  function vendorPlace(ix, v) {
    var raw = (v.location || '').trim();
    var l = ix.locByName[raw.toLowerCase()];
    if (l) return { town: l.name.replace(/, Tobago$/, ''), townSlug: l.slug, island: l.island };
    if (/tobago/i.test(raw)) return { town: raw, townSlug: null, island: 'Tobago' };
    return raw ? { town: raw, townSlug: null, island: null } : null;
  }
  function placeLabel(p) { return !p ? '' : (p.island && p.town !== p.island ? p.town + ', ' + p.island : p.town); }
  function vendorCats(v) { return [v.category_id].concat(v.also_categories || []); }
  function inLoc(ix, v, locSlug) {
    if (!locSlug) return true;
    var p = vendorPlace(ix, v); if (!p) return false;
    var l = ix.loc[locSlug];
    if (l && l.isIsland) return p.island === l.name;
    return p.townSlug === locSlug || (v.location || '') === locSlug;
  }
  // Natural-language search: "birthday caterer", "decorator in Chaguanas",
  // "lighting for a product launch". Picks out a category, an event type and
  // a place from the words; whatever is left is matched against vendor text.
  var CAT_WORDS = {
    photography: 'photographer photography photo photos photoshoot pictures',
    videography: 'videographer videography video videos film films filming drone',
    catering: 'caterer catering cater food chef buffet',
    decor: 'decorator decorators decor décor decoration decorations balloon balloons backdrop styling stylist',
    venues: 'venue venues hall halls ballroom banquet',
    entertainment: 'dj djs mc mcs band bands music musician entertainment entertainer sound',
    cakes: 'cake cakes baker bakers bakery cupcake cupcakes dessert desserts',
    florals: 'florist florists flower flowers floral florals bouquet bouquets',
    rentals: 'rental rentals rent tent tents chair chairs table tables linen linens staging',
    makeup: 'makeup make-up mua hair hairstylist hairdresser glam',
    planning: 'planner planners planning coordinator coordinators coordination',
    bar: 'bar bars bartender bartenders bartending drinks cocktail cocktails mixologist',
  };
  var EVENT_WORDS = {
    weddings: 'wedding weddings bridal bride', birthdays: 'birthday birthdays', corporate: 'corporate company office staff business',
    christenings: 'christening christenings baptism', sports: '5k 10k race races marathon sports run fun-run', launches: 'launch launches',
    family: 'family', religious: 'religious church puja eid diwali', fetes: 'fete fetes', conferences: 'conference conferences seminar summit',
    graduations: 'graduation graduations grad', community: 'community festival', private: 'private anniversary dinner',
  };
  var STOP = ' a an and at for from i in me my near need needed of on or our please the to we with looking find discover event events vendor vendors service services someone best good ';
  function wordsOf(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ'-]+/g, ' ').trim().split(/\s+/).filter(Boolean); }
  function lookup(table) {
    var m = {}; Object.keys(table).forEach(function (id) { table[id].split(' ').forEach(function (w) { m[w] = id; }); }); return m;
  }
  var CAT_BY_WORD = lookup(CAT_WORDS), EVENT_BY_WORD = lookup(EVENT_WORDS);
  function parseQuery(ix, q) {
    var text = ' ' + wordsOf(q).join(' ') + ' ', out = { cat: '', event: '', loc: '', words: [] };
    if (!text.trim()) return out;
    // Places first, longest names first ("port of spain" before "spain").
    var locs = (ix.data.locations || []).map(function (l) { return { slug: l.slug, name: wordsOf(l.name.replace(/, Tobago$/, '')).join(' ') }; })
      .concat([{ slug: 'trinidad', name: 'trinidad' }, { slug: 'tobago', name: 'tobago' }])
      .sort(function (a, b) { return b.name.length - a.name.length; });
    for (var i = 0; i < locs.length; i++) {
      if (locs[i].name && text.indexOf(' ' + locs[i].name + ' ') >= 0 && ix.loc[locs[i].slug]) { out.loc = locs[i].slug; text = text.replace(' ' + locs[i].name + ' ', ' '); break; }
    }
    if (/ product launch(es)? /.test(text)) { out.event = 'launches'; text = text.replace(/ product launch(es)? /, ' '); }
    if (/ family days? /.test(text)) { out.event = 'family'; text = text.replace(/ family days? /, ' '); }
    if (/ make ?up artists? /.test(text)) { out.cat = 'makeup'; text = text.replace(/ make ?up artists? /, ' '); }
    text.trim().split(/\s+/).filter(Boolean).forEach(function (w) {
      var sing = w.replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1');
      var c = CAT_BY_WORD[w] || CAT_BY_WORD[sing], e = EVENT_BY_WORD[w] || EVENT_BY_WORD[sing];
      if (c && !out.cat && ix.cat[c]) return void (out.cat = c);
      if (e && !out.event && ix.ev[e]) return void (out.event = e);
      if (c || e || STOP.indexOf(' ' + w + ' ') >= 0) return;
      out.words.push(sing.length >= 3 ? sing : w);
    });
    return out;
  }
  function vendorsFor(ix, f) {
    return (ix.data.vendors || []).filter(function (v) {
      return (!f.cat || vendorCats(v).indexOf(f.cat) >= 0) && (!f.event || (v.events || []).indexOf(f.event) >= 0) && inLoc(ix, v, f.loc);
    });
  }
  function postsFor(ix, f) {
    return (ix.data.posts || []).filter(function (p) {
      return (f.cat && (p.category_ids || []).indexOf(f.cat) >= 0) || (f.event && (p.event_type_ids || []).indexOf(f.event) >= 0) || (f.vendor && (p.vendor_slugs || []).indexOf(f.vendor) >= 0);
    });
  }

  // ---- URLs -----------------------------------------------------------------
  var path = {
    home: function () { return '/'; },
    vendors: function () { return '/vendors/'; },
    vendor: function (slug) { return '/vendors/' + slug + '/'; },
    category: function (ix, id) { return '/' + ix.cat[id].seo_slug + '/'; },
    event: function (ix, id) { return ix.ev[id] && ix.ev[id].seo_slug ? '/' + ix.ev[id].seo_slug + '-vendors/' : '/vendors/'; },
    eventCategory: function (ix, ev, cat) { return ix.ev[ev] && ix.ev[ev].seo_slug ? '/' + ix.ev[ev].seo_slug + '-' + ix.cat[cat].combo_slug + '/' : path.category(ix, cat); },
    categoryLocation: function (ix, cat, loc) { return '/' + ix.cat[cat].seo_slug + '/' + loc + '/'; },
    location: function (loc) { return '/locations/' + loc + '/'; },
    magazine: function () { return '/magazine/'; },
    section: function (name) { return '/magazine/topics/' + slugify(name) + '/'; },
    post: function (id) { return '/magazine/' + id + '/'; },
  };

  function resolve(ix, pathname) {
    var p = decodeURIComponent(String(pathname || '/')).toLowerCase().replace(/\/+$/, '');
    var seg = p.split('/').filter(Boolean);
    if (!seg.length) return { type: 'home' };
    if (seg.length === 1 && APP_PATHS[seg[0]]) return { type: 'app', view: APP_PATHS[seg[0]] };
    if (seg[0] === 'vendors') {
      if (seg.length === 1) return { type: 'vendors' };
      if (seg.length === 2 && ix.vendor[seg[1]]) return { type: 'vendor', slug: seg[1] };
      return { type: 'notfound' };
    }
    if (seg[0] === 'magazine') {
      if (seg.length === 1) return { type: 'magazine' };
      if (seg.length === 3 && seg[1] === 'topics' && ix.section[seg[2]]) return { type: 'section', section: ix.section[seg[2]] };
      if (seg.length === 2 && ix.post[seg[1]]) return { type: 'post', id: seg[1] };
      return { type: 'notfound' };
    }
    if (seg[0] === 'locations' && seg.length === 2 && ix.loc[seg[1]]) return { type: 'location', loc: seg[1] };
    var c = ix.catSeo[seg[0]];
    if (c && seg.length === 1) return { type: 'category', cat: c.id };
    if (c && seg.length === 2 && ix.loc[seg[1]]) return { type: 'categoryLocation', cat: c.id, loc: seg[1] };
    if (seg.length === 1) {
      for (var i = 0; i < ix.evSeoKeys.length; i++) {
        var k = ix.evSeoKeys[i];
        if (seg[0] === k + '-vendors') return { type: 'event', event: ix.evSeo[k].id };
        if (seg[0].indexOf(k + '-') === 0 && ix.catCombo[seg[0].slice(k.length + 1)]) return { type: 'eventCategory', event: ix.evSeo[k].id, cat: ix.catCombo[seg[0].slice(k.length + 1)].id };
      }
    }
    return { type: 'notfound' };
  }

  // The app's screen state for a route (used to open the right screen on load).
  function appState(ix, r) {
    switch (r.type) {
      case 'vendors': return { view: 'browse', browse: { mode: 'cat', event: '', cat: '', loc: '', q: '' } };
      case 'category': return { view: 'browse', browse: { mode: 'cat', event: '', cat: r.cat, loc: '', q: '' } };
      case 'event': return { view: 'browse', browse: { mode: 'event', event: r.event, cat: '', loc: '', q: '' } };
      case 'eventCategory': return { view: 'browse', browse: { mode: 'event', event: r.event, cat: r.cat, loc: '', q: '' } };
      case 'categoryLocation': return { view: 'browse', browse: { mode: 'cat', event: '', cat: r.cat, loc: r.loc, q: '' } };
      case 'location': return { view: 'browse', browse: { mode: 'cat', event: '', cat: '', loc: r.loc, q: '' } };
      case 'vendor': return { view: 'profile', vendorId: r.slug };
      case 'magazine': return { view: 'blog', blogTag: '' };
      case 'section': return { view: 'blog', blogTag: r.section };
      case 'post': return { view: 'post', postId: r.id };
      case 'app': return { view: r.view };
      default: return { view: 'home' };
    }
  }

  // Path for the app's current screen. Filter combinations without a clean
  // landing page keep their base path and carry the rest as query params
  // (those URLs are noindex, canonical to the base).
  function pathForState(ix, s) {
    if (s.view === 'profile' && s.vendorId && ix.vendor[s.vendorId]) return path.vendor(s.vendorId);
    if (s.view === 'post' && s.postId && ix.post[s.postId]) return path.post(s.postId);
    if (s.view === 'blog') return s.blogTag && SECTIONS.indexOf(s.blogTag) >= 0 ? path.section(s.blogTag) : path.magazine();
    if (s.view === 'browse') {
      var b = s.browse || {}, q = [];
      var loc = b.loc ? (ix.loc[b.loc] ? b.loc : (ix.locByName[String(b.loc).toLowerCase()] || {}).slug) : '';
      var base;
      if (b.cat && ix.cat[b.cat] && b.event && ix.ev[b.event]) { base = path.eventCategory(ix, b.event, b.cat); if (loc) q.push('loc=' + loc); }
      else if (b.cat && ix.cat[b.cat]) base = loc ? path.categoryLocation(ix, b.cat, loc) : path.category(ix, b.cat);
      else if (b.event && ix.ev[b.event]) { base = path.event(ix, b.event); if (loc) q.push('loc=' + loc); }
      else base = loc ? path.location(loc) : path.vendors();
      if (b.q) q.push('q=' + encodeURIComponent(b.q));
      return base + (q.length ? '?' + q.join('&') : '');
    }
    for (var k in APP_PATHS) if (APP_PATHS[k] === s.view) return '/' + k + '/';
    return '/';
  }

  // ---- Page models ----------------------------------------------------------
  function crumbs(list) { return [{ name: 'Eventory', path: '/' }].concat(list); }
  function catLink(ix, id) { var c = ix.cat[id]; return { label: c.plural, path: path.category(ix, id), count: vendorsFor(ix, { cat: id }).length }; }
  function evLink(ix, id) { var e = ix.ev[id]; return { label: e.label, path: path.event(ix, id), count: vendorsFor(ix, { event: id }).length }; }
  function indexableCombo(ix, ev, cat) { return vendorsFor(ix, { event: ev, cat: cat }).length >= MIN.eventCategory; }
  function indexableCatLoc(ix, cat, loc) { var n = vendorsFor(ix, { cat: cat, loc: loc }).length; return n >= MIN.categoryLocation && n < vendorsFor(ix, { cat: cat }).length; }
  // Link to the most specific page that is worth indexing.
  function bestCatPath(ix, ev, cat) { return ev && ix.ev[ev] && ix.ev[ev].seo_slug && indexableCombo(ix, ev, cat) ? path.eventCategory(ix, ev, cat) : path.category(ix, cat); }
  function locLinks(ix, filter, pathFn) {
    var seen = {}, out = [];
    vendorsFor(ix, filter).forEach(function (v) {
      var p = vendorPlace(ix, v); if (!p) return;
      [p.townSlug, p.island && slugify(p.island)].forEach(function (s) {
        if (!s || seen[s] || !ix.loc[s]) return; seen[s] = 1;
        var n = vendorsFor(ix, Object.assign({}, filter, { loc: s })).length;
        out.push({ label: ix.loc[s].name, slug: s, count: n, path: pathFn(s), indexable: pathFn.check ? pathFn.check(s) : false });
      });
    });
    return out.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label); });
  }
  function postCard(p) { return { id: p.id, title: p.title, excerpt: p.excerpt, section: p.section, img: p.img_path, path: path.post(p.id), read: p.read_label }; }
  function vendorCard(ix, v) { var c = ix.cat[v.category_id]; return { slug: v.slug, name: v.name, path: path.vendor(v.slug), category: c ? c.singular : '', place: placeLabel(vendorPlace(ix, v)), tagline: v.tagline }; }

  function vendorFacts(ix, v) {
    var place = vendorPlace(ix, v), c = ix.cat[v.category_id];
    var cats = vendorCats(v).filter(function (id) { return ix.cat[id]; });
    var evs = (v.events || []).filter(function (e) { return ix.ev[e]; }).map(function (e) { return ix.ev[e].label; });
    var pk = v.packages || [];
    var facts = [];
    facts.push({ k: 'Category', v: cats.map(function (id) { return ix.cat[id].plural; }).join(', ') });
    if (place) facts.push({ k: 'Based in', v: placeLabel(place) });
    if ((v.areas_served || []).length) facts.push({ k: 'Areas served', v: v.areas_served.join(', ') });
    if (evs.length) facts.push({ k: 'Event types', v: evs.join(', ') });
    if (pk.length) facts.push({ k: 'Services', v: pk.map(function (p) { return p.name; }).join(', ') });
    if ((v.specialties || []).length) facts.push({ k: 'Specialties', v: v.specialties.join(', ') });
    if (v.from_label && !/on request/i.test(v.from_label)) facts.push({ k: 'Packages from', v: v.from_label });
    if (v.reply_label) facts.push({ k: 'Usually replies', v: v.reply_label });
    if (v.website) facts.push({ k: 'Website', v: v.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: /^https?:/.test(v.website) ? v.website : 'https://' + v.website });
    // One factual sentence assembled from the structured fields, so every
    // profile has a unique, accurate summary without copying outside text.
    var s = v.name + ' is ' + (c ? (/^[aeiou]/i.test(c.singular) ? 'an ' : 'a ') + c.singular : 'an event business') + (place ? ' based in ' + placeLabel(place) : '') + '.';
    if (evs.length) s += ' They work on ' + listText(evs.map(function (e) { return e.split(' ').map(function (w) { return /\d/.test(w) ? w : w.toLowerCase(); }).join(' '); })) + '.';
    if (pk.length) s += ' Their Eventory profile lists ' + pk.length + (pk.length === 1 ? ' package' : ' packages') + (v.from_label && !/on request/i.test(v.from_label) ? ', starting from ' + v.from_label : '') + '.';
    s += ' Planners can contact ' + v.name + ' directly through Eventory with an inquiry.';
    return { facts: facts, summary: s };
  }

  function page(ix, r, query) {
    var m = { type: r.type, status: 200, robots: 'index,follow', breadcrumbs: [], faqs: [], vendors: [], articles: [], related: [], jsonld: [] };
    // Only Eventory's own filters make a different listing; tracking and
    // other parameters (utm_*, fbclid, gclid...) are handled by the canonical.
    var hasQuery = !!(query && (query.q || query.loc));
    var place, c, e, l, n, list;
    switch (r.type) {
      case 'home':
        m.path = '/';
        m.title = 'Eventory: Discover Event Vendors in Trinidad & Tobago';
        m.h1 = 'Discover the people behind your event.';
        m.description = 'Discover and contact event vendors across Trinidad & Tobago: venues, caterers, photographers, decorators, DJs and more, for weddings, fetes, corporate events and every other kind of event.';
        m.vendors = (ix.data.vendors || []).slice();
        m.related = [
          { title: 'Browse by vendor type', links: (ix.data.categories || []).map(function (x) { return catLink(ix, x.id); }).filter(function (x) { return x.count; }) },
          { title: 'Browse by event', links: (ix.data.events || []).filter(function (x) { return x.seo_slug; }).map(function (x) { return evLink(ix, x.id); }).filter(function (x) { return x.count; }) },
        ];
        m.articles = (ix.data.posts || []).slice(0, 3).map(postCard);
        break;
      case 'vendors':
        m.path = path.vendors();
        m.title = 'Event Vendors in Trinidad & Tobago | Eventory';
        m.h1 = 'Event vendors in Trinidad & Tobago';
        m.description = 'Browse every event vendor listed on Eventory, from venues and caterers to photographers, decorators and entertainment.';
        m.vendors = (ix.data.vendors || []).slice();
        m.breadcrumbs = crumbs([{ name: 'Vendors', path: m.path }]);
        m.related = [{ title: 'Vendor types', links: (ix.data.categories || []).map(function (x) { return catLink(ix, x.id); }).filter(function (x) { return x.count; }) }];
        break;
      case 'category':
        c = ix.cat[r.cat]; list = vendorsFor(ix, { cat: c.id });
        m.path = path.category(ix, c.id);
        m.h1 = c.plural + ' in ' + REGION;
        m.title = c.plural + ' in ' + REGION + ' | Eventory';
        m.description = clip(c.intro || ('Discover ' + c.plural.toLowerCase() + ' for events in ' + REGION + ' on Eventory.'), 158);
        m.intro = c.intro; m.faqs = c.faqs || []; m.vendors = list;
        if (list.length < MIN.category) m.robots = 'noindex,follow';
        m.breadcrumbs = crumbs([{ name: 'Vendors', path: path.vendors() }, { name: c.plural, path: m.path }]);
        m.related = [
          { title: c.plural + ' by event', links: (ix.data.events || []).filter(function (x) { return x.seo_slug && vendorsFor(ix, { cat: c.id, event: x.id }).length; }).map(function (x) { return { label: x.label, path: bestCatPath(ix, x.id, c.id), count: vendorsFor(ix, { cat: c.id, event: x.id }).length }; }) },
          { title: 'Where they are based', links: locLinks(ix, { cat: c.id }, Object.assign(function (s) { return path.categoryLocation(ix, c.id, s); }, { check: function (s) { return indexableCatLoc(ix, c.id, s); } })).filter(function (x) { return x.indexable; }) },
          { title: 'Often booked with', links: relatedCats(ix, c.id).map(function (id) { return catLink(ix, id); }).filter(function (x) { return x.count; }) },
        ];
        m.articles = postsFor(ix, { cat: c.id }).map(postCard);
        break;
      case 'event':
        e = ix.ev[r.event]; list = vendorsFor(ix, { event: e.id });
        m.path = path.event(ix, e.id);
        m.h1 = cap(e.noun) + ' vendors in ' + REGION;
        m.title = cap(e.noun) + ' Vendors in ' + REGION + ' | Eventory';
        m.description = clip(e.intro || ('Discover vendors for your ' + e.noun + ' in ' + REGION + ' on Eventory.'), 158);
        m.intro = e.intro; m.faqs = e.faqs || []; m.vendors = list;
        if (list.length < MIN.event) m.robots = 'noindex,follow';
        m.breadcrumbs = crumbs([{ name: 'Vendors', path: path.vendors() }, { name: e.label, path: m.path }]);
        // What this event usually needs, in the event's own order.
        m.related = [{ title: 'What a ' + e.noun + ' usually needs', links: (e.needs || []).filter(function (id) { return ix.cat[id]; }).map(function (id) {
          var n2 = vendorsFor(ix, { event: e.id, cat: id }).length;
          return { label: ix.cat[id].plural, path: bestCatPath(ix, e.id, id), count: n2 };
        }) }];
        m.articles = postsFor(ix, { event: e.id }).map(postCard);
        break;
      case 'eventCategory':
        e = ix.ev[r.event]; c = ix.cat[r.cat]; list = vendorsFor(ix, { event: e.id, cat: c.id });
        m.path = path.eventCategory(ix, e.id, c.id);
        m.h1 = cap(e.noun) + ' ' + c.plural.replace(/^Event /, '') + ' in ' + REGION;
        m.title = m.h1 + ' | Eventory';
        m.description = clip('Compare ' + c.plural.toLowerCase() + ' who work on ' + e.noun + 's in ' + REGION + '. ' + (c.intro || ''), 158);
        m.intro = c.intro + (e.intro ? ' ' + e.intro : '');
        m.faqs = (c.faqs || []).concat(e.faqs || []); m.vendors = list;
        if (list.length < MIN.eventCategory) m.robots = 'noindex,follow';
        m.breadcrumbs = crumbs([{ name: e.label, path: path.event(ix, e.id) }, { name: cap(e.noun) + ' ' + c.plural.replace(/^Event /, ''), path: m.path }]);
        m.related = [
          { title: 'More for your ' + e.noun, links: (e.needs || []).filter(function (id) { return id !== c.id && ix.cat[id] && vendorsFor(ix, { event: e.id, cat: id }).length; }).map(function (id) { return { label: ix.cat[id].plural, path: bestCatPath(ix, e.id, id), count: vendorsFor(ix, { event: e.id, cat: id }).length }; }) },
          { title: 'All ' + c.plural.toLowerCase(), links: [catLink(ix, c.id)] },
        ];
        m.articles = postsFor(ix, { cat: c.id, event: e.id }).map(postCard);
        break;
      case 'categoryLocation':
        c = ix.cat[r.cat]; l = ix.loc[r.loc]; list = vendorsFor(ix, { cat: c.id, loc: l.slug });
        m.path = path.categoryLocation(ix, c.id, l.slug);
        m.h1 = c.plural + ' in ' + l.name.replace(/, Tobago$/, '');
        m.title = m.h1 + ' | Eventory';
        m.description = clip('Event ' + c.plural.toLowerCase() + ' based in ' + l.name + ', ' + REGION + '. Compare packages and send an inquiry on Eventory.', 158);
        m.intro = c.intro; m.faqs = []; m.vendors = list;
        if (list.length < MIN.categoryLocation) m.robots = 'noindex,follow';
        else if (list.length >= vendorsFor(ix, { cat: c.id }).length) m.canonical = path.category(ix, c.id); // same list as the parent page
        m.breadcrumbs = crumbs([{ name: c.plural, path: path.category(ix, c.id) }, { name: l.name, path: m.path }]);
        m.related = [{ title: 'All ' + c.plural.toLowerCase(), links: [catLink(ix, c.id)] }];
        break;
      case 'location':
        l = ix.loc[r.loc]; list = vendorsFor(ix, { loc: l.slug });
        m.path = path.location(l.slug);
        m.h1 = 'Event vendors in ' + l.name.replace(/, Tobago$/, '');
        m.title = m.h1 + ' | Eventory';
        m.description = clip('Event vendors based in ' + l.name + ': browse their profiles and packages and send an inquiry on Eventory.', 158);
        m.vendors = list;
        if (list.length < MIN.location) m.robots = 'noindex,follow';
        else if (list.length >= (ix.data.vendors || []).length) m.canonical = path.vendors();
        m.breadcrumbs = crumbs([{ name: 'Vendors', path: path.vendors() }, { name: l.name, path: m.path }]);
        m.related = [{ title: 'Vendor types in ' + l.name, links: (ix.data.categories || []).map(function (x) { var k = vendorsFor(ix, { cat: x.id, loc: l.slug }).length; return k ? { label: x.plural, path: indexableCatLoc(ix, x.id, l.slug) ? path.categoryLocation(ix, x.id, l.slug) : path.category(ix, x.id), count: k } : null; }).filter(Boolean) }];
        break;
      case 'vendor':
        var v = ix.vendor[r.slug]; c = ix.cat[v.category_id]; place = vendorPlace(ix, v);
        var vf = vendorFacts(ix, v);
        m.path = path.vendor(v.slug);
        m.h1 = v.name;
        m.title = v.name + ' | ' + (c ? cap(c.singular) : 'Event vendor') + (place ? ' in ' + place.town : '') + ' | Eventory';
        m.description = clip((v.tagline && v.tagline.length > 40 ? v.tagline + ' ' : '') + vf.summary, 158);
        m.intro = vf.summary; m.facts = vf.facts; m.vendor = v;
        // Thin profiles (no real description and nothing to book) stay out of the index.
        if (!((v.about || '').length >= 80 || (v.tagline || '').length >= 40) || !((v.packages || []).length || (v.photos || []).length)) m.robots = 'noindex,follow';
        m.breadcrumbs = crumbs([{ name: c ? c.plural : 'Vendors', path: c ? path.category(ix, c.id) : path.vendors() }, { name: v.name, path: m.path }]);
        var sim = vendorsFor(ix, { cat: v.category_id }).filter(function (x) { return x.slug !== v.slug; });
        if (!sim.length) sim = (ix.data.vendors || []).filter(function (x) { return x.slug !== v.slug && (x.events || []).some(function (ev) { return (v.events || []).indexOf(ev) >= 0; }); });
        m.vendors = sim.slice(0, 3);
        m.related = [
          { title: 'Categories', links: vendorCats(v).filter(function (id) { return ix.cat[id]; }).map(function (id) { return catLink(ix, id); }) },
          { title: 'Events they work on', links: (v.events || []).filter(function (id) { return ix.ev[id] && ix.ev[id].seo_slug; }).map(function (id) { return { label: ix.ev[id].label, path: bestCatPath(ix, id, v.category_id) }; }) },
        ];
        if (place && place.townSlug && indexableCatLoc(ix, v.category_id, place.townSlug)) m.related.push({ title: 'Nearby', links: [{ label: c.plural + ' in ' + place.town, path: path.categoryLocation(ix, v.category_id, place.townSlug) }] });
        m.articles = postsFor(ix, { vendor: v.slug, cat: v.category_id }).slice(0, 3).map(postCard);
        break;
      case 'magazine':
        m.path = path.magazine();
        m.h1 = 'Eventory Magazine';
        m.title = 'Eventory Magazine: Event Planning Guides for Trinidad & Tobago';
        m.description = 'Planning guides, vendor guides and vendor spotlights for weddings, fetes, corporate events and every other kind of event in Trinidad & Tobago.';
        m.intro = 'Planning guides, vendor guides and stories from events across Trinidad & Tobago.';
        m.articles = (ix.data.posts || []).map(postCard);
        m.breadcrumbs = crumbs([{ name: 'Magazine', path: m.path }]);
        m.related = [{ title: 'Sections', links: SECTIONS.map(function (s) { var k = (ix.data.posts || []).filter(function (p) { return p.section === s; }).length; return k ? { label: s, path: path.section(s), count: k } : null; }).filter(Boolean) }];
        break;
      case 'section':
        list = (ix.data.posts || []).filter(function (p) { return p.section === r.section; });
        m.path = path.section(r.section);
        m.h1 = r.section;
        m.title = r.section + ' | Eventory Magazine';
        m.description = clip(r.section + ' from Eventory Magazine: practical articles for planning events in Trinidad & Tobago.', 158);
        m.articles = list.map(postCard);
        if (list.length < MIN.section) m.robots = 'noindex,follow';
        m.breadcrumbs = crumbs([{ name: 'Magazine', path: path.magazine() }, { name: r.section, path: m.path }]);
        break;
      case 'post':
        var p = ix.post[r.id];
        m.path = path.post(p.id);
        m.h1 = p.title; m.post = p;
        m.title = p.title + ' | Eventory Magazine';
        m.description = clip(p.excerpt, 158);
        m.faqs = p.faqs || [];
        m.vendors = (p.vendor_slugs || []).map(function (s) { return ix.vendor[s]; }).filter(Boolean);
        m.breadcrumbs = crumbs([{ name: 'Magazine', path: path.magazine() }, { name: p.section, path: path.section(p.section) }, { name: p.title, path: m.path }]);
        var evIds = (p.event_type_ids || []).filter(function (id) { return ix.ev[id] && ix.ev[id].seo_slug; });
        var catLinks = (p.category_ids || []).filter(function (id) { return ix.cat[id] && vendorsFor(ix, { cat: id }).length; }).map(function (id) {
          var ev = evIds.filter(function (x) { return indexableCombo(ix, x, id); })[0];
          return { label: ev ? cap(ix.ev[ev].noun) + ' ' + ix.cat[id].plural.replace(/^Event /, '') : ix.cat[id].plural, path: bestCatPath(ix, ev, id), count: ev ? vendorsFor(ix, { event: ev, cat: id }).length : vendorsFor(ix, { cat: id }).length };
        });
        m.related = [
          { title: 'Discover vendors', links: catLinks },
          { title: 'Plan by event', links: evIds.map(function (id) { return evLink(ix, id); }).filter(function (x) { return x.count; }) },
        ];
        m.articles = (ix.data.posts || []).filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(postCard);
        break;
      case 'app':
        m.path = '/' + Object.keys(APP_PATHS).filter(function (k) { return APP_PATHS[k] === r.view; })[0] + '/';
        m.robots = 'noindex,nofollow';
        m.title = ({ plan: 'Plan My Event', saved: 'Your Eventory', join: 'Join Eventory', auth: 'Sign in', account: 'Your account', inbox: 'Vendor inbox', inquire: 'Send an inquiry' })[r.view] + ' | Eventory';
        m.h1 = m.title.replace(/ \| Eventory$/, ''); m.description = '';
        break;
      default:
        m.status = 404; m.robots = 'noindex,follow'; m.path = null;
        m.title = 'Page not found | Eventory'; m.h1 = 'Page not found'; m.description = '';
    }
    if (hasQuery && m.robots.indexOf('noindex') < 0) m.robots = 'noindex,follow';
    m.related = (m.related || []).filter(function (g) { return g.links && g.links.length; });
    m.canonical = m.path ? abs(m.canonical || m.path) : null;
    m.sponsored = m.status === 200 ? sponsoredFor(ix, r) : [];
    m.jsonld = jsonld(ix, m);
    return m;
  }

  // ---- Sponsored placements (Spotlight+ website advertising) ----------------
  // Only live placements of Spotlight+ vendors reach this code (the database
  // policy filters them). A placement shows only where its type and targets
  // match the page, so advertising stays relevant to what the planner is
  // looking at. Kept separate from organic listings, editorial links and
  // structured data.
  var MAX_SPONSORED = 2;
  function overlap(a, b) { a = a || []; b = b || []; return a.some(function (x) { return b.indexOf(x) >= 0; }); }
  function sponsoredFor(ix, r) {
    var ads = ix.data.ads || [];
    if (!ads.length) return [];
    var post = r.type === 'post' ? ix.post[r.id] : null;
    var match = function (a) {
      switch (r.type) {
        case 'home': return a.placement_type === 'home';
        case 'category': case 'categoryLocation': case 'eventCategory':
          return a.placement_type === 'category' && (a.category_ids || []).indexOf(r.cat) >= 0 &&
            (!r.event || !(a.event_type_ids || []).length || a.event_type_ids.indexOf(r.event) >= 0);
        case 'event': return a.placement_type === 'event' && (a.event_type_ids || []).indexOf(r.event) >= 0;
        case 'location': return a.placement_type === 'location' && (a.location_slugs || []).indexOf(r.loc) >= 0;
        case 'post': return a.placement_type === 'article' && (overlap(a.category_ids, post.category_ids) || overlap(a.event_type_ids, post.event_type_ids));
        default: return false;
      }
    };
    var seen = {}, list = ads.filter(function (a) { return ix.vendorById[a.vendor_id] && match(a); }).filter(function (a) { return seen[a.vendor_id] ? false : (seen[a.vendor_id] = 1); });
    // Share the slots fairly between eligible placements: rotate daily.
    var day = Math.floor(Date.now() / 864e5), k = list.length ? day % list.length : 0;
    list = list.slice(k).concat(list.slice(0, k)).slice(0, MAX_SPONSORED);
    return list.map(function (a) { return { placementId: a.id, placementType: a.placement_type, headline: a.headline || '', vendor: ix.vendorById[a.vendor_id] }; });
  }

  // Categories booked alongside this one: the other categories that appear
  // in the "needs" of events this category serves.
  function relatedCats(ix, catId) {
    var score = {};
    (ix.data.events || []).forEach(function (e) {
      if ((e.needs || []).indexOf(catId) < 0) return;
      e.needs.forEach(function (id) { if (id !== catId) score[id] = (score[id] || 0) + 1; });
    });
    return Object.keys(score).filter(function (id) { return ix.cat[id]; }).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 6);
  }

  // ---- Structured data ------------------------------------------------------
  var ORG = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Eventory', url: SITE + '/', description: 'Event vendor discovery platform for Trinidad & Tobago.', areaServed: { '@type': 'Country', name: 'Trinidad and Tobago' } };
  function socialUrl(kind, h) {
    if (!h) return null; if (/^https?:/.test(h)) return h;
    h = h.replace(/^@/, '').replace(/^\//, '');
    return kind === 'ig' ? 'https://www.instagram.com/' + h : 'https://www.facebook.com/' + h;
  }
  function jsonld(ix, m) {
    var out = [], url = m.canonical;
    if (!url || m.robots.indexOf('nofollow') >= 0) return out;
    if (m.type === 'home') {
      out.push(ORG);
      out.push({ '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Eventory', publisher: { '@id': ORG['@id'] }, inLanguage: 'en-TT' });
    }
    if (m.breadcrumbs.length) out.push({ '@type': 'BreadcrumbList', itemListElement: m.breadcrumbs.map(function (b, i) { return { '@type': 'ListItem', position: i + 1, name: b.name, item: abs(b.path) }; }) });
    if (m.type === 'vendor') {
      var v = m.vendor, place = vendorPlace(ix, v), c = ix.cat[v.category_id];
      var biz = { '@type': 'LocalBusiness', '@id': url + '#business', name: v.name, url: url, description: m.intro };
      if (v.photos && v.photos.length) biz.image = v.photos.slice(0, 6).map(abs);
      if (place) biz.address = Object.assign({ '@type': 'PostalAddress', addressCountry: 'TT' }, place.townSlug || !place.island ? { addressLocality: place.town } : {}, place.island ? { addressRegion: place.island } : {});
      if ((v.areas_served || []).length) biz.areaServed = v.areas_served.map(function (a) { return { '@type': 'Place', name: a }; });
      if (v.from_label && !/on request/i.test(v.from_label)) biz.priceRange = 'From ' + v.from_label;
      var same = [v.website && (/^https?:/.test(v.website) ? v.website : 'https://' + v.website), socialUrl('ig', v.instagram), socialUrl('fb', v.facebook)].filter(Boolean);
      if (same.length) biz.sameAs = same;
      var kn = vendorCats(v).filter(function (id) { return ix.cat[id]; }).map(function (id) { return ix.cat[id].plural; })
        .concat((v.events || []).filter(function (e) { return ix.ev[e]; }).map(function (e) { return ix.ev[e].label; })).concat(v.specialties || []);
      if (kn.length) biz.knowsAbout = kn;
      if ((v.packages || []).length) biz.makesOffer = v.packages.map(function (p) { return { '@type': 'Offer', itemOffered: { '@type': 'Service', name: p.name, description: clip(p.description, 300) } }; });
      out.push({ '@type': 'ProfilePage', '@id': url, url: url, name: m.title, isPartOf: { '@id': SITE + '/#website' }, mainEntity: biz });
    } else if (m.type === 'post') {
      var p = m.post;
      out.push({ '@type': 'Article', '@id': url + '#article', headline: p.title, description: p.excerpt, image: p.img_path ? [abs(p.img_path)] : undefined,
        datePublished: p.published_on, dateModified: p.updated_on || p.published_on, articleSection: p.section,
        author: { '@type': 'Organization', name: p.author || 'Eventory', url: SITE + '/' }, publisher: { '@id': ORG['@id'] }, mainEntityOfPage: url,
        about: (p.event_type_ids || []).map(function (id) { return ix.ev[id] && ix.ev[id].label; }).concat((p.category_ids || []).map(function (id) { return ix.cat[id] && ix.cat[id].plural; })).filter(Boolean).map(function (n) { return { '@type': 'Thing', name: n }; }) });
      out.push(ORG);
    } else if (m.vendors.length && /^(vendors|category|event|eventCategory|categoryLocation|location)$/.test(m.type)) {
      out.push({ '@type': 'CollectionPage', '@id': url, url: url, name: m.h1, description: m.description, isPartOf: { '@id': SITE + '/#website' },
        mainEntity: { '@type': 'ItemList', numberOfItems: m.vendors.length, itemListElement: m.vendors.slice(0, 50).map(function (v, i) { return { '@type': 'ListItem', position: i + 1, url: abs(path.vendor(v.slug)), name: v.name }; }) } });
    } else if ((m.type === 'magazine' || m.type === 'section') && m.articles.length) {
      out.push({ '@type': 'CollectionPage', '@id': url, url: url, name: m.h1, description: m.description,
        mainEntity: { '@type': 'ItemList', itemListElement: m.articles.map(function (a, i) { return { '@type': 'ListItem', position: i + 1, url: abs(a.path), name: a.title }; }) } });
    }
    if (m.faqs && m.faqs.length) out.push({ '@type': 'FAQPage', mainEntity: m.faqs.map(function (f) { return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }; }) });
    return out.map(function (o) { return Object.assign({ '@context': 'https://schema.org' }, JSON.parse(JSON.stringify(o))); });
  }

  // ---- Sitemap --------------------------------------------------------------
  function sitemapEntries(ix) {
    var urls = [], add = function (r, lastmod) { var m = page(ix, r); if (m.robots.indexOf('noindex') < 0 && m.canonical === abs(m.path)) urls.push({ loc: m.canonical, lastmod: lastmod }); };
    var d = ix.data, latest = function (list, f) { return list.map(f).filter(Boolean).sort().pop(); };
    var vLast = latest(d.vendors || [], function (v) { return (v.updated_at || '').slice(0, 10); });
    add({ type: 'home' }, vLast); add({ type: 'vendors' }, vLast);
    (d.categories || []).forEach(function (c) {
      add({ type: 'category', cat: c.id }, vLast);
      (d.events || []).forEach(function (e) { if (e.seo_slug) add({ type: 'eventCategory', event: e.id, cat: c.id }, vLast); });
      Object.keys(ix.loc).forEach(function (s) { add({ type: 'categoryLocation', cat: c.id, loc: s }, vLast); });
    });
    (d.events || []).forEach(function (e) { if (e.seo_slug) add({ type: 'event', event: e.id }, vLast); });
    Object.keys(ix.loc).forEach(function (s) { add({ type: 'location', loc: s }, vLast); });
    (d.vendors || []).forEach(function (v) { add({ type: 'vendor', slug: v.slug }, (v.updated_at || '').slice(0, 10)); });
    add({ type: 'magazine' }, latest(d.posts || [], function (p) { return p.updated_on || p.published_on; }));
    SECTIONS.forEach(function (s) { add({ type: 'section', section: s }); });
    (d.posts || []).forEach(function (p) { add({ type: 'post', id: p.id }, p.updated_on || p.published_on); });
    return urls;
  }

  // ---- Crawlable HTML (server render) ---------------------------------------
  // Plain semantic HTML with the same content the app screen shows. Visitors
  // with JavaScript see the app; crawlers that don't run JS read this.
  function renderHtml(ix, m) {
    var h = [];
    var a = function (href, text) { return '<a href="' + esc(href) + '">' + esc(text) + '</a>'; };
    h.push('<header><p>' + a('/', 'Eventory') + ': event vendors in Trinidad &amp; Tobago</p><nav aria-label="Main"><ul>');
    h.push('<li>' + a('/vendors/', 'All vendors') + '</li><li>' + a('/magazine/', 'Eventory Magazine') + '</li>');
    (ix.data.categories || []).forEach(function (c) { if (vendorsFor(ix, { cat: c.id }).length) h.push('<li>' + a(path.category(ix, c.id), c.plural) + '</li>'); });
    h.push('</ul></nav></header><main>');
    if (m.breadcrumbs.length > 1) h.push('<nav aria-label="Breadcrumb"><ol>' + m.breadcrumbs.map(function (b) { return '<li>' + a(b.path, b.name) + '</li>'; }).join('') + '</ol></nav>');
    h.push('<h1>' + esc(m.h1) + '</h1>');
    if (m.type === 'vendor') {
      var v = m.vendor;
      if (v.tagline) h.push('<p>' + esc(v.tagline) + '</p>');
      h.push('<p>' + esc(m.intro) + '</p>');
      h.push('<section><h2>At a glance</h2><dl>' + m.facts.map(function (f) { return '<dt>' + esc(f.k) + '</dt><dd>' + (f.href ? a(f.href, f.v) : esc(f.v)) + '</dd>'; }).join('') + '</dl></section>');
      if (v.about) h.push('<section><h2>About ' + esc(v.name) + '</h2><p>' + esc(v.about) + '</p></section>');
      if ((v.packages || []).length) h.push('<section><h2>' + esc(v.packages_title || 'Packages and services') + '</h2>' + v.packages.map(function (p) { return '<article><h3>' + esc(p.name) + '</h3>' + (p.price_label ? '<p>' + esc(p.price_label) + '</p>' : '') + (p.description ? '<p>' + esc(clip(p.description, 600)) + '</p>' : '') + '</article>'; }).join('') + '</section>');
      (v.photos || []).slice(0, 6).forEach(function (src, i) { h.push('<img src="' + esc(src) + '" alt="' + esc(v.name + ' photo ' + (i + 1)) + '" loading="lazy">'); });
      h.push('<section><h2>Contact ' + esc(v.name) + '</h2><p>Send ' + esc(v.name) + ' an inquiry through Eventory with your event date, type and location. They reply to you directly.</p>');
      var links = [v.website && a(/^https?:/.test(v.website) ? v.website : 'https://' + v.website, 'Website'), socialUrl('ig', v.instagram) && a(socialUrl('ig', v.instagram), 'Instagram ' + v.instagram), socialUrl('fb', v.facebook) && a(socialUrl('fb', v.facebook), 'Facebook')].filter(Boolean);
      if (links.length) h.push('<ul>' + links.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>');
      h.push('</section>');
    } else if (m.type === 'post') {
      var p = m.post;
      h.push('<p><strong>' + esc(p.section) + '</strong> · ' + esc(p.published_on) + ' · ' + esc(p.author || 'Eventory') + '</p><p>' + esc(p.excerpt) + '</p>');
      if (p.img_path) h.push('<img src="' + esc(abs(p.img_path)) + '" alt="' + esc(p.title) + '">');
      (p.body || []).forEach(function (para) { h.push('<p>' + esc(para) + '</p>'); });
    } else if (m.intro) h.push('<p>' + esc(m.intro) + '</p>');
    var vendorHeading = m.type === 'vendor' ? 'Similar vendors' : m.type === 'post' ? 'Vendors in this article' : 'Vendors';
    if (m.vendors.length && m.type !== 'home') h.push('<section><h2>' + vendorHeading + '</h2><ul>' + m.vendors.map(function (v) { var cv = vendorCard(ix, v); return '<li>' + a(cv.path, cv.name) + (cv.category ? ' · ' + esc(cap(cv.category)) : '') + (cv.place ? ' · ' + esc(cv.place) : '') + (cv.tagline ? '<br>' + esc(cv.tagline) : '') + '</li>'; }).join('') + '</ul></section>');
    m.related.forEach(function (g) { h.push('<section><h2>' + esc(g.title) + '</h2><ul>' + g.links.map(function (l) { return '<li>' + a(l.path, l.label) + (l.count ? ' (' + l.count + ')' : '') + '</li>'; }).join('') + '</ul></section>'); });
    if (m.sponsored && m.sponsored.length) h.push('<aside aria-label="Sponsored"><h2>Sponsored</h2><p>Paid placements from Spotlight+ vendors, separate from Eventory\'s listings and editorial content.</p><ul>' + m.sponsored.map(function (sp) { var cv = vendorCard(ix, sp.vendor); return '<li><a href="' + esc(cv.path) + '" rel="sponsored">' + esc(cv.name) + '</a>' + (cv.category ? ' · ' + esc(cap(cv.category)) : '') + (cv.place ? ' · ' + esc(cv.place) : '') + (sp.headline ? '<br>' + esc(sp.headline) : '') + '</li>'; }).join('') + '</ul></aside>');
    if (m.faqs.length) h.push('<section><h2>Frequently asked questions</h2>' + m.faqs.map(function (f) { return '<h3>' + esc(f.q) + '</h3><p>' + esc(f.a) + '</p>'; }).join('') + '</section>');
    if (m.articles.length) h.push('<section><h2>' + (m.type === 'magazine' || m.type === 'section' ? 'Articles' : 'From Eventory Magazine') + '</h2><ul>' + m.articles.map(function (x) { return '<li>' + a(x.path, x.title) + ' · ' + esc(x.section) + '<br>' + esc(x.excerpt) + '</li>'; }).join('') + '</ul></section>');
    h.push('</main><footer><p>' + a('/join/', 'List your business on Eventory') + '</p></footer>');
    return h.join('');
  }

  return {
    SITE: SITE, MIN: MIN, SECTIONS: SECTIONS, build: build, resolve: resolve, appState: appState, pathForState: pathForState,
    page: page, path: path, vendorsFor: vendorsFor, inLoc: inLoc, vendorPlace: vendorPlace, placeLabel: placeLabel,
    sitemapEntries: sitemapEntries, renderHtml: renderHtml, slugify: slugify, esc: esc, abs: abs, parseQuery: parseQuery,
  };
});
