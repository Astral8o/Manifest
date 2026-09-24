// Public Eventory data for server rendering. Same publishable key and row
// level security as the browser, so the server can only see public rows.
const SUPABASE_URL = 'https://oiwjuvzsydhuhmetcuqk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qYk_KouIw772oOXdIvr7uA_zwhPVmtF';
const TTL_MS = 60 * 1000;

const VENDOR_COLS = 'id,slug,name,category_id,also_categories,location,areas_served,events,from_label,reply_label,tagline,about,instagram,facebook,website,specialties,photos,tier,packages_title,updated_at';

let cache = { at: 0, data: null, pending: null };

async function rest(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} for ${query.split('?')[0]}: ${await res.text()}`);
  return res.json();
}

async function fetchAll() {
  const [categories, events, locations, vendors, packages, posts, ads, plans] = await Promise.all([
    rest('categories?select=id,label,img_path,sort_order,seo_slug,combo_slug,singular,plural,intro,faqs&order=sort_order'),
    rest('event_types?select=id,label,short,needs,sort_order,seo_slug,noun,intro,faqs&order=sort_order'),
    rest('locations?select=slug,name,island&order=name'),
    rest(`vendors?select=${VENDOR_COLS}&published=eq.true&order=created_at`),
    rest('packages?select=vendor_id,name,price_label,description,img_url,sort_order&order=sort_order'),
    rest('blog_posts?select=id,section,tag,title,excerpt,body,img_path,published_on,updated_on,author,read_label,event_type_ids,category_ids,vendor_slugs,faqs&published=eq.true&order=published_on.desc'),
    // Row level security returns only live placements of Spotlight+ vendors.
    rest('ad_placements?select=id,vendor_id,placement_type,category_ids,event_type_ids,location_slugs,headline&order=created_at'),
    rest('vendor_plans?select=*&order=sort_order'),
  ]);
  const byVendor = {};
  for (const p of packages) (byVendor[p.vendor_id] = byVendor[p.vendor_id] || []).push(p);
  for (const v of vendors) v.packages = byVendor[v.id] || [];
  return { categories, events, locations, vendors, posts, ads, plans };
}

// Cached per function instance; the CDN cache in front (s-maxage) does the
// heavy lifting, this just avoids refetching on bursts of cache misses.
async function loadData() {
  if (cache.data && Date.now() - cache.at < TTL_MS) return cache.data;
  if (!cache.pending) {
    cache.pending = fetchAll()
      .then((data) => { cache = { at: Date.now(), data, pending: null }; return data; })
      .catch((e) => { cache.pending = null; if (cache.data) return cache.data; throw e; });
  }
  return cache.pending;
}

module.exports = { loadData };
