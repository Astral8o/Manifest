import { supabase, supabaseConfigured } from './supabaseClient';

function formatExpiry(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRating(rating, ratingCount) {
  if (rating === null || rating === undefined) return '';
  const n = Number(rating).toFixed(1);
  return ratingCount ? `${n} (${ratingCount})` : n;
}

function reshapeVendor(v) {
  const products = (v.products || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => [
      p.name,
      p.description,
      Number(p.price_min),
      Number(p.price_max),
      p.unit,
      Number(p.min_qty),
      Number(p.lead_time_days),
      p.group_label || '',
      p.photo_url || '',
      p.inclusions || [],
    ]);

  const gallery = (v.vendor_gallery || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((g) => ({ eventType: g.event_type, photoUrl: g.photo_url }));

  return {
    id: v.id,
    code: v.category_code,
    name: v.name,
    city: v.city,
    region: v.region,
    desc: v.description,
    bio: v.bio,
    tags: v.tags || [],
    minGroup: Number(v.min_group),
    lead: Number(v.lead_time_days),
    radius: Number(v.radius_km),
    rating: formatRating(v.rating, v.rating_count),
    response: v.response_time_text,
    priceOnRequest: !!v.price_on_request,
    verified: !!v.verified,
    email: v.email,
    phone: v.phone,
    instagram: v.instagram,
    facebook: v.facebook,
    tiktok: v.tiktok,
    mapLink: v.map_link,
    logoUrl: v.logo_url,
    coverUrl: v.cover_photo_url,
    subcategory: v.subcategory,
    contactPerson: v.contact_person,
    country: v.country,
    startingPrice: v.starting_price === null || v.starting_price === undefined ? null : Number(v.starting_price),
    policies: (v.vendor_policies || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ title: p.title, body: p.body })),
    menuItems: (v.menu_items || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.name),
    promos: (v.vendor_promos || []).map((p) => ({
      title: p.title,
      discount: p.discount,
      description: p.description,
      expires: formatExpiry(p.expires_at),
    })),
    reviews: (v.vendor_reviews || []).map((r) => ({
      author: r.author,
      stars: r.stars,
      text: r.body,
    })),
    faqs: (v.vendor_faqs || []).map((f) => ({ q: f.question, a: f.answer })),
    gallery,
    products,
  };
}

export async function fetchCatalog() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const [{ data: categories, error: catError }, { data: vendors, error: venError }] = await Promise.all([
    supabase.from('categories').select('code, name, description').order('sort_order'),
    supabase
      .from('vendors')
      .select(
        '*, vendor_promos(*), vendor_reviews(*), vendor_faqs(*), products(*), vendor_gallery(*), vendor_policies(*), menu_items(*)'
      )
      .eq('published', true)
      .order('name'),
  ]);

  if (catError) throw catError;
  if (venError) throw venError;

  return {
    cats: (categories || []).map((c) => [c.code, c.name, c.description]),
    suppliers: (vendors || []).map(reshapeVendor),
  };
}

// Submits a buyer's cart as one inquiry row plus one inquiry_vendor_groups row
// per vendor (matching the "one inquiry per vendor" model), each with its items.
//
// IDs are generated client-side (rather than read back with .select()) because
// inquiries/inquiry_vendor_groups intentionally have no public SELECT policy —
// Postgres RLS treats INSERT ... RETURNING as requiring a SELECT policy too, so
// reading the row back after insert would fail even though the insert itself
// is allowed.
export async function submitInquiry({ buyer, groups }) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const inquiryId = crypto.randomUUID();
  const { error: inquiryError } = await supabase.from('inquiries').insert({
    id: inquiryId,
    buyer_name: buyer.name || null,
    buyer_email: buyer.email,
    buyer_phone: buyer.phone || null,
    event_date: buyer.eventDate || null,
    guests_expected: buyer.guestsExpected ? Number(buyer.guestsExpected) : null,
    event_time: buyer.eventTime || null,
    fulfilment: buyer.fulfilment || null,
    venue_address: buyer.venueAddress || null,
    access_notes: buyer.accessNotes || null,
    promo_opt_in: !!buyer.promoOptIn,
  });

  if (inquiryError) throw inquiryError;

  for (const group of groups) {
    const groupId = crypto.randomUUID();
    const { error: groupError } = await supabase.from('inquiry_vendor_groups').insert({
      id: groupId,
      inquiry_id: inquiryId,
      vendor_id: group.vendorId,
      note_to_vendor: group.note || null,
    });

    if (groupError) throw groupError;

    const itemRows = group.items.map((item) => ({
      inquiry_vendor_group_id: groupId,
      product_id: item.productId || null,
      product_name: item.name,
      qty: item.qty,
      spec_answers: item.specAnswers || {},
    }));

    const { error: itemsError } = await supabase.from('inquiry_items').insert(itemRows);
    if (itemsError) throw itemsError;
  }

  return inquiryId;
}

