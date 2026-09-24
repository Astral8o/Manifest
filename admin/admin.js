// Eventory admin (/admin/). Standalone: the public site never loads this file.
// Every read and write goes through the admin_* database functions, which
// refuse anyone whose confirmed email isn't in public.admins.
(function () {
  'use strict';
  var SUPABASE_URL = 'https://oiwjuvzsydhuhmetcuqk.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qYk_KouIw772oOXdIvr7uA_zwhPVmtF';
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  var app = document.getElementById('app');

  var TABS = [['overview', 'Overview'], ['vendors', 'Vendors'], ['requests', 'Plan requests'], ['ads', 'Advertising'], ['posts', 'Magazine'], ['inquiries', 'Inquiries']];
  var SECTIONS = ['Planning Guides', 'Vendor Guides', 'Event Types', 'Local Guides', 'Vendor Spotlights', 'Real Events'];
  var AD_TYPES = { home: 'Home page', category: 'Category pages', event: 'Event pages', location: 'Location pages', article: 'Magazine articles' };
  var AD_STATUS = ['draft', 'active', 'paused', 'ended'];
  var REQ_STATUS = { pending: 'Pending', contacted: 'Contacted', activated: 'Activated', declined: 'Declined' };

  var S = {
    phase: 'loading', user: null, tab: 'overview', err: '', note: '',
    ref: { cats: [], events: [], locs: [], plans: [] },
    data: { overview: {}, vendors: [], requests: [], ads: [], posts: [], inquiries: [] },
    edit: null, dirty: false, busy: false, secret: null,
    q: { vendors: '', vfilter: '', inquiries: '', ivendor: '' },
  };

  // Helpers ---------------------------------------------------------------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rpc(name, args) {
    return sb.rpc(name, args || {}).then(function (r) { if (r.error) throw new Error(r.error.message); return r.data; });
  }
  function by(list, key) { var o = {}; list.forEach(function (x) { o[x[key]] = x; }); return o; }
  function catLabel(id) { var c = by(S.ref.cats, 'id')[id]; return c ? c.label : id || ''; }
  function evLabel(id) { var e = by(S.ref.events, 'id')[id]; return e ? e.label : id; }
  function planName(id) { var p = by(S.ref.plans, 'id')[id]; return p ? p.name : id || ''; }
  function fmtDate(iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('en-TT', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function fmtWhen(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-TT', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }
  function img(src) { return !src ? '' : /^https?:|^data:/.test(src) ? src : '/' + String(src).replace(/^\/+/, ''); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function toast(msg, bad) {
    var t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, bad ? 5000 : 2600);
  }
  function fail(e) { S.busy = false; render(); toast(e.message || String(e), true); }
  function setPath(obj, path, val) {
    var ks = path.split('.'); var o = obj;
    for (var i = 0; i < ks.length - 1; i++) o = o[/^\d+$/.test(ks[i]) ? +ks[i] : ks[i]];
    o[ks[ks.length - 1]] = val;
  }
  function checks(name, options, selected) {
    return '<div class="checks">' + options.map(function (o) {
      return '<label><input type="checkbox" data-arr="' + name + '" value="' + esc(o[0]) + '"' + (selected.indexOf(o[0]) >= 0 ? ' checked' : '') + '>' + esc(o[1]) + '</label>';
    }).join('') + '</div>';
  }
  function field(label, key, value, opts) {
    opts = opts || {};
    var input = opts.textarea
      ? '<textarea data-k="' + key + '" placeholder="' + esc(opts.ph || '') + '"' + (opts.rows ? ' style="min-height:' + opts.rows * 24 + 'px"' : '') + '>' + esc(value) + '</textarea>'
      : '<input type="' + (opts.type || 'text') + '" data-k="' + key + '" value="' + esc(value) + '" placeholder="' + esc(opts.ph || '') + '">';
    return '<label class="f"><span>' + esc(label) + '</span>' + input + (opts.hint ? '<small>' + opts.hint + '</small>' : '') + '</label>';
  }
  function select(label, key, value, options, hint) {
    return '<label class="f"><span>' + esc(label) + '</span><select data-k="' + key + '">' + options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join('') + '</select>' + (hint ? '<small>' + hint + '</small>' : '') + '</label>';
  }
  function planPill(t) { return t === 'spotlight_plus' ? '<span class="pill plus">Spotlight+</span>' : t === 'spotlight' ? '<span class="pill hot">Spotlight</span>' : '<span class="pill">No-cost</span>'; }

  // Photos are resized in the browser before upload, like vendor sign-up.
  function shrink(file, max) {
    return new Promise(function (resolve, reject) {
      var rd = new FileReader();
      rd.onerror = reject;
      rd.onload = function () {
        var im = new Image();
        im.onerror = reject;
        im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height));
          var c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not read that image')); }, 'image/jpeg', 0.85);
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  function uploadPhotos(files, folder) {
    return Promise.all(Array.prototype.map.call(files, function (f, i) {
      return shrink(f, 1600).then(function (blob) {
        var path = 'admin/' + folder + '/' + Date.now() + '-' + i + '.jpg';
        return sb.storage.from('vendor-photos').upload(path, blob, { contentType: 'image/jpeg' }).then(function (r) {
          if (r.error) throw new Error(r.error.message);
          return sb.storage.from('vendor-photos').getPublicUrl(path).data.publicUrl;
        });
      });
    }));
  }

  // Data ------------------------------------------------------------------
  function loadRef() {
    return Promise.all([
      sb.from('categories').select('id,label').order('sort_order'),
      sb.from('event_types').select('id,label').order('sort_order'),
      sb.from('locations').select('slug,name').order('name'),
      sb.from('vendor_plans').select('id,name,price_ttd,billing_period').order('sort_order'),
    ]).then(function (r) {
      r.forEach(function (x) { if (x.error) throw new Error(x.error.message); });
      S.ref = { cats: r[0].data, events: r[1].data, locs: r[2].data, plans: r[3].data };
    });
  }
  function loadAll() {
    return Promise.all([rpc('admin_overview'), rpc('admin_vendors'), rpc('admin_requests'), rpc('admin_ads'), rpc('admin_posts'), rpc('admin_inquiries', { p_limit: 500 })])
      .then(function (r) { S.data = { overview: r[0], vendors: r[1], requests: r[2], ads: r[3], posts: r[4], inquiries: r[5] }; });
  }
  function refresh() { return loadAll().then(render, fail); }

  // Auth ------------------------------------------------------------------
  function start(session) {
    S.user = session ? session.user : null;
    if (!S.user) { S.phase = 'signin'; return render(); }
    S.phase = 'loading'; render();
    rpc('is_admin').then(function (ok) {
      if (!ok) { S.phase = 'denied'; return render(); }
      return Promise.all([loadRef(), loadAll()]).then(function () { S.phase = 'ready'; render(); });
    }).catch(function (e) { S.phase = 'signin'; S.err = e.message; render(); });
  }
  sb.auth.onAuthStateChange(function (ev, session) {
    if (ev === 'PASSWORD_RECOVERY') { S.phase = 'recovery'; S.user = session && session.user; render(); }
  });

  // Views -----------------------------------------------------------------
  function viewSignin() {
    return '<div class="signin card"><div class="eyebrow">Eventory</div><h1>Admin sign in</h1>' +
      '<form data-form="signin" class="list">' +
      '<label class="f"><span>Email</span><input type="email" name="email" autocomplete="username" required></label>' +
      '<label class="f"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>' +
      (S.err ? '<div class="danger">' + esc(S.err) + '</div>' : '') + (S.note ? '<div class="muted">' + esc(S.note) + '</div>' : '') +
      '<button class="btn solid" type="submit"' + (S.busy ? ' disabled' : '') + '>Sign in</button>' +
      '<button class="btn quiet sm" type="button" data-act="forgot">Forgot password?</button></form>' +
      '<p class="muted">Use the account for an admin email. It has to be confirmed first (the link in the sign-up email).</p></div>';
  }
  function viewRecovery() {
    return '<div class="signin card"><h1>Set a new password</h1><form data-form="recovery" class="list">' +
      '<label class="f"><span>New password</span><input type="password" name="password" minlength="8" autocomplete="new-password" required></label>' +
      (S.err ? '<div class="danger">' + esc(S.err) + '</div>' : '') +
      '<button class="btn solid" type="submit">Save password</button></form></div>';
  }
  function viewDenied() {
    return '<div class="signin card"><h1>Not an admin account</h1><p>You are signed in as <b>' + esc(S.user && S.user.email) +
      '</b>, which isn’t on the admin list.</p><div class="row"><button class="btn solid" data-act="signout">Sign out</button><a class="btn" href="/">Go to Eventory</a></div></div>';
  }

  function topbar() {
    var pend = S.data.overview.pending_requests || 0;
    return '<header class="top"><div class="top-in"><a class="brand" href="/admin/">Eventory <span class="tag">ADMIN</span></a>' +
      '<nav class="tabs">' + TABS.map(function (t) {
        return '<button class="tab' + (S.tab === t[0] && !S.edit ? ' on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] +
          (t[0] === 'requests' && pend ? '<span class="n">' + pend + '</span>' : '') + '</button>';
      }).join('') + '</nav>' +
      '<div class="who"><span>' + esc(S.user.email) + '</span><a class="btn sm" href="/" target="_blank" rel="noopener">View site</a><button class="btn sm quiet" data-act="signout">Sign out</button></div></div></header>';
  }

  function viewOverview() {
    var o = S.data.overview;
    var stat = function (n, label, tab, hot) { return '<button class="stat' + (hot ? ' hot' : '') + '" data-act="tab" data-v="' + tab + '"><b>' + (n || 0) + '</b><span class="muted">' + label + '</span></button>'; };
    var pending = S.data.requests.filter(function (r) { return r.status === 'pending'; });
    return '<div class="spread"><h1>Overview</h1><button class="btn sm" data-act="reload">Refresh</button></div>' +
      '<div class="stats">' + stat(o.vendors, 'vendors (' + (o.published || 0) + ' live)', 'vendors') + stat(o.pending_requests, 'plan requests waiting', 'requests', o.pending_requests) +
      stat(o.spotlight, 'on Spotlight', 'vendors') + stat(o.spotlight_plus, 'on Spotlight+', 'vendors') + stat(o.inquiries_30d, 'inquiries, last 30 days', 'inquiries') +
      stat(o.held, 'inquiries held at the limit', 'inquiries') + stat(o.active_ads, 'active ad placements', 'ads') + stat(o.posts, 'Magazine posts', 'posts') + '</div>' +
      (pending.length ? '<div class="card"><h2>Waiting on you</h2><div class="list">' + pending.map(reqItem).join('') + '</div></div>' : '') +
      '<div class="card"><div class="spread"><h2>Latest inquiries</h2><button class="btn sm" data-act="tab" data-v="inquiries">All inquiries</button></div>' +
      (S.data.inquiries.length ? '<div class="list">' + S.data.inquiries.slice(0, 5).map(inqItem).join('') + '</div>' : '<div class="empty">No inquiries yet.</div>') + '</div>' +
      '<p class="muted">Changes you save here show on the public site within about five minutes.</p>';
  }

  // Vendors
  function vendorMatches(v) {
    var q = S.q.vendors.trim().toLowerCase(); var f = S.q.vfilter;
    if (q && (v.name + ' ' + v.slug + ' ' + v.email + ' ' + (v.login_email || '') + ' ' + v.location).toLowerCase().indexOf(q) < 0) return false;
    if (f === 'live') return v.published; if (f === 'hidden') return !v.published;
    if (f === 'nologin') return !v.owner_user_id;
    if (f) return v.tier === f;
    return true;
  }
  function viewVendors() {
    var list = S.data.vendors.filter(vendorMatches);
    return '<div class="spread"><h1>Vendors</h1><button class="btn accent" data-act="newVendor">+ New vendor</button></div>' +
      '<div class="toolbar"><input type="search" id="vq" data-q="vendors" placeholder="Search name, email, location" value="' + esc(S.q.vendors) + '">' +
      '<select data-q="vfilter">' + [['', 'All vendors'], ['live', 'Live'], ['hidden', 'Hidden'], ['basic', 'No-Cost Listing'], ['spotlight', 'Spotlight'], ['spotlight_plus', 'Spotlight+'], ['nologin', 'No login']].map(function (o) {
        return '<option value="' + o[0] + '"' + (S.q.vfilter === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<span class="muted">' + list.length + ' of ' + S.data.vendors.length + '</span></div>' +
      (list.length ? '<div class="list">' + list.map(function (v) {
        return '<div class="item click" data-act="editVendor" data-v="' + v.id + '">' + (v.photos && v.photos[0] ? '<img class="thumb" src="' + esc(img(v.photos[0])) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') +
          '<div class="grow"><b>' + esc(v.name) + '</b><span class="muted">' + esc(catLabel(v.category_id)) + (v.location ? ' · ' + esc(v.location) : '') + ' · ' + v.inquiry_count + ' inquiries · ' + v.packages.length + ' packages</span>' +
          '<div class="pills">' + (v.published ? '<span class="pill live">Live</span>' : '<span class="pill draft">Hidden</span>') + planPill(v.tier) + (v.owner_user_id ? '<span class="pill">Has login</span>' : '<span class="pill warn">No login</span>') + '</div></div></div>';
      }).join('') + '</div>' : '<div class="empty">No vendors match.</div>');
  }
  function blankVendor() {
    return { id: '', name: '', slug: '', category_id: (S.ref.cats[0] || {}).id, also_categories: [], location: '', areas_served: [], events: [], from_label: '', reply_label: '',
      tagline: '', about: '', instagram: '', facebook: '', website: '', specialtiesText: '', photos: [], tier: 'basic', published: false, email: '', phone: '', packages_title: '', packages: [], login_email: null, owner_user_id: null };
  }
  function viewVendorEdit() {
    var d = S.edit.d; var isNew = !d.id;
    var locNames = S.ref.locs.map(function (l) { return l.name; });
    if (d.location && locNames.indexOf(d.location) < 0) locNames.unshift(d.location);
    var catOpts = S.ref.cats.map(function (c) { return [c.id, c.label]; });
    var h = '<button class="btn sm back" data-act="close">← All vendors</button>' +
      '<div class="spread"><h1>' + esc(isNew ? 'New vendor' : d.name || 'Vendor') + '</h1>' +
      (!isNew && d.published ? '<a class="btn sm" href="/vendors/' + esc(d.slug) + '/" target="_blank" rel="noopener">View profile ↗</a>' : '') + '</div>';
    h += '<div class="card"><h2>Status</h2><div class="grid2">' +
      '<label class="toggle"><input type="checkbox" data-bool="published"' + (d.published ? ' checked' : '') + '> Live on the site</label>' +
      select('Plan', 'tier', d.tier, S.ref.plans.map(function (p) { return [p.id, p.name + (p.price_ttd ? ' · TTD $' + p.price_ttd + '/' + p.billing_period : '')]; }), 'Change this once billing is arranged.') + '</div></div>';
    h += '<div class="card"><h2>Profile</h2><div class="grid2">' +
      field('Business name', 'name', d.name) +
      field('Web address', 'slug', d.slug, { ph: 'made from the name', hint: 'eventorytt.com/vendors/<b>' + esc(d.slug || '…') + '</b>/' + (isNew ? '' : '. Changing it breaks old links.') }) +
      select('Main category', 'category_id', d.category_id, catOpts) +
      select('Based in', 'location', d.location, [['', 'Choose a location']].concat(locNames.map(function (n) { return [n, n]; }))) +
      field('Starting price', 'from_label', d.from_label, { ph: 'e.g. TT$2,500' }) +
      field('Reply time', 'reply_label', d.reply_label, { ph: 'e.g. Usually replies within a day' }) + '</div>' +
      '<label class="f"><span>Also listed under</span></label>' + checks('also_categories', catOpts.filter(function (c) { return c[0] !== d.category_id; }), d.also_categories) +
      '<label class="f"><span>Events they work</span></label>' + checks('events', S.ref.events.map(function (e) { return [e.id, e.label]; }), d.events) +
      '<label class="f"><span>Areas served</span></label>' + checks('areas_served', S.ref.locs.map(function (l) { return [l.name, l.name]; }), d.areas_served) +
      field('One-line tagline', 'tagline', d.tagline, { ph: 'What they do and who for' }) +
      field('About', 'about', d.about, { textarea: true, rows: 6 }) +
      field('Specialties', 'specialtiesText', d.specialtiesText, { ph: 'Comma separated, e.g. Destination weddings, Drone footage' }) + '</div>';
    h += '<div class="card"><h2>Contact and links</h2><div class="grid2">' +
      field('Business email (private)', 'email', d.email, { type: 'email', hint: 'Inquiry emails go here. Never shown publicly.' }) +
      field('Phone or WhatsApp (private)', 'phone', d.phone) + field('Instagram', 'instagram', d.instagram, { ph: '@handle' }) +
      field('Facebook', 'facebook', d.facebook) + field('Website', 'website', d.website, { type: 'url', ph: 'https://' }) + '</div></div>';
    h += '<div class="card"><div class="spread"><h2>Photos</h2><span class="muted">First photo is the cover.</span></div><div class="photos">' +
      d.photos.map(function (p, i) {
        return '<div class="photo"><img src="' + esc(img(p)) + '" alt="">' + (i === 0 ? '<span class="pill plus cover">Cover</span>' : '') +
          '<div class="acts">' + (i ? '<button data-act="photoFirst" data-v="' + i + '">Make cover</button>' : '') + '<button data-act="photoRemove" data-v="' + i + '">Remove</button></div></div>';
      }).join('') +
      '<label class="upload">' + (S.busy === 'upload' ? 'UPLOADING…' : '+ ADD PHOTOS') + '<input type="file" accept="image/*" multiple data-upload="vendor"></label></div></div>';
    h += '<div class="card"><h2>Packages, services &amp; products</h2>' +
      '<div style="max-width:420px">' + field('Section title on the profile', 'packages_title', d.packages_title, { ph: 'Packages & services' }) + '</div>' +
      d.packages.map(function (p, i) {
        return '<div class="sub"><div class="spread"><span class="eyebrow">Item ' + (i + 1) + '</span><div class="row">' +
          (i ? '<button class="btn sm quiet" data-act="pkgUp" data-v="' + i + '">Move up</button>' : '') + '<button class="btn sm quiet" data-act="pkgRemove" data-v="' + i + '">Remove</button></div></div>' +
          '<div class="grid2">' + field('Name', 'packages.' + i + '.name', p.name) + field('Price', 'packages.' + i + '.price', p.price) + '</div>' +
          field("What's included", 'packages.' + i + '.desc', p.desc, { textarea: true, rows: 3 }) + '</div>';
      }).join('') + '<div><button class="btn" data-act="pkgAdd">+ Add another</button></div></div>';
    if (!isNew) {
      h += '<div class="card"><h2>Vendor login</h2>' + (d.login_email
        ? '<p>Signs in as <b>' + esc(d.login_email) + '</b>.</p><div class="row"><button class="btn" data-act="loginReset">Set a new temporary password</button></div>'
        : '<p class="muted">No login yet. Create one and hand the vendor the temporary password.</p><div class="grid2">' +
          '<label class="f"><span>Login email</span><input type="email" id="loginEmail" value="' + esc(d.email) + '"></label></div>' +
          '<div><button class="btn solid" data-act="loginCreate">Create login</button></div>') +
        (S.secret ? '<div class="sub"><span class="eyebrow">Give this to the vendor</span><div>Email: <b>' + esc(S.secret.email) + '</b></div><div class="secret">' + esc(S.secret.password) + '</div><span class="muted">Shown once. They can sign in at eventorytt.com with Vendor sign in.</span></div>' : '') + '</div>';
      h += '<div class="card"><h2>Delete</h2><p class="muted">Removes the vendor, their packages, inquiries and ad placements. This can’t be undone. To take them off the site for now, untick Live instead.</p><div><button class="btn bad" data-act="deleteVendor">Delete vendor</button></div></div>';
    }
    h += saveBar('saveVendor', isNew ? 'Create vendor' : 'Save changes');
    return h;
  }
  function saveBar(act, label) {
    return '<div class="savebar"><button class="btn solid" data-act="' + act + '"' + (S.busy ? ' disabled' : '') + '>' + (S.busy === 'save' ? 'Saving…' : label) + '</button>' +
      '<button class="btn quiet" data-act="close">Cancel</button><span class="muted">' + (S.dirty ? 'Unsaved changes' : '') + '</span></div>';
  }

  // Plan requests
  function reqItem(r) {
    var acts = r.status === 'pending' ? [['contacted', 'Mark contacted'], ['activated', 'Activate'], ['declined', 'Decline']]
      : r.status === 'contacted' ? [['activated', 'Activate'], ['declined', 'Decline']] : [['pending', 'Reopen']];
    return '<div class="item"><div class="grow"><b>' + esc(r.vendor) + ' wants ' + esc(planName(r.tier)) + '</b>' +
      '<span class="muted">Now on ' + esc(planName(r.current_tier)) + ' · requested ' + fmtWhen(r.created_at) + '</span>' +
      '<span class="muted">' + esc(r.email || 'no email') + (r.phone ? ' · ' + esc(r.phone) : '') + '</span>' +
      '<div class="pills"><span class="pill' + (r.status === 'pending' ? ' hot' : r.status === 'activated' ? ' live' : '') + '">' + REQ_STATUS[r.status] + '</span></div>' +
      '<div class="row">' + acts.map(function (a) { return '<button class="btn sm' + (a[0] === 'activated' ? ' solid' : '') + '" data-act="req" data-v="' + r.id + '" data-s="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div></div></div>';
  }
  function viewRequests() {
    return '<h1>Plan requests</h1><p class="muted">Vendors ask for Spotlight or Spotlight+ from their dashboard. Contact them to arrange billing, then Activate: that moves them to the plan straight away and opens any held inquiries.</p>' +
      (S.data.requests.length ? '<div class="list">' + S.data.requests.map(reqItem).join('') + '</div>' : '<div class="empty">No requests yet.</div>');
  }

  // Advertising
  function adTargets(a) {
    var t = [];
    if (a.category_ids.length) t.push(a.category_ids.map(catLabel).join(', '));
    if (a.event_type_ids.length) t.push(a.event_type_ids.map(evLabel).join(', '));
    if (a.location_slugs.length) t.push(a.location_slugs.map(function (s) { var l = by(S.ref.locs, 'slug')[s]; return l ? l.name : s; }).join(', '));
    return t.join(' · ') || 'All pages of this type';
  }
  function viewAds() {
    var plus = S.data.vendors.filter(function (v) { return v.tier === 'spotlight_plus'; });
    var withAds = by(S.data.ads, 'vendor_id');
    var bare = plus.filter(function (v) { return !withAds[v.id]; });
    return '<div class="spread"><h1>Advertising</h1><button class="btn accent" data-act="newAd">+ New placement</button></div>' +
      '<p class="muted">Spotlight+ vendors can appear in a labelled "Sponsored" spot on matching pages. Only <b>active</b> placements of vendors on Spotlight+ show, at most two per page.</p>' +
      (bare.length ? '<div class="card"><h2>Spotlight+ vendors with no placements</h2><div class="list">' + bare.map(function (v) {
        return '<div class="item"><div class="grow"><b>' + esc(v.name) + '</b><span class="muted">' + esc(catLabel(v.category_id)) + '</span></div><button class="btn sm solid" data-act="defaultAds" data-v="' + v.id + '">Create suggested placements</button></div>';
      }).join('') + '</div><span class="muted">Suggested placements start as drafts. Review them, then set them to active.</span></div>' : '') +
      (S.data.ads.length ? '<div class="list">' + S.data.ads.map(function (a) {
        return '<div class="item click" data-act="editAd" data-v="' + a.id + '"><div class="grow"><b>' + esc(a.vendor) + ' · ' + esc(AD_TYPES[a.placement_type]) + '</b>' +
          '<span class="muted">' + esc(adTargets(a)) + (a.starts_on || a.ends_on ? ' · ' + (a.starts_on ? fmtDate(a.starts_on) : '…') + ' to ' + (a.ends_on ? fmtDate(a.ends_on) : '…') : '') + '</span>' +
          '<div class="pills"><span class="pill' + (a.status === 'active' ? ' live' : '') + '">' + a.status + '</span>' + (a.vendor_tier !== 'spotlight_plus' ? '<span class="pill warn">Not on Spotlight+, hidden</span>' : '') + '</div></div></div>';
      }).join('') + '</div>' : '<div class="empty">No placements yet.</div>');
  }
  function viewAdEdit() {
    var d = S.edit.d;
    var v = by(S.data.vendors, 'id')[d.vendor_id];
    return '<button class="btn sm back" data-act="close">← All placements</button><h1>' + (d.id ? 'Edit placement' : 'New placement') + '</h1>' +
      '<div class="card"><div class="grid2">' +
      select('Vendor', 'vendor_id', d.vendor_id, [['', 'Choose a vendor']].concat(S.data.vendors.map(function (x) { return [x.id, x.name + ' · ' + planName(x.tier)]; })),
        v && v.tier !== 'spotlight_plus' ? '<span class="danger">This vendor isn’t on Spotlight+, so the placement won’t show.</span>' : '') +
      select('Where it shows', 'placement_type', d.placement_type, Object.keys(AD_TYPES).map(function (k) { return [k, AD_TYPES[k]]; })) +
      select('Status', 'status', d.status, AD_STATUS.map(function (s) { return [s, s[0].toUpperCase() + s.slice(1)]; })) +
      field('Headline (optional)', 'headline', d.headline, { ph: 'Defaults to the vendor’s tagline' }) +
      field('Starts', 'starts_on', d.starts_on || '', { type: 'date' }) + field('Ends', 'ends_on', d.ends_on || '', { type: 'date' }) + '</div>' +
      '<p class="muted">Targets: leave a group empty to match every page. A category page matches on category, an event page on event type, and so on; articles match on any of their tags.</p>' +
      '<label class="f"><span>Categories</span></label>' + checks('category_ids', S.ref.cats.map(function (c) { return [c.id, c.label]; }), d.category_ids) +
      '<label class="f"><span>Event types</span></label>' + checks('event_type_ids', S.ref.events.map(function (e) { return [e.id, e.label]; }), d.event_type_ids) +
      '<label class="f"><span>Locations</span></label>' + checks('location_slugs', S.ref.locs.map(function (l) { return [l.slug, l.name]; }), d.location_slugs) + '</div>' +
      (d.id ? '<div><button class="btn bad" data-act="deleteAd">Delete placement</button></div>' : '') + saveBar('saveAd', d.id ? 'Save changes' : 'Create placement');
  }

  // Magazine
  function viewPosts() {
    return '<div class="spread"><h1>Magazine</h1><button class="btn accent" data-act="newPost">+ New post</button></div>' +
      (S.data.posts.length ? '<div class="list">' + S.data.posts.map(function (p) {
        return '<div class="item click" data-act="editPost" data-v="' + esc(p.id) + '">' + (p.img_path ? '<img class="thumb" src="' + esc(img(p.img_path)) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') +
          '<div class="grow"><b>' + esc(p.title) + '</b><span class="muted">' + esc(p.section) + ' · ' + fmtDate(p.published_on) + '</span>' +
          '<div class="pills">' + (p.published ? '<span class="pill live">Live</span>' : '<span class="pill draft">Draft</span>') + '</div></div></div>';
      }).join('') + '</div>' : '<div class="empty">No posts yet.</div>');
  }
  function viewPostEdit() {
    var d = S.edit.d; var isNew = !d.original_id;
    return '<button class="btn sm back" data-act="close">← All posts</button><div class="spread"><h1>' + esc(isNew ? 'New post' : d.title || 'Post') + '</h1>' +
      (!isNew && d.published ? '<a class="btn sm" href="/magazine/' + esc(d.original_id) + '/" target="_blank" rel="noopener">View post ↗</a>' : '') + '</div>' +
      '<div class="card"><div class="grid2"><label class="toggle"><input type="checkbox" data-bool="published"' + (d.published ? ' checked' : '') + '> Published</label>' +
      field('Date', 'published_on', d.published_on || '', { type: 'date' }) + '</div></div>' +
      '<div class="card"><div class="grid2">' + field('Title', 'title', d.title) +
      field('Web address', 'id', d.id, { ph: 'made from the title', hint: 'eventorytt.com/magazine/<b>' + esc(d.id || '…') + '</b>/' }) +
      select('Section', 'section', d.section, SECTIONS.map(function (s) { return [s, s]; })) + field('Tag', 'tag', d.tag, { ph: 'e.g. Planning guide' }) +
      field('Author', 'author', d.author, { ph: 'Eventory' }) + field('Read time', 'read_label', d.read_label, { ph: 'e.g. 5 MIN READ' }) + '</div>' +
      field('Summary', 'excerpt', d.excerpt, { textarea: true, rows: 3, hint: 'Shown on the Magazine page and in search results.' }) +
      field('Article', 'bodyText', d.bodyText, { textarea: true, rows: 14, hint: 'Leave a blank line between paragraphs.' }) + '</div>' +
      '<div class="card"><h2>Cover image</h2><div class="photos">' + (d.img_path ? '<div class="photo"><img src="' + esc(img(d.img_path)) + '" alt=""><div class="acts"><button data-act="postImgRemove">Remove</button></div></div>' : '') +
      '<label class="upload">' + (S.busy === 'upload' ? 'UPLOADING…' : '+ UPLOAD IMAGE') + '<input type="file" accept="image/*" data-upload="post"></label></div></div>' +
      '<div class="card"><h2>Related</h2><p class="muted">Links the post from matching event, category and vendor pages.</p>' +
      '<label class="f"><span>Event types</span></label>' + checks('event_type_ids', S.ref.events.map(function (e) { return [e.id, e.label]; }), d.event_type_ids) +
      '<label class="f"><span>Categories</span></label>' + checks('category_ids', S.ref.cats.map(function (c) { return [c.id, c.label]; }), d.category_ids) +
      '<label class="f"><span>Vendors mentioned</span></label>' + checks('vendor_slugs', S.data.vendors.map(function (v) { return [v.slug, v.name]; }), d.vendor_slugs) + '</div>' +
      '<div class="card"><h2>FAQs</h2><p class="muted">Optional questions and answers shown under the article.</p>' +
      d.faqs.map(function (f, i) {
        return '<div class="sub"><div class="spread"><span class="eyebrow">Question ' + (i + 1) + '</span><button class="btn sm quiet" data-act="faqRemove" data-v="' + i + '">Remove</button></div>' +
          field('Question', 'faqs.' + i + '.q', f.q) + field('Answer', 'faqs.' + i + '.a', f.a, { textarea: true, rows: 3 }) + '</div>';
      }).join('') + '<div><button class="btn" data-act="faqAdd">+ Add question</button></div></div>' +
      (!isNew ? '<div><button class="btn bad" data-act="deletePost">Delete post</button></div>' : '') + saveBar('savePost', isNew ? 'Create post' : 'Save changes');
  }

  // Inquiries
  function inqItem(q) {
    var ev = q.event_type === 'other' && q.event_other ? q.event_other : evLabel(q.event_type) || 'Event';
    return '<details class="q"><summary><span class="mono muted">' + fmtWhen(q.created_at) + '</span><b>' + esc(q.name) + '</b><span class="muted">→ ' + esc(q.vendor) + ' · ' + esc(ev) + '</span>' +
      '<span class="pills">' + (q.held ? '<span class="pill warn">Held</span>' : '') + '<span class="pill' + (q.status === 'replied' ? ' live' : '') + '">' + esc(q.status) + '</span></span></summary>' +
      '<div class="body"><div class="kv">' + [['Email', q.email], ['Phone', q.phone || '—'], ['Prefers', q.contact_pref], ['Event date', q.event_date ? fmtDate(q.event_date) : 'Not set'], ['Guests', q.guests || '—'],
        ['Location', q.location || '—'], ['Package', q.package_name || 'Not sure yet'], ['Budget', q.budget || '—'], ['Vendor plan', planName(q.vendor_tier)]].map(function (x) {
        return '<div><span class="eyebrow">' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' +
      '<p style="white-space:pre-wrap;margin:0">' + esc(q.message || 'No message.') + '</p>' +
      (q.held ? '<span class="muted">Held: the vendor reached the no-cost inquiry limit. It opens for them when they move to Spotlight.</span>' : '') + '</div></details>';
  }
  function viewInquiries() {
    var qq = S.q.inquiries.trim().toLowerCase();
    var list = S.data.inquiries.filter(function (q) {
      if (S.q.ivendor && q.vendor_id !== S.q.ivendor) return false;
      return !qq || (q.name + ' ' + q.email + ' ' + q.vendor + ' ' + q.message).toLowerCase().indexOf(qq) >= 0;
    });
    var vendors = S.data.vendors.filter(function (v) { return v.inquiry_count; });
    return '<h1>Inquiries</h1><div class="toolbar"><input type="search" id="iq" data-q="inquiries" placeholder="Search planner, email, vendor, message" value="' + esc(S.q.inquiries) + '">' +
      '<select data-q="ivendor"><option value="">All vendors</option>' + vendors.map(function (v) { return '<option value="' + v.id + '"' + (S.q.ivendor === v.id ? ' selected' : '') + '>' + esc(v.name) + ' (' + v.inquiry_count + ')</option>'; }).join('') + '</select>' +
      '<span class="muted">' + list.length + ' shown</span></div>' +
      (list.length ? '<div class="list">' + list.map(inqItem).join('') + '</div>' : '<div class="empty">No inquiries' + (qq || S.q.ivendor ? ' match.' : ' yet.') + '</div>');
  }

  function render() {
    var a = document.activeElement; var focusId = a && a.id; var caret = a && a.selectionStart;
    var h;
    if (S.phase === 'loading') h = '<div class="loading">LOADING…</div>';
    else if (S.phase === 'signin') h = '<main>' + viewSignin() + '</main>';
    else if (S.phase === 'recovery') h = '<main>' + viewRecovery() + '</main>';
    else if (S.phase === 'denied') h = '<main>' + viewDenied() + '</main>';
    else {
      var body = S.edit ? { vendor: viewVendorEdit, ad: viewAdEdit, post: viewPostEdit }[S.edit.kind]()
        : { overview: viewOverview, vendors: viewVendors, requests: viewRequests, ads: viewAds, posts: viewPosts, inquiries: viewInquiries }[S.tab]();
      h = topbar() + '<main>' + body + '</main>';
    }
    app.innerHTML = h;
    if (focusId) { var el = document.getElementById(focusId); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} } }
  }

  // Editing -----------------------------------------------------------------
  function open(kind, d) { S.edit = { kind: kind, d: d }; S.dirty = false; S.secret = null; render(); window.scrollTo(0, 0); }
  function close(force) {
    if (!force && S.dirty && !confirm('Leave without saving your changes?')) return;
    S.edit = null; S.dirty = false; S.secret = null; render(); window.scrollTo(0, 0);
  }
  function editVendor(id) {
    var v = clone(by(S.data.vendors, 'id')[id]);
    v.specialtiesText = (v.specialties || []).join(', ');
    open('vendor', v);
  }
  function editPost(id) {
    var p = clone(by(S.data.posts, 'id')[id]);
    p.original_id = p.id; p.bodyText = (p.body || []).join('\n\n'); p.faqs = p.faqs || [];
    open('post', p);
  }
  function saveVendor() {
    var d = S.edit.d;
    if (!d.name.trim()) return toast('Add a business name', true);
    var p = clone(d);
    p.specialties = d.specialtiesText.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    p.packages = d.packages.filter(function (x) { return x.name.trim(); });
    ['specialtiesText', 'login_email', 'inquiry_count', 'owner_user_id', 'created_at', 'updated_at'].forEach(function (k) { delete p[k]; });
    S.busy = 'save'; render();
    rpc('admin_save_vendor', { p: p }).then(function (id) {
      return loadAll().then(function () { S.busy = false; editVendor(id); toast('Saved'); });
    }).catch(fail);
  }
  function saveAd() {
    var d = S.edit.d;
    if (!d.vendor_id) return toast('Choose a vendor', true);
    S.busy = 'save'; render();
    rpc('admin_save_ad', { p: d }).then(function () {
      return loadAll().then(function () { S.busy = false; close(true); toast('Saved'); });
    }).catch(fail);
  }
  function savePost() {
    var d = S.edit.d;
    if (!d.title.trim()) return toast('Add a title', true);
    var p = clone(d);
    p.body = d.bodyText.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    p.faqs = d.faqs.filter(function (f) { return f.q.trim() && f.a.trim(); });
    delete p.bodyText;
    S.busy = 'save'; render();
    rpc('admin_save_post', { p: p }).then(function (id) {
      return loadAll().then(function () { S.busy = false; editPost(id); toast('Saved'); });
    }).catch(fail);
  }
  function vendorLogin(action) {
    var d = S.edit.d; var email = action === 'create' ? (document.getElementById('loginEmail') || {}).value : '';
    if (action === 'reset' && !confirm('Set a new temporary password for ' + d.login_email + '? Their current password will stop working.')) return;
    S.busy = 'login'; render();
    sb.functions.invoke('admin-vendor-login', { body: { action: action, vendorId: d.id, email: email } }).then(function (r) {
      if (r.error) {
        var ctx = r.error.context;
        return (ctx && ctx.json ? ctx.json().catch(function () { return {}; }) : Promise.resolve({})).then(function (b) { throw new Error(b.error || r.error.message); });
      }
      S.secret = r.data;
      return loadAll().then(function () {
        S.busy = false; var v = by(S.data.vendors, 'id')[d.id];
        d.login_email = v.login_email; d.owner_user_id = v.owner_user_id; d.email = d.email || v.email; render();
      });
    }).catch(fail);
  }

  // Events ------------------------------------------------------------------
  var ACT = {
    tab: function (el) { if (S.edit) { if (S.dirty && !confirm('Leave without saving your changes?')) return; S.edit = null; S.dirty = false; } S.tab = el.dataset.v; render(); window.scrollTo(0, 0); },
    reload: function () { refresh().then(function () { toast('Up to date'); }); },
    signout: function () { sb.auth.signOut().then(function () { S.phase = 'signin'; S.user = null; S.edit = null; render(); }); },
    forgot: function () {
      var em = (app.querySelector('[name=email]') || {}).value;
      if (!em) { S.err = 'Enter your email first'; return render(); }
      sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/admin/' }).then(function (r) {
        S.err = r.error ? r.error.message : ''; S.note = r.error ? '' : 'Check ' + em + ' for a link to set a new password.'; render();
      });
    },
    close: function () { close(); },
    newVendor: function () { open('vendor', blankVendor()); },
    editVendor: function (el) { editVendor(el.dataset.v); },
    saveVendor: saveVendor,
    deleteVendor: function () {
      var d = S.edit.d;
      if (prompt('Type the vendor’s name to delete it for good:\n' + d.name) !== d.name) return toast('Not deleted');
      rpc('admin_delete_vendor', { p_id: d.id }).then(loadAll).then(function () { close(true); toast('Deleted'); }).catch(fail);
    },
    photoRemove: function (el) { S.edit.d.photos.splice(+el.dataset.v, 1); S.dirty = true; render(); },
    photoFirst: function (el) { var ph = S.edit.d.photos; ph.unshift(ph.splice(+el.dataset.v, 1)[0]); S.dirty = true; render(); },
    pkgAdd: function () { S.edit.d.packages.push({ name: '', price: '', desc: '', img: '' }); S.dirty = true; render(); },
    pkgRemove: function (el) { S.edit.d.packages.splice(+el.dataset.v, 1); S.dirty = true; render(); },
    pkgUp: function (el) { var i = +el.dataset.v, p = S.edit.d.packages; p.splice(i - 1, 0, p.splice(i, 1)[0]); S.dirty = true; render(); },
    loginCreate: function () { vendorLogin('create'); },
    loginReset: function () { vendorLogin('reset'); },
    req: function (el) {
      var r = by(S.data.requests, 'id')[el.dataset.v]; var st = el.dataset.s;
      if (st === 'activated' && !confirm('Move ' + r.vendor + ' to ' + planName(r.tier) + ' now? Do this once billing is arranged.')) return;
      rpc('admin_set_request', { p_id: r.id, p_status: st }).then(refresh).then(function () { toast(st === 'activated' ? r.vendor + ' is now on ' + planName(r.tier) : 'Updated'); }).catch(fail);
    },
    newAd: function () { open('ad', { id: '', vendor_id: '', placement_type: 'category', category_ids: [], event_type_ids: [], location_slugs: [], headline: '', status: 'draft', starts_on: '', ends_on: '' }); },
    editAd: function (el) { open('ad', clone(by(S.data.ads, 'id')[el.dataset.v])); },
    saveAd: saveAd,
    deleteAd: function () { if (!confirm('Delete this placement?')) return; rpc('admin_delete_ad', { p_id: S.edit.d.id }).then(loadAll).then(function () { close(true); toast('Deleted'); }).catch(fail); },
    defaultAds: function (el) { rpc('admin_default_ads', { p_vendor: el.dataset.v }).then(refresh).then(function () { toast('Draft placements created'); }).catch(fail); },
    newPost: function () {
      open('post', { original_id: '', id: '', title: '', section: SECTIONS[0], tag: '', excerpt: '', bodyText: '', img_path: '', author: 'Eventory', read_label: '',
        published_on: new Date().toISOString().slice(0, 10), published: false, event_type_ids: [], category_ids: [], vendor_slugs: [], faqs: [] });
    },
    editPost: function (el) { editPost(el.dataset.v); },
    savePost: savePost,
    deletePost: function () {
      var d = S.edit.d; if (!confirm('Delete "' + d.title + '" for good?')) return;
      rpc('admin_delete_post', { p_id: d.original_id }).then(loadAll).then(function () { close(true); toast('Deleted'); }).catch(fail);
    },
    postImgRemove: function () { S.edit.d.img_path = ''; S.dirty = true; render(); },
    faqAdd: function () { S.edit.d.faqs.push({ q: '', a: '' }); S.dirty = true; render(); },
    faqRemove: function (el) { S.edit.d.faqs.splice(+el.dataset.v, 1); S.dirty = true; render(); },
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    if (el.tagName === 'A') return;
    e.preventDefault();
    var f = ACT[el.dataset.act]; if (f) f(el);
  });
  function onField(e) {
    var el = e.target;
    if (el.dataset.q) { S.q[el.dataset.q] = el.value; return render(); }
    if (!S.edit) return;
    var d = S.edit.d;
    if (el.dataset.k) {
      setPath(d, el.dataset.k, el.value);
      if (el.tagName === 'SELECT') { S.dirty = true; return render(); }
    } else if (el.dataset.arr) {
      var arr = d[el.dataset.arr]; var i = arr.indexOf(el.value);
      if (el.checked && i < 0) arr.push(el.value); if (!el.checked && i >= 0) arr.splice(i, 1);
    } else if (el.dataset.bool) {
      d[el.dataset.bool] = el.checked;
    } else return;
    if (!S.dirty) { S.dirty = true; var bar = app.querySelector('.savebar .muted'); if (bar) bar.textContent = 'Unsaved changes'; }
  }
  document.addEventListener('input', function (e) { if (e.target.tagName !== 'SELECT' && e.target.type !== 'checkbox') onField(e); });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.upload) {
      if (!el.files || !el.files.length) return;
      var d = S.edit.d; var post = el.dataset.upload === 'post';
      S.busy = 'upload'; render();
      uploadPhotos(post ? [el.files[0]] : el.files, post ? 'magazine' : (d.id || 'new')).then(function (urls) {
        if (post) d.img_path = urls[0]; else d.photos = d.photos.concat(urls);
        S.busy = false; S.dirty = true; render();
      }).catch(fail);
      return;
    }
    if (el.tagName === 'SELECT' || el.type === 'checkbox') onField(e);
  });
  document.addEventListener('submit', function (e) {
    var form = e.target; e.preventDefault();
    if (form.dataset.form === 'signin') {
      S.busy = true; S.err = ''; S.note = ''; render();
      var em = form.email.value.trim(), pw = form.password.value;
      sb.auth.signInWithPassword({ email: em, password: pw }).then(function (r) {
        S.busy = false;
        if (r.error) { S.err = /invalid login/i.test(r.error.message) ? 'Wrong email or password' : /not confirmed/i.test(r.error.message) ? 'Confirm your email first: open the link in the sign-up email.' : r.error.message; return render(); }
        start(r.data.session);
      });
    }
    if (form.dataset.form === 'recovery') {
      sb.auth.updateUser({ password: form.password.value }).then(function (r) {
        if (r.error) { S.err = r.error.message; return render(); }
        S.err = ''; sb.auth.getSession().then(function (s) { start(s.data.session); });
      });
    }
  });
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  sb.auth.getSession().then(function (r) { if (S.phase !== 'recovery') start(r.data.session); });
})();
