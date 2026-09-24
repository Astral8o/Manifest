// Offline demo backend. Stands in for js/eventory-data.js with the same
// window.EVDB interface, so the real page runs unchanged. Everything lives
// in this browser's localStorage: no network, no real accounts, nothing sent.
// The public data (fake vendors) is embedded by demo/build.js.
(function () {
  var KEY = 'eventory_demo_v2';
  var APP_KEYS = ['eventory_auth_v1', 'eventory_saved_v1', 'eventory_inquiries_v1', 'eventory_tiers_v1'];
  var boot = window.__EV_BOOT;
  var base = boot.data;
  var PLAN = {}; base.plans.forEach(function (p) { PLAN[p.id] = p; });
  var bySlug = function (s) { return base.vendors.filter(function (v) { return v.slug === s; })[0]; };
  var DEMO_VENDOR = 'frame-focus-studio';

  function hoursAgo(h) { return new Date(Date.now() - h * 36e5).toISOString(); }
  function uid() { return 'dddd' + Math.random().toString(16).slice(2, 6) + '-' + Date.now().toString(16).slice(-4) + '-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0'); }

  function seed() {
    var fv = bySlug(DEMO_VENDOR);
    var q = function (h, name, ev, date, guests, loc, pkg, budget, msg) {
      return { id: uid(), vendor_id: fv.id, planner_user_id: null, event_type: ev, event_other: '', event_date: date, guests: guests,
        location: loc, package_name: pkg, budget: budget, message: msg, name: name, email: name.split(' ')[0].toLowerCase() + '@example.com',
        phone: '+1 868 555 01' + (10 + h % 80), contact_pref: h % 2 ? 'WhatsApp' : 'Email', status: h > 40 ? 'replied' : 'new', held: false, created_at: hoursAgo(h) };
    };
    return {
      users: [
        { id: 'dddd0000-0000-4000-8000-00000000a001', email: 'vendor@demo.tt', password: 'demo1234', role: 'vendor', name: 'Frame & Focus Studio' },
        { id: 'dddd0000-0000-4000-8000-00000000a002', email: 'planner@demo.tt', password: 'demo1234', role: 'planner', name: 'Aaliyah Mohammed' },
      ],
      owners: (function () { var o = {}; o[fv.id] = 'dddd0000-0000-4000-8000-00000000a001'; return o; })(),
      session: null, overrides: {}, added: [], saved: {}, requests: [],
      inquiries: [
        q(3, 'Renée Joseph', 'weddings', '2027-02-13', '150', 'Chaguaramas', 'Full-Day Wedding Coverage', 'TT$5,000–TT$10,000', 'Hi! Is 13 February free? We would love two photographers for the ceremony and reception.'),
        q(26, 'Marcus Ali', 'corporate', '2026-11-20', '80', 'Port of Spain', 'Event Coverage — 4 Hours', '', 'Product launch at our office. Need photos for social the next morning.'),
        q(72, 'Kezia Charles', 'christenings', '2026-12-06', '40', 'San Fernando', '', 'Under TT$3,000', 'Short church service and lunch after. About 3 hours.'),
      ],
    };
  }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.users) return s; } catch (e) {} return seed(); }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  save();

  // Apply what happened in this demo (sign-ups, package edits, upgrades) to the embedded data.
  base.vendors.forEach(function (v) { var o = S.overrides[v.id]; if (o) Object.keys(o).forEach(function (k) { v[k] = o[k]; }); });
  S.added.forEach(function (v) { base.vendors.push(v); });
  var rawById = function (id) { return base.vendors.filter(function (v) { return v.id === id; })[0]; };
  function override(id, patch) {
    S.overrides[id] = Object.assign(S.overrides[id] || {}, patch);
    var v = rawById(id); if (v) Object.keys(patch).forEach(function (k) { v[k] = patch[k]; });
    save();
  }
  // Open the screen named after '#', e.g. #/vendors/frame-focus-studio/.
  if (location.hash.length > 1 && window.EventorySEO) {
    var SEO = window.EventorySEO, ix = SEO.build(base);
    boot.route = SEO.resolve(ix, location.hash.slice(1).split('?')[0]);
    boot.state = SEO.appState(ix, boot.route);
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms || 250); }); }
  function fail(msg) { throw new Error(msg); }
  function user() { return S.users.filter(function (u) { return u.id === S.session; })[0] || null; }
  function asUser(u) { return u && { id: u.id, email: u.email, user_metadata: { role: u.role, name: u.name } }; }
  var listeners = [];
  function emit() { var u = asUser(user()); listeners.forEach(function (cb) { cb(u); }); }
  function ownedBy(userId) { for (var id in S.owners) if (S.owners[id] === userId) return rawById(id); return null; }

  function mapVendor(r) {
    return {
      id: r.slug, uuid: r.id, ownerId: S.owners[r.id] || null, name: r.name, cat: r.category_id,
      location: r.location || '', events: r.events || [], from: r.from_label || 'Price on request',
      reply: r.reply_label || '', imgs: (r.photos || []).slice(), tagline: r.tagline || '', about: r.about || '',
      ig: r.instagram || '', fb: r.facebook || '', tier: r.tier || 'basic', email: '', pkgTitle: r.packages_title || '',
      also: r.also_categories || [], website: r.website || '', areas: r.areas_served || [], specialties: r.specialties || [],
      packages: (r.packages || []).map(function (p) {
        return { name: p.name, price: p.price_label || '', desc: p.description || '', img: p.img_url || null, imgUrl: p.img_url || '' };
      }),
    };
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtPostDate(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0] : ''; }
  function fromRaw(raw) {
    return {
      raw: raw,
      vendors: raw.vendors.map(mapVendor),
      posts: raw.posts.map(function (p) {
        return { id: p.id, tag: p.section || p.tag, date: fmtPostDate(p.published_on), read: p.read_label, img: p.img_path,
          title: p.title, excerpt: p.excerpt, vendors: p.vendor_slugs || [], body: p.body || [] };
      }),
    };
  }
  function mapInquiry(r, slug) {
    return { id: r.id, vendorId: slug, eventType: r.event_type || '', eventOther: r.event_other || '', date: r.event_date || '',
      guests: r.guests || '', location: r.location || '', pkg: r.package_name || '', budget: r.budget || '', message: r.message || '',
      name: r.name || '', email: r.email || '', phone: r.phone || '', contact: r.contact_pref || 'Email', createdAt: r.created_at,
      status: r.status || 'new', held: !!r.held };
  }
  function shrink(dataUrl, max) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { resolve(null); };
      img.src = dataUrl;
    });
  }
  function newUser(email, password, role, name) {
    email = String(email || '').trim().toLowerCase();
    if (S.users.some(function (u) { return u.email === email; })) fail('That email already has an account. Sign in instead.');
    if (String(password || '').length < 8) fail('At least 8 characters');
    var u = { id: uid(), email: email, password: password, role: role, name: name };
    S.users.push(u); S.session = u.id; save(); return u;
  }

  window.EVDB = {
    client: null, boot: boot, fromRaw: fromRaw, demo: true,
    loadPublic: async function () { return fromRaw(base); },
    myVendor: async function (userId) { var r = ownedBy(userId); return r ? mapVendor(r) : null; },
    getUser: async function () { return asUser(user()); },
    onAuthChange: function (cb) { listeners.push(cb); setTimeout(function () { cb(asUser(user())); }, 0); },
    plannerFromUser: function (u) {
      var md = u.user_metadata || {};
      return { name: md.name || u.email.split('@')[0], email: u.email || '', id: u.id };
    },
    signUpPlanner: async function (name, email, password) { await wait(); var u = newUser(email, password, 'planner', name); emit(); return { user: asUser(u), session: {} }; },
    signIn: async function (email, password) {
      await wait();
      var u = S.users.filter(function (x) { return x.email === String(email).trim().toLowerCase(); })[0];
      if (!u || u.password !== password) fail('Wrong email or password');
      S.session = u.id; save(); emit(); return asUser(u);
    },
    signInGoogle: async function () { fail('Google sign-in isn’t part of the demo. Use email instead.'); },
    signOut: async function () { S.session = null; save(); emit(); },

    // Sign-up goes live straight away in the demo (no confirmation email).
    signUpVendor: async function (d) {
      await wait(400);
      var u = newUser(d.email, d.password, 'vendor', d.name.trim());
      var photos = (await Promise.all((d.photos || []).map(function (p) { return shrink(p, 900); }))).filter(Boolean);
      var slugBase = d.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vendor';
      var id = uid();
      var raw = { id: id, slug: slugBase + '-' + id.slice(4, 8), name: d.name.trim(), category_id: d.cat || 'planning', also_categories: [],
        location: d.location || '', areas_served: [], events: d.events || [], from_label: (d.from || '').trim() || 'Price on request', reply_label: '',
        tagline: (d.tagline || '').trim(), about: (d.tagline || '').trim(), instagram: (d.ig || '').trim(), facebook: (d.fb || '').trim(), website: '',
        specialties: [], photos: photos, tier: 'basic', packages_title: (d.pkgTitle || '').trim(), updated_at: new Date().toISOString(),
        packages: (d.pkgs || []).filter(function (p) { return p.name.trim(); }).map(function (p, i) {
          return { vendor_id: id, name: p.name.trim(), price_label: (p.price || '').trim(), description: (p.desc || '').trim(), img_url: null, sort_order: i };
        }) };
      S.added.push(raw); base.vendors.push(raw); S.owners[id] = u.id;
      try { save(); } catch (e) {}
      if (!localStorage.getItem(KEY) || localStorage.getItem(KEY).indexOf(id) < 0) { raw.photos = []; save(); } // photos too big to keep
      emit();
      return { user: asUser(u), session: {} };
    },
    savePackages: async function (vendorUuid, pkgs, title) {
      await wait();
      var patch = { packages: pkgs.map(function (p, i) { return { vendor_id: vendorUuid, name: p.name, price_label: p.price || '', description: p.desc || '', img_url: p.imgUrl || null, sort_order: i }; }) };
      if (title != null) patch.packages_title = String(title);
      override(vendorUuid, patch);
    },
    flushPendingPhotos: async function () { return false; },

    sendInquiries: async function (vendorUuids, f, plannerId) {
      await wait(500);
      vendorUuids.forEach(function (vid) {
        var v = rawById(vid), lim = (PLAN[v && v.tier] || {}).inquiry_limit;
        var count = S.inquiries.filter(function (q) { return q.vendor_id === vid; }).length;
        S.inquiries.unshift({ id: uid(), vendor_id: vid, planner_user_id: plannerId || null, event_type: f.eventType || '', event_other: f.eventOther || '',
          event_date: f.date || null, guests: String(f.guests || ''), location: f.location || '', package_name: f.pkg || '', budget: f.budget || '',
          message: f.message || '', name: f.name.trim(), email: f.email.trim(), phone: f.phone || '', contact_pref: f.contact || 'Email',
          status: 'new', held: lim != null && count >= lim, created_at: new Date().toISOString() });
      });
      save();
    },
    plannerInquiries: async function (slugByUuid) {
      var me = S.session;
      return S.inquiries.filter(function (q) { return me && q.planner_user_id === me; }).map(function (q) { return mapInquiry(q, slugByUuid[q.vendor_id] || q.vendor_id); });
    },
    vendorInbox: async function (vendorSlug) {
      var v = ownedBy(S.session); if (!v) return [];
      var capped = (PLAN[v.tier] || {}).inquiry_limit != null;
      return S.inquiries.filter(function (q) { return q.vendor_id === v.id; }).map(function (q) {
        var h = q.held && capped, r = Object.assign({}, q, { held: h });
        if (h) ['package_name', 'budget', 'message', 'name', 'email', 'phone'].forEach(function (k) { r[k] = ''; });
        return mapInquiry(r, vendorSlug);
      });
    },
    setInquiryStatus: async function (id, status) { S.inquiries.forEach(function (q) { if (q.id === id) q.status = status; }); save(); },
    requestTier: async function (vendorUuid, tier) {
      await wait();
      S.requests.unshift({ vendor_id: vendorUuid, tier: tier, status: 'pending', created_at: new Date().toISOString() }); save();
    },
    pendingTierRequest: async function (vendorUuid) {
      return S.requests.filter(function (r) { return r.vendor_id === vendorUuid && (r.status === 'pending' || r.status === 'contacted'); })[0] || null;
    },
    savedList: async function () { return S.saved[S.session] || []; },
    setSaved: async function (userId, vendorUuid, on) {
      var l = S.saved[userId] = (S.saved[userId] || []).filter(function (x) { return x !== vendorUuid; });
      if (on) l.push(vendorUuid); save();
    },
  };

  // Demo helpers used by the guide panel.
  window.EVDEMO = {
    reset: function () {
      try { localStorage.removeItem(KEY); APP_KEYS.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
      location.replace(location.pathname);
    },
    // Plays the Eventory team: approves the newest plan request (billing arranged).
    approveUpgrade: function () {
      var r = S.requests.filter(function (x) { return x.status === 'pending'; })[0];
      if (!r) return false;
      r.status = 'activated'; override(r.vendor_id, { tier: r.tier }); save(); return true;
    },
    pendingUpgrade: function () { return S.requests.filter(function (x) { return x.status === 'pending'; })[0] || null; },
    planName: function (id) { return (PLAN[id] || {}).name || id; },
  };
})();
