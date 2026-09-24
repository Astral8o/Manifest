// Eventory data layer: every read and write the page makes goes through here,
// backed by the "Eventory v2" Supabase project. The page logic (inline
// text/x-dc script in index.html) maps these results onto the design's
// existing view-models, so the UI itself is unchanged.
(function () {
  var SUPABASE_URL = 'https://oiwjuvzsydhuhmetcuqk.supabase.co';
  // Publishable key: safe to ship, access is enforced by row level security.
  var SUPABASE_KEY = 'sb_publishable_qYk_KouIw772oOXdIvr7uA_zwhPVmtF';
  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  var VENDOR_COLS = 'id, slug, owner_user_id, name, category_id, also_categories, location, areas_served, events, from_label, reply_label, tagline, about, instagram, facebook, website, specialties, photos, tier, packages_title, published, updated_at';

  function fail(error) {
    var e = new Error(friendly(error));
    e.cause = error;
    throw e;
  }
  function friendly(error) {
    var m = (error && (error.message || error.error_description)) || String(error || 'Something went wrong');
    if (/invalid login credentials/i.test(m)) return 'Wrong email or password';
    if (/already registered|already exists/i.test(m)) return 'That email already has an account. Sign in instead.';
    if (/email not confirmed/i.test(m)) return 'Confirm your email first. Check your inbox for the link.';
    if (/password should be at least/i.test(m)) return 'At least 8 characters';
    if (/rate limit/i.test(m)) return 'Too many attempts. Try again in a few minutes.';
    if (/failed to fetch|network/i.test(m)) return 'Could not reach Eventory. Check your connection and try again.';
    return m;
  }

  function mapVendor(r, pkgs) {
    return {
      id: r.slug, uuid: r.id, ownerId: r.owner_user_id, name: r.name, cat: r.category_id,
      location: r.location || '', events: r.events || [], from: r.from_label || 'Price on request',
      reply: r.reply_label || '', imgs: (r.photos || []).slice(), tagline: r.tagline || '', about: r.about || '',
      ig: r.instagram || '', fb: r.facebook || '', tier: r.tier || 'basic', email: '', pkgTitle: r.packages_title || '',
      also: r.also_categories || [], website: r.website || '', areas: r.areas_served || [], specialties: r.specialties || [],
      packages: (pkgs || []).map(function (p) {
        return { name: p.name, price: p.price_label || '', desc: p.description || '', img: p.img_url || null, imgUrl: p.img_url || '' };
      }),
    };
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtPostDate(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0] : '';
  }

  function mapInquiry(r, vendorSlug) {
    return {
      id: r.id, vendorId: vendorSlug, eventType: r.event_type || '', eventOther: r.event_other || '',
      date: r.event_date || '', guests: r.guests || '', location: r.location || '', pkg: r.package_name || '',
      budget: r.budget || '', message: r.message || '', name: r.name || '', email: r.email || '',
      phone: r.phone || '', contact: r.contact_pref || 'Email', createdAt: r.created_at,
      status: r.status || 'new', held: !!r.held,
    };
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(','), mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1]), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: mime });
  }

  // Shrinks a photo picked in the join form so uploads stay small (and fit
  // in localStorage while a new vendor confirms their email).
  function shrink(dataUrl, max) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  var PENDING_PHOTOS = 'eventory_pending_photos_v1';

  // Maps the raw public rows (as embedded by the server, or fetched below)
  // onto the shapes the page's design components expect.
  function fromRaw(raw) {
    return {
      raw: raw,
      vendors: raw.vendors.map(function (r) { return mapVendor(r, r.packages); }),
      posts: raw.posts.map(function (p) {
        return { id: p.id, tag: p.section || p.tag, date: fmtPostDate(p.published_on), read: p.read_label, img: p.img_path,
          title: p.title, excerpt: p.excerpt, vendors: p.vendor_slugs || [], body: p.body || [] };
      }),
    };
  }

  var EVDB = {
    client: client,
    // Public data the server rendered this page with (see api/render.js).
    boot: window.__EV_BOOT || null,
    fromRaw: fromRaw,

    loadPublic: async function () {
      if (EVDB.boot && EVDB.boot.data) return fromRaw(EVDB.boot.data);
      var res = await Promise.all([
        client.from('vendors').select(VENDOR_COLS).eq('published', true).order('created_at'),
        client.from('packages').select('vendor_id, name, price_label, description, img_url, sort_order').order('sort_order'),
        client.from('blog_posts').select('*').eq('published', true).order('published_on', { ascending: false }),
        client.from('categories').select('*').order('sort_order'),
        client.from('event_types').select('*').order('sort_order'),
        client.from('locations').select('slug, name, island').order('name'),
        client.from('ad_placements').select('id, vendor_id, placement_type, category_ids, event_type_ids, location_slugs, headline').order('created_at'),
        client.from('vendor_plans').select('*').order('sort_order'),
      ]);
      for (var i = 0; i < res.length; i++) if (res[i].error) fail(res[i].error);
      var byVendor = {};
      res[1].data.forEach(function (p) { (byVendor[p.vendor_id] = byVendor[p.vendor_id] || []).push(p); });
      res[0].data.forEach(function (v) { v.packages = byVendor[v.id] || []; });
      return fromRaw({ vendors: res[0].data, posts: res[2].data, categories: res[3].data, events: res[4].data, locations: res[5].data, ads: res[6].data, plans: res[7].data });
    },

    // Own listing, including an unpublished one the public list leaves out.
    myVendor: async function (userId) {
      var r = await client.from('vendors').select(VENDOR_COLS).eq('owner_user_id', userId).maybeSingle();
      if (r.error) fail(r.error);
      if (!r.data) return null;
      var p = await client.from('packages').select('name, price_label, description, img_url, sort_order').eq('vendor_id', r.data.id).order('sort_order');
      return mapVendor(r.data, p.data || []);
    },

    getUser: async function () {
      var r = await client.auth.getSession();
      return (r.data && r.data.session && r.data.session.user) || null;
    },
    onAuthChange: function (cb) {
      client.auth.onAuthStateChange(function (_event, session) { cb(session ? session.user : null); });
    },
    plannerFromUser: function (u) {
      var md = u.user_metadata || {};
      var name = md.name || md.full_name || (u.email || '').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      return { name: name, email: u.email || '', id: u.id };
    },

    signUpPlanner: async function (name, email, password) {
      var r = await client.auth.signUp({ email: email, password: password,
        options: { data: { role: 'planner', name: name }, emailRedirectTo: location.origin } });
      if (r.error) fail(r.error);
      return { user: r.data.user, session: r.data.session };
    },
    signIn: async function (email, password) {
      var r = await client.auth.signInWithPassword({ email: email, password: password });
      if (r.error) fail(r.error);
      return r.data.user;
    },
    signInGoogle: async function () {
      var r = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
      if (r.error) fail(r.error);
    },
    signOut: async function () { await client.auth.signOut(); },

    // Creates the account; the database trigger creates the listing from
    // this metadata. Photos upload now if we got a session, otherwise they
    // wait in localStorage until the vendor's first sign-in.
    signUpVendor: async function (d) {
      var photos = await Promise.all((d.photos || []).map(function (p) { return shrink(p, 1600); }));
      var r = await client.auth.signUp({
        email: d.email.trim().toLowerCase(), password: d.password,
        options: { emailRedirectTo: location.origin, data: { role: 'vendor', name: d.name.trim(), listing: {
          name: d.name.trim(), cat: d.cat, location: d.location, events: d.events, tagline: d.tagline.trim(),
          from: d.from.trim(), pkgTitle: (d.pkgTitle || '').trim(),
          packages: (d.pkgs || []).filter(function (p) { return p.name.trim(); })
            .map(function (p) { return { name: p.name.trim(), price: (p.price || '').trim(), desc: (p.desc || '').trim() }; }),
          ig: (d.ig || '').trim(), fb: (d.fb || '').trim(), phone: (d.phone || '').trim() } } },
      });
      if (r.error) fail(r.error);
      // Supabase returns a user with no identities for an address that is already registered.
      if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) fail({ message: 'already registered' });
      if (photos.length) {
        try { localStorage.setItem(PENDING_PHOTOS, JSON.stringify({ email: d.email.trim().toLowerCase(), photos: photos })); } catch (e) {}
      }
      if (r.data.session) await EVDB.flushPendingPhotos(r.data.user);
      return { user: r.data.user, session: r.data.session };
    },

    // Replaces the vendor's whole package list (and optionally the section
    // heading) in one database transaction.
    savePackages: async function (vendorUuid, pkgs, title) {
      var r = await client.rpc('set_my_packages', {
        p_vendor: vendorUuid, p_title: title == null ? null : String(title),
        p_packages: pkgs.map(function (p) { return { name: p.name, price: p.price || '', desc: p.desc || '', img: p.imgUrl || '' }; }),
      });
      if (r.error) fail(r.error);
    },

    flushPendingPhotos: async function (user) {
      var pending = null;
      try { pending = JSON.parse(localStorage.getItem(PENDING_PHOTOS)); } catch (e) {}
      if (!pending || !user || pending.email !== (user.email || '').toLowerCase()) return false;
      var v = await client.from('vendors').select('id, photos').eq('owner_user_id', user.id).maybeSingle();
      if (!v.data) return false;
      var urls = [];
      for (var i = 0; i < pending.photos.length; i++) {
        var path = user.id + '/' + Date.now().toString(36) + '-' + i + '.jpg';
        var up = await client.storage.from('vendor-photos').upload(path, dataUrlToBlob(pending.photos[i]), { contentType: 'image/jpeg' });
        if (!up.error) urls.push(client.storage.from('vendor-photos').getPublicUrl(path).data.publicUrl);
      }
      if (urls.length) await client.from('vendors').update({ photos: urls.concat(v.data.photos || []) }).eq('id', v.data.id);
      try { localStorage.removeItem(PENDING_PHOTOS); } catch (e) {}
      return urls.length > 0;
    },

    sendInquiries: async function (vendorUuids, f, plannerId) {
      var rows = vendorUuids.map(function (vid) {
        return { vendor_id: vid, planner_user_id: plannerId || null, event_type: f.eventType || '',
          event_other: f.eventOther || '', event_date: f.date || null, guests: String(f.guests || ''),
          location: f.location || '', package_name: f.pkg || '', budget: f.budget || '', message: f.message || '',
          name: f.name.trim(), email: f.email.trim(), phone: f.phone || '', contact_pref: f.contact || 'Email' };
      });
      // No .select(): anonymous senders can't read inquiries back, by design.
      var r = await client.from('inquiries').insert(rows);
      if (r.error) fail(r.error);
    },

    plannerInquiries: async function (slugByUuid) {
      var r = await client.from('inquiries').select('*').order('created_at', { ascending: false });
      if (r.error) fail(r.error);
      return r.data.map(function (q) { return mapInquiry(q, slugByUuid[q.vendor_id] || q.vendor_id); });
    },
    vendorInbox: async function (vendorSlug) {
      var r = await client.rpc('vendor_inbox');
      if (r.error) fail(r.error);
      return r.data.map(function (q) { return mapInquiry(q, vendorSlug); });
    },
    setInquiryStatus: async function (id, status) {
      var r = await client.rpc('set_inquiry_status', { p_id: id, p_status: status });
      if (r.error) fail(r.error);
    },
    requestTier: async function (vendorUuid, tier) {
      var r = await client.from('spotlight_requests').insert({ vendor_id: vendorUuid, tier: tier });
      if (r.error) fail(r.error);
    },
    // Most recent open plan-change request, so the dashboard can show it.
    pendingTierRequest: async function (vendorUuid) {
      var r = await client.from('spotlight_requests').select('tier, status, created_at').eq('vendor_id', vendorUuid)
        .in('status', ['pending', 'contacted']).order('created_at', { ascending: false }).limit(1);
      if (r.error) fail(r.error);
      return r.data[0] || null;
    },

    savedList: async function () {
      var r = await client.from('saved_vendors').select('vendor_id');
      if (r.error) fail(r.error);
      return r.data.map(function (x) { return x.vendor_id; });
    },
    setSaved: async function (userId, vendorUuid, on) {
      var r = on
        ? await client.from('saved_vendors').upsert({ planner_user_id: userId, vendor_id: vendorUuid })
        : await client.from('saved_vendors').delete().eq('planner_user_id', userId).eq('vendor_id', vendorUuid);
      if (r.error) fail(r.error);
    },
  };

  window.EVDB = EVDB;
})();
