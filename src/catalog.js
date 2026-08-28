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
    codes: v.category_codes && v.category_codes.length ? v.category_codes : [v.category_code],
    otherCategory: v.other_category || '',
    name: v.name,
    city: v.city,
    region: v.region,
    addressLine1: v.address_line1 || '',
    addressLine2: v.address_line2 || '',
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
    .select('id, name, category_code, city, published, submitted_at, created_at, email, owner_user_id')
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

// Vendor-facing: marks a listing as ready for admin review. Doesn't lock
// anything — the vendor can keep editing before or after calling this.
export async function submitVendorForReview(vendorId) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendors').update({ submitted_at: new Date().toISOString() }).eq('id', vendorId);
  if (error) throw error;
}

// Creates a real login for a vendor the admin built a profile for, via an
// edge function running under the service role — this does NOT sign the
// admin's own browser in as the new account, unlike a plain client-side
// signUp() would. The password it sets is random and thrown away; call
// sendVendorAccountSetupEmail() right after so the vendor sets their own.
export async function adminCreateVendorLogin(vendorId, email) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.functions.invoke('admin-create-vendor-login', {
    body: { vendorId, email },
  });
  if (error) {
    let message = error.message;
    try {
      if (error.context && typeof error.context.text === 'function') {
        message = (await error.context.text()) || message;
      }
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return data;
}

export async function sendVendorAccountSetupEmail(email) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  if (error) throw error;
}

export async function updateVendorPassword(password) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.auth.updateUser({ password });
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
      email: v.email || null,
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
  // Tags the auth user as a vendor account (persists in user_metadata across
  // sessions/devices) so the app can route a signed-in user to the vendor
  // dashboard instead of the buyer one, even before they have a listing —
  // e.g. right after confirming their email.
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role: 'vendor' } } });
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
async function insertVendorRow(ownerUserId, payload) {
  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({
      owner_user_id: ownerUserId,
      category_code: payload.categoryCode,
      category_codes: payload.categoryCodes && payload.categoryCodes.length ? payload.categoryCodes : null,
      other_category: payload.otherCategory || null,
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
  if (error) {
    if (error.message && /row-level security/i.test(error.message)) {
      throw new Error('That email already has an account. Please sign in instead, or use a different email address.');
    }
    throw error;
  }
  return vendor.id;
}

export async function createVendorAccount(payload) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { user, session } = await signUpVendor(payload.email, payload.password);
  if (!user) {
    throw new Error('Could not create your account. Please try again.');
  }
  // Supabase signals "this email already has an account" by returning the
  // user with an empty identities array — this can happen even when it
  // still hands back a (non-functional, stale) session, so it must be
  // checked before the session check below, not instead of it.
  if (user.identities && user.identities.length === 0) {
    throw new Error('That email already has an account. Please sign in instead, or use a different email address.');
  }
  if (!session) {
    throw new Error(
      'That email needs to be confirmed before continuing. Check your inbox for a confirmation link, or sign in instead if you already have an account.'
    );
  }
  return insertVendorRow(user.id, payload);
}

// For a vendor who already has a confirmed, signed-in account but no
// vendor row yet (e.g. their email confirmation landed them back signed
// in, but the original signup attempt never got to create the listing).
// Skips signUp entirely — calling it again on an existing account always
// fails — and just creates the listing under the current session.
export async function createVendorListing(payload) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You need to be signed in.');
  }
  // The dashboard (fetchMyVendor) assumes exactly one vendor row per
  // account — a second one breaks it outright rather than just looking
  // odd, so this has to be checked up front rather than left to a
  // database constraint.
  const { data: existing, error: existingError } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    throw new Error('This account already has a vendor listing. Sign in and use your dashboard to edit it, or use a different email for a second business.');
  }
  return insertVendorRow(user.id, payload);
}

// ---- Vendor self-service dashboard ----
// Unlike reshapeVendor() (used for the public catalog), these keep each
// child row's real database id, since the dashboard needs it to edit or
// delete individual packages/photos/FAQs/policies/menu items.

export async function fetchMyVendor() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be signed in.');

  const { data, error } = await supabase
    .from('vendors')
    .select('*, products(*), vendor_gallery(*), vendor_faqs(*), vendor_policies(*), menu_items(*)')
    .eq('owner_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    categoryCode: data.category_code,
    subcategory: data.subcategory || '',
    city: data.city,
    addressLine1: data.address_line1 || '',
    addressLine2: data.address_line2 || '',
    contactPerson: data.contact_person || '',
    phone: data.phone || '',
    email: data.email || '',
    bio: data.bio || '',
    description: data.description || '',
    logoUrl: data.logo_url || '',
    coverUrl: data.cover_photo_url || '',
    instagram: data.instagram || '',
    facebook: data.facebook || '',
    tiktok: data.tiktok || '',
    mapLink: data.map_link || '',
    startingPrice: data.starting_price === null || data.starting_price === undefined ? null : Number(data.starting_price),
    published: !!data.published,
    submittedAt: data.submitted_at || null,
    packages: (data.products || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        priceMin: Number(p.price_min),
        priceMax: Number(p.price_max),
        unit: p.unit,
        photoUrl: p.photo_url || '',
        inclusions: p.inclusions || [],
      })),
    gallery: (data.vendor_gallery || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => ({ id: g.id, eventType: g.event_type, photoUrl: g.photo_url })),
    menu: (data.menu_items || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ id: m.id, name: m.name })),
    faqs: (data.vendor_faqs || []).map((f) => ({ id: f.id, q: f.question, a: f.answer })),
    policies: (data.vendor_policies || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ id: p.id, title: p.title, body: p.body })),
  };
}

