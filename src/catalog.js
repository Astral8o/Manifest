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
    .map((p) => {
      const tuple = [
        p.name,
        p.description,
        Number(p.price_min),
        Number(p.price_max),
        p.unit,
        Number(p.min_qty),
        Number(p.lead_time_days),
      ];
      if (p.group_label) tuple.push(p.group_label);
      return tuple;
    });

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
    email: v.email,
    phone: v.phone,
    instagram: v.instagram,
    facebook: v.facebook,
    logoUrl: v.logo_url,
    coverUrl: v.cover_photo_url,
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
        '*, vendor_promos(*), vendor_reviews(*), vendor_faqs(*), products(*)'
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