// New reviews are inserted with the default status ('pending') and only
// become visible once approved, per the vendor_reviews RLS policy.
export async function submitVendorReview({ vendorId, author, stars, body }) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendor_reviews').insert({
    vendor_id: vendorId,
    author,
    stars,
    body,
  });

  if (error) throw error;
}

// Passwordless sign-in: emails a magic link. shouldCreateUser defaults to
// true, so this also signs up a new account on first use — one flow for
// both. The session lands via Supabase's own redirect handling once the
// link is clicked (see the onAuthStateChange listener in App.jsx).
export async function sendMagicLink(email) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });

  if (error) throw error;
}

export async function joinWaitlist(email) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('waitlist_signups').insert({ email });

  if (error) throw error;
}

export async function adminListVendors() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, category_code, city, published, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function adminSetPublished(vendorId, published) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendors').update({ published }).eq('id', vendorId);
  if (error) throw error;
}

// Creates a vendor plus its packages, gallery photos and FAQs in one call.
// Not wrapped in a database transaction (the JS client can't span tables),
// so a failure partway through can leave an incomplete draft — acceptable
// for a single-admin tool; the draft row is easy to fix or delete by hand.
export async function adminCreateVendor(v) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      category_code: v.categoryCode,
      name: v.name,
      city: v.city,
      region: v.region,
      bio: v.bio,
      description: v.description,
      phone: v.phone,
      logo_url: v.logoUrl || null,
      cover_photo_url: v.coverUrl || null,
      min_group: 1,
      lead_time_days: 0,
      radius_km: 0,
      price_on_request: false,
      published: !!v.published,
    })
    .select('id')
    .single();
  if (vendorError) throw vendorError;
  const vendorId = vendor.id;

  if (v.packages && v.packages.length) {
    const { error } = await supabase.from('products').insert(
      v.packages.map((p, i) => ({
        vendor_id: vendorId,
        name: p.name,
        description: p.description,
        price_min: p.priceMin,
        price_max: p.priceMax,
        unit: p.unit || 'event',
        min_qty: 1,
        lead_time_days: 0,
        photo_url: p.photoUrl || null,
        inclusions: p.inclusions || [],
        sort_order: i,
      }))
    );
    if (error) throw error;
  }

  if (v.gallery && v.gallery.length) {
    const { error } = await supabase.from('vendor_gallery').insert(
      v.gallery.map((g, i) => ({
        vendor_id: vendorId,
        event_type: g.eventType,
        photo_url: g.photoUrl,
        sort_order: i,
      }))
    );
    if (error) throw error;
  }

  if (v.faqs && v.faqs.length) {
    const { error } = await supabase.from('vendor_faqs').insert(
      v.faqs.map((f) => ({ vendor_id: vendorId, question: f.q, answer: f.a }))
    );
    if (error) throw error;
  }

  const policyFields = [
    ['Payment', v.paymentTerms],
    ['Deposit', v.depositTerms],
    ['Rescheduling', v.reschedulePolicy],
    ['Cancellation & refunds', v.cancellationPolicy],
  ].filter(([, body]) => body && body.trim());
  if (policyFields.length) {
    const { error } = await supabase.from('vendor_policies').insert(
      policyFields.map(([title, body], i) => ({ vendor_id: vendorId, title, body, sort_order: i }))
    );
    if (error) throw error;
  }

  return vendorId;
}

// Vendor self-serve onboarding: a real (email + password) account, distinct
// from the passwordless magic-link flow buyers use.
export async function signUpVendor(email, password) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInVendor(email, password) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// Uploads one file into the signed-in user's own folder in the public
// vendor-media bucket and returns its public URL.
export async function uploadVendorMedia(file) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be signed in to upload photos.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('vendor-media').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('vendor-media').getPublicUrl(path);
  return data.publicUrl;
}