export async function updateVendorProfile(vendorId, v) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase
    .from('vendors')
    .update({
      subcategory: v.subcategory || null,
      contact_person: v.contactPerson,
      phone: v.phone,
      city: v.city,
      region: v.city,
      address_line1: v.addressLine1 || null,
      address_line2: v.addressLine2 || null,
      bio: v.bio,
      description: v.description,
      logo_url: v.logoUrl || null,
      cover_photo_url: v.coverUrl || null,
      instagram: v.instagram || null,
      facebook: v.facebook || null,
      tiktok: v.tiktok || null,
      map_link: v.mapLink || null,
      starting_price: v.startingPrice || null,
    })
    .eq('id', vendorId);
  if (error) throw error;
}

export async function addVendorPackage(vendorId, p) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('products')
    .insert({
      vendor_id: vendorId,
      name: p.name,
      description: p.description || '',
      price_min: p.priceMin,
      price_max: p.priceMax,
      unit: p.unit || 'event',
      min_qty: 1,
      lead_time_days: 0,
      photo_url: p.photoUrl || null,
      inclusions: p.inclusions || [],
      sort_order: p.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVendorPackage(id) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function addVendorGalleryPhoto(vendorId, g) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('vendor_gallery')
    .insert({ vendor_id: vendorId, event_type: g.eventType, photo_url: g.photoUrl, sort_order: g.sortOrder || 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVendorGalleryPhoto(id) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendor_gallery').delete().eq('id', id);
  if (error) throw error;
}

export async function addVendorMenuItem(vendorId, name) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase.from('menu_items').insert({ vendor_id: vendorId, name }).select().single();
  if (error) throw error;
  return data;
}

export async function removeVendorMenuItem(id) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function addVendorFaq(vendorId, f) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('vendor_faqs')
    .insert({ vendor_id: vendorId, question: f.q, answer: f.a })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVendorFaq(id) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendor_faqs').delete().eq('id', id);
  if (error) throw error;
}

export async function addVendorPolicy(vendorId, p) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('vendor_policies')
    .insert({ vendor_id: vendorId, title: p.title, body: p.body, sort_order: p.sortOrder || 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVendorPolicy(id) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('vendor_policies').delete().eq('id', id);
  if (error) throw error;
}

// Quote requests received by a vendor. Filtered explicitly by vendor_id
// (rather than relying on RLS alone) so an admin or dual-role account never
// sees unrelated buyer-side rows mixed in here.
export async function fetchVendorQuoteRequests(vendorId) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('quote_requests')
    .select('id, event_type, event_type_other, event_date, venue, category_answers, contact_name, contact_email, contact_phone, status, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    eventType: r.event_type_other || r.event_type,
    eventDate: r.event_date,
    venue: r.venue,
    categoryAnswers: r.category_answers || {},
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    status: r.status,
    createdAt: r.created_at,
  }));
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

// The signed-in buyer's own quote requests, newest first. RLS already
// restricts quote_requests SELECT to the caller's own buyer_user_id, so no
// explicit filter is needed here.
export async function fetchMyQuoteRequests() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await supabase
    .from('quote_requests')
    .select('id, vendor_id, event_type, event_type_other, event_date, venue, status, created_at, vendors(name, category_code)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    vendorId: r.vendor_id,
    vendorName: r.vendors ? r.vendors.name : 'Vendor',
    categoryCode: r.vendors ? r.vendors.category_code : null,
    eventType: r.event_type_other || r.event_type,
    eventDate: r.event_date,
    venue: r.venue,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function submitSpotlightInterest({ plan, businessName, email, phone }) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('spotlight_leads').insert({
    plan,
    business_name: businessName,
    email,
    phone: phone || null,
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

// company is a honeypot — real users never see or fill this field (it's
// visually hidden), so anything landing here is almost certainly a bot and
// gets dropped silently rather than surfaced as a submission error.
export async function submitContactMessage({ name, email, message, company }) {
  if (company) return;
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.from('contact_messages').insert({ name, email, message });
  if (error) throw error;
}