// Step 1 of onboarding: creates the vendor's own account plus a minimal
// draft vendor row owned by that account.
export async function createVendorAccount(payload) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { user, session } = await signUpVendor(payload.email, payload.password);
  if (!user) {
    throw new Error('Could not create your account. Please try again.');
  }
  if (!session) {
    throw new Error(
      'That email already has an account, or needs to be confirmed before continuing. Check your inbox for a confirmation link, or sign in instead if you already have an account.'
    );
  }
  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({
      owner_user_id: user.id,
      category_code: payload.categoryCode,
      subcategory: payload.subcategory || null,
      name: payload.name,
      contact_person: payload.contactPerson,
      country: payload.country,
      city: payload.city,
      region: payload.city,
      phone: payload.phone,
      email: payload.email,
      starting_price: payload.startingPrice || null,
      min_group: 1,
      lead_time_days: 0,
      radius_km: 0,
      price_on_request: false,
      published: false,
    })
    .select('id')
    .single();
  if (error) throw error;
  return vendor.id;
}

// Step 2 of onboarding: fills in the rest of the profile and submits the
// application. Stays unpublished — an admin reviews and publishes it from
// the admin dashboard.
export async function submitVendorOnboarding(vendorId, v) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error: updateError } = await supabase
    .from('vendors')
    .update({
      bio: v.bio,
      description: v.description,
      logo_url: v.logoUrl || null,
      cover_photo_url: v.coverUrl || null,
      instagram: v.instagram || null,
      tiktok: v.tiktok || null,
      map_link: v.mapLink || null,
    })
    .eq('id', vendorId);
  if (updateError) throw updateError;

  if (v.albums && v.albums.length) {
    const { error } = await supabase.from('vendor_gallery').insert(
      v.albums.flatMap((a) =>
        (a.photos && a.photos.length ? a.photos : ['']).filter(Boolean).map((photoUrl, i) => ({
          vendor_id: vendorId,
          event_type: a.name,
          photo_url: photoUrl,
          sort_order: i,
        }))
      )
    );
    if (error) throw error;
  }

  if (v.packages && v.packages.length) {
    const { error } = await supabase.from('products').insert(
      v.packages.map((p, i) => ({
        vendor_id: vendorId,
        name: p.name,
        description: p.description,
        price_min: p.priceMin,
        price_max: p.priceMax,
        unit: p.unit || 'event',
        min_qty: 1,
        lead_time_days: 0,
        photo_url: p.photoUrl || null,
        inclusions: p.inclusions || [],
        sort_order: i,
      }))
    );
    if (error) throw error;
  }

  if (v.menu && v.menu.length) {
    const { error } = await supabase.from('menu_items').insert(
      v.menu.map((name, i) => ({ vendor_id: vendorId, name, sort_order: i }))
    );
    if (error) throw error;
  }

  if (v.faqs && v.faqs.length) {
    const { error } = await supabase.from('vendor_faqs').insert(
      v.faqs.map((f) => ({ vendor_id: vendorId, question: f.q, answer: f.a }))
    );
    if (error) throw error;
  }

  if (v.policies && v.policies.length) {
    const { error } = await supabase.from('vendor_policies').insert(
      v.policies.map((p, i) => ({ vendor_id: vendorId, title: p.title, body: p.body, sort_order: i }))
    );
    if (error) throw error;
  }
}

// A single-vendor quote request from a signed-in buyer. Distinct from the
// old multi-vendor inquiries table: one submission always targets exactly
// one vendor.
export async function submitQuoteRequest(request) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be signed in to send a quote request.');

  const { error } = await supabase.from('quote_requests').insert({
    vendor_id: request.vendorId,
    buyer_user_id: user.id,
    event_type: request.eventType,
    event_type_other: request.eventTypeOther || null,
    event_date: request.eventDate || null,
    venue: request.venue || null,
    category_answers: request.categoryAnswers || {},
    contact_name: request.contactName,
    contact_email: request.contactEmail,
    contact_phone: request.contactPhone || null,
  });

  if (error) throw error;
}

export async function submitPlanningRequest(request) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('planning_requests').insert({
    event_label: request.eventLabel,
    event_date: request.eventDate || null,
    location: request.location || null,
    category_codes: request.categoryCodes,
    budget_label: request.budgetLabel || null,
    contact_name: request.contactName,
    contact_phone: request.contactPhone,
    contact_email: request.contactEmail || null,
  });

  if (error) throw error;
}
