import { useState, useEffect, useRef } from 'react';
import {
  LOCATIONS,
  FIELDS,
  FIELDS_DEFAULT,
  money,
} from './data';
import {
  fetchCatalog,
  fetchUnclaimedBusinesses,
  fetchVendorDetail,
  submitVendorReview,
  sendMagicLink,
  submitPlanningRequest,
  submitQuoteRequest,
  fetchMyQuoteRequests,
  adminListVendors,
  adminSetPublished,
  submitVendorForReview,
  adminCreateVendor,
  adminBulkCreateVendors,
  adminCreateVendorLogin,
  sendVendorAccountSetupEmail,
  updateVendorPassword,
  createVendorAccount,
  createVendorListing,
  uploadVendorMedia,
  signInVendor,
  fetchMyVendor,
  updateVendorProfile,
  addVendorPackage,
  removeVendorPackage,
  addVendorGalleryPhoto,
  removeVendorGalleryPhoto,
  addVendorMenuItem,
  removeVendorMenuItem,
  addVendorFaq,
  removeVendorFaq,
  addVendorPolicy,
  removeVendorPolicy,
  addVendorPromo,
  removeVendorPromo,
  fetchVendorQuoteRequests,
  submitSpotlightInterest,
  submitContactMessage,
  submitSourcingRequest,
} from './catalog';
import { supabase } from './supabaseClient';
import wineGlassesEventPhoto from './assets/wine glasses event.jpg';
import photographerPhoto from './assets/photographer.jpg';
import videographersPhoto from './assets/videographers.jpg';
import weddingVenuePhoto from './assets/wedding venue.jpg';
import weddingVenue2Photo from './assets/wedding venue 2.jpg';
import cateringPhoto1 from './assets/catering 1.jpg';
import cateringSpreadPhoto from './assets/catering spread.jpg';
import soundSystemPhoto from './assets/sound system.jpg';

// Real event photography, used as the fallback whenever a vendor or product
// has no photo of its own yet (Featured Vendors / Featured Offerings on the
// homepage) — matched to the vendor's own category rather than the generic
// Picsum placeholder the rest of the site still falls back to, so a caterer
// gets a food photo and a production/AV vendor gets the speaker photo, etc.
const DEFAULT_FALLBACK_PHOTOS = [
  weddingVenuePhoto,
  weddingVenue2Photo,
  photographerPhoto,
  videographersPhoto,
  cateringPhoto1,
  cateringSpreadPhoto,
  soundSystemPhoto,
];
const CATEGORY_FALLBACK_PHOTOS = {
  'CAT.01': [cateringPhoto1, cateringSpreadPhoto], // Catering
  'CAT.02': [weddingVenuePhoto, weddingVenue2Photo], // Venues
  'CAT.06': [soundSystemPhoto], // Production
  'CAT.08': [photographerPhoto, videographersPhoto], // Photography
  'CAT.09': [soundSystemPhoto, videographersPhoto], // Entertainment
};
const fallbackPhotoFor = (categoryCode, seed) => {
  const pool = CATEGORY_FALLBACK_PHOTOS[categoryCode] || DEFAULT_FALLBACK_PHOTOS;
  return pool[seed % pool.length];
};

// Small line-icon set for the "Browse by category" tiles — one shape per
// category code, same stroke style as the icons used elsewhere in the app
// (24x24 viewBox, currentColor-able stroke). Kept as simple geometric marks
// rather than detailed illustrations so they read cleanly at tile size.
function CategoryIcon({ code, size = 26, color = '#5B5B5B' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (code) {
    case 'CAT.01': // Catering
      return (
        <svg {...props}>
          <path d="M5 2v7a2 2 0 0 0 4 0V2" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <path d="M17 2c-2 2-3 4-3 7a3 3 0 0 0 3 3v10" />
        </svg>
      );
    case 'CAT.02': // Venues
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <rect x="9" y="7" width="2" height="2" />
          <rect x="13" y="7" width="2" height="2" />
          <rect x="9" y="11" width="2" height="2" />
          <rect x="13" y="11" width="2" height="2" />
          <rect x="9" y="16" width="6" height="5" />
        </svg>
      );
    case 'CAT.03': // Décor
      return (
        <svg {...props}>
          <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
        </svg>
      );
    case 'CAT.04': // Rentals
      return (
        <svg {...props}>
          <path d="M6 10V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
          <path d="M4 10h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" />
          <line x1="6" y1="16" x2="6" y2="21" />
          <line x1="18" y1="16" x2="18" y2="21" />
        </svg>
      );
    case 'CAT.05': // Staging
      return (
        <svg {...props}>
          <path d="M3 20h18" />
          <path d="M6 20l3-8h6l3 8" />
          <path d="M12 4l-3 6h6l-3-6z" />
        </svg>
      );
    case 'CAT.06': // Production
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <circle cx="12" cy="8" r="3" />
          <circle cx="12" cy="16" r="4" />
        </svg>
      );
    case 'CAT.07': // Lighting
      return (
        <svg {...props}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
        </svg>
      );
    case 'CAT.08': // Photography
      return (
        <svg {...props}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'CAT.09': // Entertainment
      return (
        <svg {...props}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'CAT.10': // Event Agencies
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'CAT.11': // Printing & Signage
      return (
        <svg {...props}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case 'CAT.12': // Merchandise
      return (
        <svg {...props}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'CAT.13': // Logistics
      return (
        <svg {...props}>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'CAT.14': // Security & Safety
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'CAT.15': // Cakes & Desserts
      return (
        <svg {...props}>
          <path d="M12 2v4" />
          <path d="M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" />
          <path d="M3 21h18" />
          <path d="M5 14c1-2 2-2 3 0s2 2 3 0 2-2 3 0 2 2 3 0" />
        </svg>
      );
    case 'CAT.16': // Hair, Makeup & Styling
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case 'CAT.17': // Staffing Agencies
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'CAT.18': // Favors & Gifts
      return (
        <svg {...props}>
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

const EVENT_TYPES = [
  { key: 'wedding', label: 'Wedding' },
  { key: 'corporate', label: 'Corporate Event' },
  { key: 'launch', label: 'Product Launch' },
  { key: 'babyShower', label: 'Baby Shower' },
  { key: 'familyDay', label: 'Family Day' },
  { key: 'birthday', label: 'Birthday Party' },
  { key: 'other', label: 'Other' },
];

// Two-tier taxonomy for the "Plan my event" modal: a broad celebration type
// (step 1) narrows down to a specific occasion (step 2), which then drives
// the pre-checked vendor category suggestions in the category step.
const CELEBRATION_TYPES = [
  { key: 'weddings', label: 'Weddings', hint: 'e.g. ceremonies, receptions' },
  { key: 'celebrations', label: 'Celebrations', hint: 'e.g. birthdays, graduations' },
  { key: 'familyBaby', label: 'Family & Baby', hint: 'e.g. baby showers, gender reveals' },
  { key: 'corporate', label: 'Corporate', hint: 'e.g. family days, launches' },
  { key: 'culturalReligious', label: 'Cultural & Religious', hint: 'e.g. Divali, Eid' },
  { key: 'gatherings', label: 'Gatherings', hint: 'e.g. reunions, limes' },
];

const OCCASIONS_BY_CELEBRATION_TYPE = {
  weddings: ['Ceremony', 'Reception', 'Engagement Party', 'Bridal Shower', 'Vow Renewal'],
  celebrations: ['First Birthday', 'Birthday Party', 'Sweet 16', 'Christening', 'Graduation', 'Retirement', 'Anniversary'],
  familyBaby: ['Baby Shower', 'Gender Reveal', 'Naming Ceremony'],
  corporate: ['Family Day', 'Year-End Party', 'Company Launch', 'Staff Appreciation', 'Conference/Seminar', 'Team Retreat'],
  culturalReligious: ['Divali', 'Eid', 'Hosay', 'Phagwa', 'Church Anniversary', 'Prayer Function'],
  gatherings: ['Family Reunion', 'School Reunion', 'Lime / Cook-out'],
};

// Suggested vendor categories per occasion, by category name (matched
// against the live CATS list fetched from Supabase) — used to pre-check
// the category step so buyers start from a sensible default and just
// adjust from there, rather than a blank slate.
const OCCASION_SUGGESTED_CATEGORIES = {
  'Ceremony': ['Venues', 'Décor', 'Photography', 'Event Agencies'],
  'Reception': ['Catering', 'Venues', 'Décor', 'Entertainment', 'Photography', 'Cakes & Desserts'],
  'Engagement Party': ['Catering', 'Venues', 'Décor', 'Photography', 'Hair, Makeup & Styling'],
  'Bridal Shower': ['Catering', 'Décor', 'Entertainment', 'Favors & Gifts'],
  'Vow Renewal': ['Venues', 'Décor', 'Photography', 'Catering'],
  'First Birthday': ['Catering', 'Décor', 'Entertainment', 'Photography', 'Cakes & Desserts', 'Favors & Gifts'],
  'Birthday Party': ['Catering', 'Décor', 'Entertainment', 'Photography', 'Cakes & Desserts'],
  'Sweet 16': ['Catering', 'Décor', 'Entertainment', 'Photography', 'Cakes & Desserts', 'Hair, Makeup & Styling'],
  'Christening': ['Catering', 'Décor', 'Photography', 'Venues', 'Cakes & Desserts'],
  'Graduation': ['Catering', 'Décor', 'Photography', 'Venues', 'Cakes & Desserts'],
  'Retirement': ['Catering', 'Décor', 'Entertainment', 'Photography'],
  'Anniversary': ['Catering', 'Décor', 'Entertainment', 'Photography', 'Venues', 'Cakes & Desserts'],
  'Baby Shower': ['Catering', 'Décor', 'Entertainment', 'Favors & Gifts', 'Cakes & Desserts'],
  'Gender Reveal': ['Catering', 'Décor', 'Production', 'Cakes & Desserts'],
  'Naming Ceremony': ['Catering', 'Décor', 'Venues'],
  'Family Day': ['Catering', 'Rentals', 'Entertainment', 'Staging', 'Production', 'Security & Safety'],
  'Year-End Party': ['Catering', 'Venues', 'Décor', 'Entertainment', 'Production', 'Lighting'],
  'Company Launch': ['Venues', 'Staging', 'Production', 'Lighting', 'Photography', 'Printing & Signage'],
  'Staff Appreciation': ['Catering', 'Venues', 'Entertainment', 'Favors & Gifts'],
  'Conference/Seminar': ['Venues', 'Staging', 'Production', 'Printing & Signage', 'Logistics', 'Staffing Agencies'],
  'Team Retreat': ['Venues', 'Catering', 'Logistics'],
  'Divali': ['Catering', 'Décor', 'Lighting', 'Entertainment'],
  'Eid': ['Catering', 'Décor', 'Venues'],
  'Hosay': ['Catering', 'Décor', 'Production'],
  'Phagwa': ['Catering', 'Décor', 'Entertainment'],
  'Church Anniversary': ['Catering', 'Décor', 'Venues', 'Production'],
  'Prayer Function': ['Catering', 'Décor', 'Rentals'],
  'Family Reunion': ['Catering', 'Venues', 'Rentals', 'Entertainment'],
  'School Reunion': ['Catering', 'Venues', 'Entertainment', 'Photography'],
  'Lime / Cook-out': ['Catering', 'Rentals', 'Entertainment'],
};

// Trinidad's 14 municipal corporations (city/borough/regional). Tobago sits
// outside this system entirely — it's governed by the Tobago House of
// Assembly, hence the separate Country field.
const MUNICIPALITIES = [
  'Port of Spain',
  'San Fernando',
  'Arima',
  'Chaguanas',
  'Point Fortin',
  'Diego Martin',
  'San Juan/Laventille',
  'Tunapuna/Piarco',
  'Sangre Grande',
  'Couva/Tabaquite/Talparo',
  'Princes Town',
  'Mayaro/Rio Claro',
  'Penal/Debe',
  'Siparia',
];

const MONO = "'IBM Plex Mono', monospace";
const SANS = 'Manrope, sans-serif';
const DISPLAY = 'Archivo, Helvetica, sans-serif';
const DISPLAY_BLACK = "'Archivo Black', Archivo, sans-serif";
const ACCOUNT_KEY = 'eventoryAccount';
const ADMIN_EMAIL = 'astral.ochoa@hotmail.com';
// Fallback so pages that assume "there's always at least one vendor" don't
// crash on a fresh catalog with zero vendors published yet (e.g. the admin
// tool has to be usable before any vendor exists).
const EMPTY_SUPPLIER = {
  id: '',
  code: '',
  name: '',
  city: '',
  region: '',
  desc: '',
  bio: '',
  tags: [],
  minGroup: 0,
  lead: 0,
  radius: 0,
  rating: '',
  response: '',
  priceOnRequest: false,
  verified: false,
  email: '',
  phone: '',
  instagram: '',
  facebook: '',
  logoUrl: '',
  coverUrl: '',
  tiktok: '',
  mapLink: '',
  subcategory: '',
  contactPerson: '',
  country: '',
  startingPrice: null,
  minProductPrice: null,
  searchText: '',
  firstProduct: null,
  promos: [],
  reviews: [],
  faqs: [],
  gallery: [],
  policies: [],
  menuItems: [],
  products: [],
};
const DEFAULT_FAQ_TEMPLATES = [
  { q: 'What types of events do you handle?', a: '' },
  { q: 'How far in advance should I book?', a: '' },
  { q: 'Can packages be customized?', a: '' },
  { q: 'Is a deposit required?', a: '' },
];
const SUGGESTED_ALBUMS = ['Weddings', 'Birthdays', 'Corporate Events', 'Baby Showers', 'Family Day', 'Graduations'];
const SUGGESTED_PACKAGES = ['Basic Package', 'Standard Package', 'Premium Package'];
const SUGGESTED_FAQS = [
  'What types of events do you cater to?',
  'How far in advance should I book?',
  'Can packages be customized?',
  'Is a deposit required to confirm a booking?',
  'Do you travel outside your base location?',
  'What happens if I need to reschedule?',
];
const SUGGESTED_POLICIES = [
  'Booking & Reservation Policy',
  'Payment Policy',
  'Deposit Policy',
  'Cancellation Policy',
  'Rescheduling Policy',
  'Guest Count & Final Numbers Policy',
  'Setup & Access Policy',
  'Health & Safety Policy',
];
const SPOTLIGHT_STARTER_PLAN = {
  name: 'Starter',
  price: 'Free',
  tagline: 'List. Get found. Get booked.',
  bullets: [
    'Storefront — your own mini-website inside Eventory',
    'Direct inquiries — planners message you, straight to WhatsApp',
    'Active planners, not passive scrollers — visibility to buyers actively searching for vendors',
  ],
  cta: 'Create My Storefront',
};
const SPOTLIGHT_PLANS = [
  {
    key: 'spotlight',
    name: 'Spotlight',
    price: 'TTD $175',
    period: '/month',
    priceNote: 'TTD $175/month, or TTD $1,750/year — 2 months free',
    tagline: 'Reach more planners, faster.',
    bullets: [
      'Priority placement — first name they see, not the fifth they scroll past',
      "Featured badge — a mark that says you're active, established, worth a look",
      "In planners' inboxes — featured in Eventory's marketing to buyers actively planning",
      'On Google, too — Business Profile set up and optimized, done for you',
      "Proof it's working — profile views and inquiries, tracked",
    ],
    cta: 'Get Spotlighted',
  },
];
const POST_AUTH_RETURN_KEY = 'eventoryPostAuthReturn';
const PROMO_ACCENT = '#FF5A36';
const ACCENT = '#E0512B';
const CTA_ACCENT = '#B8401F';
const ACCENT_ON = '#FFFFFF';
const ACCENT_ON_SOFT = 'rgba(255,255,255,0.72)';
const ACCENT_ON_MUTED = 'rgba(255,255,255,0.32)';
const PRICE_FILTERS = [
  { label: 'Any price', test: () => true },
  { label: 'Under TT$500', test: (v) => v !== null && v < 500 },
  { label: 'TT$500–TT$3,000', test: (v) => v !== null && v >= 500 && v <= 3000 },
  { label: 'TT$3,000+', test: (v) => v !== null && v > 3000 },
  { label: 'Price on request', test: (v) => v === null },
];
const ABOUT_FAQS = [
  {
    q: 'Is Eventory free to use?',
    a: 'Yes. Browsing vendors, comparing what they offer and sending requests is free for anyone planning an event. Listing a business is also free, and paid placement is optional.',
  },
  {
    q: 'Does Eventory process payments?',
    a: 'No. Eventory never processes payment between you and a vendor. You pay vendors directly, on their own terms.',
  },
  {
    q: 'How do I request a quote from a vendor?',
    a: 'Sign in, then use the Get a quote button on their profile. It walks you through your event details and sends them straight to that vendor.',
  },
  {
    q: 'Can I message a vendor instantly?',
    a: 'Yes. Most vendor profiles have a WhatsApp button for a quick, direct message — no sign-in required.',
  },
  {
    q: "Can't find what you're looking for?",
    a: "Submit a sourcing request and tell us what you need. We'll help you find options, even if it isn't listed yet.",
  },
  {
    q: 'How do I list my business on Eventory?',
    a: 'Head to the Join Eventory page and submit your details. We\'ll get back to you to build your profile.',
  },
  {
    q: 'What is Spotlight?',
    a: "Your listing on Eventory is always free. Spotlight is a set of optional paid placements — priority in your category, homepage features, buyer email inclusion and custom content — you add only when you're ready to grow.",
    linkTo: 'promo',
    linkLabel: 'See Spotlight',
  },
  {
    q: 'Where does Eventory operate?',
    a: 'We currently cover Trinidad & Tobago, including Port of Spain, San Fernando, Chaguanas, Arima and Tobago.',
  },
];

const LEGAL_UPDATED = 'August 28, 2026';

const TERMS_SECTIONS = [
  {
    h: 'What Eventory is',
    p: 'Eventory is a discovery platform connecting people planning events with independent vendors — caterers, venues, photographers, decorators and more — across Trinidad & Tobago. We help you find and message each other. We are not a party to any booking, contract, or payment between a planner and a vendor.',
  },
  {
    h: 'No payments through Eventory',
    p: 'Eventory never processes payment. Every booking, deposit, and payment happens directly between you and the vendor, on whatever terms you agree between yourselves. We are not responsible for a vendor’s pricing, availability, deposits, cancellations, or the quality of their work, and we are not responsible for a planner’s conduct toward a vendor.',
  },
  {
    h: 'Accounts',
    p: 'You’re responsible for keeping your account credentials private and for anything that happens under your account. Vendor accounts are for one real business per account, listing accurate, truthful information you have the right to publish (including photos). We can remove a listing or suspend an account for false information, impersonation, or abusive conduct toward other users.',
  },
  {
    h: 'Content you post',
    p: 'You keep ownership of anything you upload (photos, descriptions, reviews). By posting it on Eventory, you give us permission to display it on the platform and in reasonable promotion of the platform (for example, a vendor spotlight). You confirm you have the right to post what you upload.',
  },
  {
    h: 'Acceptable use',
    p: 'Don’t use Eventory to spam, scrape, impersonate someone else, post false or misleading listings, or interfere with the platform’s normal operation. We can suspend or remove access for anyone who does.',
  },
  {
    h: 'No warranty, limited liability',
    p: 'Eventory is provided as-is. We do our best to keep listings accurate and the site running, but we don’t guarantee a vendor will be available, affordable, or a good fit for your event, and we’re not liable for losses arising from your dealings with a vendor or another user. To the extent allowed by law, our liability for anything related to the platform is limited to the amount (if any) you’ve paid us directly, which for most users is zero.',
  },
  {
    h: 'Changes',
    p: 'We may update these terms as the platform changes. We’ll update the date below when we do. Continuing to use Eventory after a change means you accept the update.',
  },
  {
    h: 'Governing law',
    p: 'These terms are governed by the laws of Trinidad and Tobago.',
  },
  {
    h: 'Questions',
    p: 'Reach us through the Contact us form on our About page.',
  },
];

const PRIVACY_SECTIONS = [
  {
    h: 'What we collect',
    p: 'From planners: your email address (for magic-link sign-in) and whatever you include in a vendor inquiry or the contact form (name, phone, event details, message). From vendors: business name, contact person, email, phone, city, category, and whatever you add to your public profile (photos, packages, descriptions). We also automatically receive basic technical data (like IP address and browser type) as part of how our hosting and security infrastructure works.',
  },
  {
    h: 'How we use it',
    p: 'To run the marketplace: showing vendor listings to planners, delivering inquiries and messages between you and a vendor, letting vendors manage their own listing, and reviewing new listings before they go live. If you’ve opted in, we may also send you promos or offers from vendors — you can opt out at any time.',
  },
  {
    h: 'Who we share it with',
    p: 'We don’t sell your data. A few service providers process it on our behalf to run the platform: Supabase (database, authentication, and file storage), Resend (sending emails like inquiries and account notifications), and Vercel (website hosting). A vendor inquiry is shared with the specific vendor(s) you’re messaging — that’s the point of it. We don’t share your information with anyone else except where required by law.',
  },
  {
    h: 'How long we keep it',
    p: 'We keep account and listing data for as long as your account is active, and inquiry/contact records for as long as reasonably useful for support and safety purposes. You can ask us to delete your data at any time (see below).',
  },
  {
    h: 'Your choices',
    p: 'You can update your vendor profile at any time from your dashboard. To access, correct, or delete your data, or to unsubscribe from promotional emails, contact us through the Contact us form on our About page and we’ll handle it within a reasonable time.',
  },
  {
    h: 'Cookies & local storage',
    p: 'We use your browser’s local storage to keep you signed in between visits — that’s it. We don’t use third-party advertising trackers.',
  },
  {
    h: 'Children',
    p: 'Eventory isn’t directed at children, and we don’t knowingly collect data from anyone under 18.',
  },
  {
    h: 'Changes',
    p: 'We may update this policy as the platform changes. We’ll update the date below when we do.',
  },
  {
    h: 'Questions',
    p: 'Reach us through the Contact us form on our About page.',
  },
];

const avatarUrl = (seed) =>
  'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(seed) + '&backgroundColor=171717&textColor=ffffff&fontWeight=700';

// Normalizes a T&T phone number into the full digits wa.me needs. Vendors
// often type just the local 7-digit number or the 10-digit "868..." form
// without the country code, which otherwise makes the WhatsApp link 404.
function whatsappDigits(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 7) return '1868' + digits;
  if (digits.length === 10 && digits.startsWith('868')) return '1' + digits;
  return digits;
}

// Password field with a show/hide toggle, styled to match the pill inputs
// used across the vendor sign-in / account-creation screens.
function PasswordField({ value, onChange, placeholder, show, onToggleShow }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid #E4E4DF',
          borderRadius: 999,
          background: '#F7F7F5',
          padding: '13px 46px 13px 20px',
          fontFamily: SANS,
          fontSize: 15,
        }}
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          color: '#8A8A8A',
        }}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Minimal RFC4180-ish CSV parser: quoted fields, embedded commas, escaped
// ("") quotes, and \n/\r\n/\r line endings — enough for a spreadsheet
// export without pulling in a library for four columns.
function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const BULK_CSV_HEADER_ALIASES = {
  name: 'name',
  'business name': 'name',
  'vendor name': 'name',
  vendor: 'name',
  category: 'category',
  region: 'region',
  city: 'city',
  email: 'email',
  phone: 'phone',
  whatsapp: 'phone',
  'phone number': 'phone',
  'whatsapp number': 'phone',
  bio: 'bio',
  'short description': 'bio',
  description: 'description',
  'full description': 'description',
};

// Turns parsed CSV rows into validated vendor rows ready for
// adminBulkCreateVendors, or a list of reasons a row can't be imported yet.
// Pure (takes cats/locations in) so it doesn't need any component state.
function validateBulkCsvRows(csvRows, cats, locations) {
  if (!csvRows.length) return [];
  const header = csvRows[0].map((h) => (h || '').trim().toLowerCase());
  const fieldIndex = {};
  header.forEach((h, i) => {
    const field = BULK_CSV_HEADER_ALIASES[h];
    if (field && !(field in fieldIndex)) fieldIndex[field] = i;
  });
  const dataRows = csvRows.slice(1).filter((r) => r.some((v) => (v || '').trim()));
  const regionNames = locations.filter((l) => l !== 'All areas');
  return dataRows.map((r, i) => {
    const get = (field) => (fieldIndex[field] !== undefined ? (r[fieldIndex[field]] || '').trim() : '');
    const name = get('name');
    const categoryRaw = get('category');
    const region = get('region');
    const city = get('city');
    const email = get('email');
    const phone = get('phone');
    const bio = get('bio');
    const description = get('description');

    const errors = [];
    if (!name) errors.push('Missing name');
    const category = cats.find(
      (c) => c[0].toLowerCase() === categoryRaw.toLowerCase() || c[1].toLowerCase() === categoryRaw.toLowerCase()
    );
    if (!categoryRaw) errors.push('Missing category');
    else if (!category) errors.push(`Unknown category "${categoryRaw}"`);
    const matchedRegion = regionNames.find((l) => l.toLowerCase() === region.toLowerCase());
    if (!region) errors.push('Missing region');
    else if (!matchedRegion) errors.push(`Unknown region "${region}"`);
    if (!city) errors.push('Missing city');
    if (!email) errors.push('Missing email');
    else if (email.indexOf('@') <= 0) errors.push('Invalid email');

    return {
      rowNumber: i + 2, // +1 for the header row, +1 for 1-indexing
      name,
      categoryCode: category ? category[0] : '',
      categoryLabel: category ? category[1] : categoryRaw,
      region: matchedRegion || region,
      city,
      email,
      phone,
      bio,
      description,
      errors,
    };
  });
}

const VD_GUIDE_TABS = ['profile', 'packages', 'gallery', 'menu', 'faqs', 'policies', 'promos'];
const VD_TAB_LABELS = { profile: 'Profile', packages: 'Packages', gallery: 'Gallery', menu: 'Menu', faqs: 'FAQ', policies: 'Policies', promos: 'Promos', inquiries: 'Inquiries' };

const MOBILE_BREAKPOINT = 760;
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

// signedIn is intentionally not restored here — it now reflects a real
// Supabase auth session, synced separately once the app mounts.
const loadAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return { email: '', saved: [], savedVendors: [], promoOptIn: false };
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || '',
      saved: parsed.saved || [],
      savedVendors: parsed.savedVendors || [],
      promoOptIn: !!parsed.promoOptIn,
    };
  } catch {
    return { email: '', saved: [], savedVendors: [], promoOptIn: false };
  }
};

const sharedProductFromUrl = () => {
  try {
    const pid = new URLSearchParams(window.location.search).get('product');
    if (!pid) return null;
    // Product ids are "<vendor uuid>-<index>" — split on the last hyphen since
    // the uuid itself contains hyphens. Existence against real vendors is
    // checked later, once the catalog has loaded from Supabase.
    const supId = pid.slice(0, pid.lastIndexOf('-'));
    return supId ? { pid, supId } : null;
  } catch {
    return null;
  }
};

const initialState = {
  screen: 'home',
  supId: null,
  dirCat: 'ALL',
  dirCats: [],
  dirPlanLabel: '',
  dirCatMenuOpen: false,
  dirLocMenuOpen: false,
  dirLoc: 0,
  dirPrice: 0,
  dirQuery: '',
  dirVisible: 6,
  planModalOpen: false,
  planStep: 1,
  planCelebrationType: null,
  planOccasion: null,
  planCats: [],
  email: '',
  signedIn: false,
  authSending: false,
  authSent: false,
  authError: null,
  saved: [],
  savedVendors: [],
  promoOptIn: false,
  copiedPid: null,
  copiedVendorId: null,
  supCarouselIndex: 0,
  // Per-vendor full detail (products, gallery, reviews, faqs, policies,
  // menu, promos), fetched on demand — see ensureVendorDetail. Keyed by
  // vendor id; vendorDetailLoading tracks in-flight fetches so opening the
  // same vendor twice or a saved item from an already-open vendor doesn't
  // refetch.
  vendorDetail: {},
  vendorDetailLoading: {},
  contactSent: false,
  contactName: '',
  contactEmail: '',
  contactMessage: '',
  contactCompany: '',
  contactSubmitting: false,
  contactError: null,
  sourcingOpen: false,
  sourcingSent: false,
  sourcingName: '',
  sourcingPhone: '',
  sourcingEmail: '',
  sourcingDescription: '',
  sourcingCompany: '',
  sourcingSubmitting: false,
  sourcingError: null,
  supplierTab: 'services',
  svcQuery: '',
  svcGroup: 'All',
  svcVisible: 8,
  navMenuOpen: false,
  promoPlanOpen: false,
  promoPlanSent: false,
  promoPlanKey: null,
  promoPlanName: '',
  promoPlanEmail: '',
  promoPlanPhone: '',
  promoPlanCompany: '',
  promoPlanSubmitting: false,
  promoPlanError: null,
  reviewFormOpen: false,
  reviewAuthor: '',
  reviewStars: 0,
  reviewBody: '',
  reviewSending: false,
  reviewError: null,
  reviewSent: false,
  waModalOpen: false,
  waEventType: null,
  waEventTypeOther: '',
  waEventDate: '',
  waVenue: '',
  waAttendees: '',
  waService: '',
  quoteModalOpen: false,
  quoteStep: 1,
  quoteEventType: null,
  quoteEventTypeOther: '',
  quoteEventDate: '',
  quoteVenue: '',
  quoteAnswers: {},
  quoteContactName: '',
  quoteContactEmail: '',
  quoteContactPhone: '',
  quoteSubmitting: false,
  quoteSubmitError: null,
  quoteSent: false,
  dashboardQuotes: [],
  dashboardQuotesLoading: false,
  dashboardQuotesError: null,

  vsiEmail: '',
  vsiPassword: '',
  vsiSubmitting: false,
  vsiError: null,
  vsiForgotMode: false,
  vsiForgotSubmitting: false,
  vsiForgotSent: false,
  vsiForgotError: null,

  newPassword: '',
  newPasswordConfirm: '',
  newPasswordSubmitting: false,
  newPasswordError: null,

  vdTab: '',
  vdLoading: false,
  vdError: null,
  vdVendor: null,
  vdSubcategory: '',
  vdContactPerson: '',
  vdPhone: '',
  vdCity: '',
  vdBio: '',
  vdDescription: '',
  vdLogoUrl: '',
  vdCoverUrl: '',
  vdUploadingLogo: false,
  vdUploadingCover: false,
  vdInstagram: '',
  vdFacebook: '',
  vdTiktok: '',
  vdMapLink: '',
  vdAddressLine1: '',
  vdAddressLine2: '',
  vdStartingPrice: '',
  vdSaving: false,
  vdSaveError: null,
  vdSaved: false,
  vdPkgName: '',
  vdPkgDescription: '',
  vdPkgPriceMin: '',
  vdPkgPriceMax: '',
  vdPkgPhotoUrl: '',
  vdUploadingPkgPhoto: false,
  vdAddingPkg: false,
  vdAlbumEventType: '',
  vdUploadingGalleryPhoto: false,
  vdMenuDraft: '',
  vdAddingMenuItem: false,
  vdFaqQ: '',
  vdFaqA: '',
  vdAddingFaq: false,
  vdPolicyTitle: '',
  vdPolicyBody: '',
  vdAddingPolicy: false,
  vdPromoTitle: '',
  vdPromoDiscount: '',
  vdPromoDescription: '',
  vdPromoExpiresAt: '',
  vdAddingPromo: false,
  vdQuotes: [],
  vdQuotesLoading: false,
  vdQuotesError: null,
};

export default function App() {
  const isMobile = useIsMobile();
  const [st, setSt] = useState(() => {
    const base = { ...initialState, ...loadAccount() };
    const shared = sharedProductFromUrl();
    if (shared) return { ...base, screen: 'supplier', supId: shared.supId, supplierTab: 'services' };
    // A vendor's own profile URL (?vendor=<id>) — set on every visit to a
    // vendor page (see the pushState effect below) so it's shareable and
    // survives a refresh, distinct from ?product= which links one specific
    // package within a vendor's page.
    const sharedVendorId = new URLSearchParams(window.location.search).get('vendor');
    if (sharedVendorId) return { ...base, screen: 'supplier', supId: sharedVendorId, supplierTab: 'services' };
    if (new URLSearchParams(window.location.search).get('admin')) {
      return { ...base, screen: 'admin' };
    }
    return base;
  });
  const patch = (updater) =>
    setSt((prev) => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));

  const [catalog, setCatalog] = useState({ ready: false, error: null, cats: [], suppliers: [] });
  const loadCatalog = () => {
    setCatalog((c) => ({ ...c, ready: false, error: null }));
    fetchCatalog()
      .then(({ cats, suppliers }) => setCatalog({ ready: true, error: null, cats, suppliers }))
      .catch((err) => setCatalog({ ready: false, error: err.message || 'Failed to load', cats: [], suppliers: [] }));
  };
  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const CATS = catalog.cats;
  const SUPPLIERS = catalog.suppliers;

  // Businesses found via web search, not yet on Eventory — powers the
  // "Claim Your Business" section. Independent of the main catalog load;
  // a failure here shouldn't block the rest of the page.
  const [unclaimedBusinesses, setUnclaimedBusinesses] = useState([]);
  useEffect(() => {
    fetchUnclaimedBusinesses()
      .then(setUnclaimedBusinesses)
      .catch(() => setUnclaimedBusinesses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full detail (products/gallery/reviews/faqs/policies/menu/promos) for
  // one vendor, fetched lazily — the profile page and the Saved Items page
  // both call this for whichever vendor id(s) they need. Defined here
  // (before the catalog.ready early return below) rather than alongside
  // the other vendor helpers further down, since the two effects right
  // below reference it and every hook must run on every render, including
  // ones that bail out at that early return before reaching the rest of
  // the function body.
  const ensureVendorDetail = (id) => {
    if (!id || st.vendorDetail[id] || st.vendorDetailLoading[id]) return;
    patch((s) => ({ vendorDetailLoading: { ...s.vendorDetailLoading, [id]: true } }));
    fetchVendorDetail(id)
      .then((detail) => {
        patch((s) => ({
          vendorDetailLoading: { ...s.vendorDetailLoading, [id]: false },
          vendorDetail: detail ? { ...s.vendorDetail, [id]: detail } : s.vendorDetail,
        }));
      })
      .catch(() => {
        patch((s) => ({ vendorDetailLoading: { ...s.vendorDetailLoading, [id]: false } }));
      });
  };

  // Fetch the open vendor's full detail (products, gallery, reviews, faqs,
  // policies, menu, promos) — the lean catalog list doesn't carry any of
  // that. ensureVendorDetail no-ops if it's already cached or in flight.
  useEffect(() => {
    if (st.screen !== 'supplier' || !st.supId) return;
    ensureVendorDetail(st.supId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.supId]);

  // The Saved Items page shows name/price/photo for every saved product,
  // which can span several vendors that aren't the one currently open —
  // fetch full detail for each distinct vendor referenced in st.saved.
  useEffect(() => {
    if (st.screen !== 'account') return;
    const supIds = new Set((st.saved || []).map((pid) => pid.slice(0, pid.lastIndexOf('-'))));
    supIds.forEach((id) => ensureVendorDetail(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.saved]);

  // Load the admin's vendor list (including drafts) whenever the signed-in
  // admin lands on the dashboard — RLS only allows this for ADMIN_EMAIL.
  useEffect(() => {
    if (st.screen !== 'admin' || (st.adminSubScreen || 'dashboard') !== 'dashboard') return;
    if (!st.signedIn || st.email !== ADMIN_EMAIL) return;
    patch({ adminVendorsLoading: true, adminVendorsError: null });
    adminListVendors()
      .then((rows) => patch({ adminVendorsLoading: false, adminVendors: rows }))
      .catch((err) => patch({ adminVendorsLoading: false, adminVendorsError: err.message || 'Could not load vendors.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.adminSubScreen, st.signedIn, st.email]);

  // Load the signed-in planner's own quote requests whenever they land on
  // their dashboard (the account screen).
  useEffect(() => {
    if (st.screen !== 'account' || !st.signedIn) return;
    patch({ dashboardQuotesLoading: true, dashboardQuotesError: null });
    fetchMyQuoteRequests()
      .then((rows) => patch({ dashboardQuotesLoading: false, dashboardQuotes: rows }))
      .catch((err) => patch({ dashboardQuotesLoading: false, dashboardQuotesError: err.message || 'Could not load your inquiries.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.signedIn]);

  // Load the signed-in vendor's own listing whenever they land on their
  // dashboard, and seed the edit-form fields from what comes back.
  useEffect(() => {
    if (st.screen !== 'vendor-dashboard' || !st.signedIn) return;
    patch({ vdLoading: true, vdError: null });
    fetchMyVendor()
      .then((v) => {
        if (!v) {
          patch({ vdLoading: false, vdVendor: null });
          return;
        }
        patch({
          vdLoading: false,
          vdVendor: v,
          vdSubcategory: v.subcategory,
          vdContactPerson: v.contactPerson,
          vdPhone: v.phone,
          vdCity: v.city && MUNICIPALITIES.includes(v.city) ? v.city : v.city ? 'Other' : '',
          vdCityOther: v.city && !MUNICIPALITIES.includes(v.city) ? v.city : '',
          vdBio: v.bio,
          vdDescription: v.description,
          vdLogoUrl: v.logoUrl,
          vdCoverUrl: v.coverUrl,
          vdInstagram: v.instagram,
          vdFacebook: v.facebook,
          vdTiktok: v.tiktok,
          vdMapLink: v.mapLink,
          vdAddressLine1: v.addressLine1,
          vdAddressLine2: v.addressLine2,
          vdStartingPrice: v.startingPrice === null ? '' : String(v.startingPrice),
        });
      })
      .catch((err) => patch({ vdLoading: false, vdError: err.message || 'Could not load your listing.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.signedIn]);

  useEffect(() => {
    if (st.screen !== 'vendor-dashboard' || !st.vdVendor) return;
    patch({ vdQuotesLoading: true, vdQuotesError: null });
    fetchVendorQuoteRequests(st.vdVendor.id)
      .then((rows) => patch({ vdQuotesLoading: false, vdQuotes: rows }))
      .catch((err) => patch({ vdQuotesLoading: false, vdQuotesError: err.message || 'Could not load your inquiries.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.vdVendor && st.vdVendor.id]);

  // Real auth: restore any existing Supabase session on load, then stay in
  // sync as the user signs in (via magic link) or out. A magic link click
  // lands back here as a fresh page load, so on sign-in we also consume any
  // stashed "return to" screen so the user reappears where they left off
  // (e.g. back on the Send step) instead of on the home screen.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session)
        patch({
          signedIn: true,
          email: data.session.user.email || '',
          accountRole: (data.session.user.user_metadata || {}).role || '',
        });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        patch({ screen: 'vendor-set-password', signedIn: true, email: (session && session.user.email) || '', accountRole: 'vendor' });
        return;
      }
      if (session) {
        let extra = {};
        let resumePlan = null;
        try {
          const raw = localStorage.getItem(POST_AUTH_RETURN_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.resumePlan) {
              resumePlan = parsed.resumePlan;
            } else if (parsed && parsed.screen) {
              extra = {
                screen: parsed.screen,
                ...(parsed.supId ? { supId: parsed.supId } : {}),
                ...(parsed.supplierTab ? { supplierTab: parsed.supplierTab } : {}),
                ...(parsed.supplierTab === 'inquire' ? { inqEmail: session.user.email || '' } : {}),
                ...(parsed.openQuote
                  ? {
                      quoteModalOpen: true,
                      quoteStep: 1,
                      quoteEventType: null,
                      quoteEventTypeOther: '',
                      quoteEventDate: '',
                      quoteVenue: '',
                      quoteAnswers: {},
                      quoteContactName: '',
                      quoteContactEmail: session.user.email || '',
                      quoteContactPhone: '',
                      quoteSubmitting: false,
                      quoteSubmitError: null,
                      quoteSent: false,
                    }
                  : {}),
              };
            }
          }
          localStorage.removeItem(POST_AUTH_RETURN_KEY);
        } catch {
          // ignore malformed/inaccessible storage
        }
        patch({
          signedIn: true,
          email: session.user.email || '',
          accountRole: (session.user.user_metadata || {}).role || '',
          authSent: false,
          authError: null,
          ...extra,
        });
        if (resumePlan) {
          submitPlanningRequest({
            eventLabel: resumePlan.eventLabel,
            eventDate: resumePlan.eventDate,
            location: resumePlan.locationLabel,
            categoryCodes: resumePlan.categoryCodes,
            budgetLabel: resumePlan.budgetLabel,
            contactEmail: session.user.email || '',
          })
            .then(() => {
              patch({
                planModalOpen: false,
                screen: 'suppliers',
                dirCat: 'ALL',
                dirCats: resumePlan.categoryCodes || [],
                dirPlanLabel: resumePlan.eventLabel,
                dirLoc: resumePlan.locIndex || 0,
                dirPrice: resumePlan.budgetIndex || 0,
                dirVisible: 6,
                navMenuOpen: false,
              });
            })
            .catch((err) => {
              patch({
                planModalOpen: true,
                planStep: 6,
                planOccasion: resumePlan.eventLabel,
                planEventDate: resumePlan.eventDate,
                planLoc: resumePlan.locIndex || 0,
                planCats: resumePlan.categoryCodes || [],
                planBudget: resumePlan.budgetIndex || 0,
                planSubmitError: err.message || 'Could not save your plan. Please try again.',
              });
            });
        }
      } else {
        patch({ signedIn: false, accountRole: '' });
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_KEY,
        JSON.stringify({
          email: st.email,
          saved: st.saved,
          savedVendors: st.savedVendors,
          promoOptIn: st.promoOptIn,
        })
      );
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  }, [st.email, st.saved, st.savedVendors, st.promoOptIn]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [st.screen]);

  useEffect(() => {
    if (st.screen !== 'supplier') return;
    const id = setInterval(() => {
      patch((s) => ({ supCarouselIndex: (s.supCarouselIndex || 0) + 1 }));
    }, 4000);
    return () => clearInterval(id);
  }, [st.screen, st.supId]);

  const isPoppingRef = useRef(false);
  const isFirstScreenRef = useRef(true);

  // A vendor's profile gets a real, shareable URL (?vendor=<id>) so it
  // survives a refresh and can be pasted/shared — every other screen just
  // stays on the plain path. Only touches the "vendor"/"product" params;
  // "admin" (or anything else already in the query string) is left alone,
  // so a bookmarked ?admin=1 session isn't dropped by navigating around.
  const urlForScreen = (screen, supId) => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.delete('product');
    if (screen === 'supplier' && supId) {
      params.set('vendor', supId);
    } else {
      params.delete('vendor');
    }
    const qs = params.toString();
    return path + (qs ? '?' + qs : '');
  };

  useEffect(() => {
    history.replaceState({ screen: st.screen, supId: st.supId, supplierTab: st.supplierTab }, '', urlForScreen(st.screen, st.supId));
    const onPopState = (e) => {
      if (!e.state) return;
      isPoppingRef.current = true;
      patch(e.state);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }
    if (isFirstScreenRef.current) {
      isFirstScreenRef.current = false;
      return;
    }
    history.pushState({ screen: st.screen, supId: st.supId, supplierTab: st.supplierTab }, '', urlForScreen(st.screen, st.supId));
    // Only push a new history entry when the screen itself changes, not on every
    // supId/supplierTab update (e.g. switching tabs shouldn't add a back-button stop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen]);

  if (catalog.error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: SANS, textAlign: 'center', padding: 24 }}>
        <div style={{ fontFamily: DISPLAY_BLACK, fontSize: 22, fontWeight: 800 }}>Eventory</div>
        <div style={{ fontSize: 15, color: '#5B5B5B', maxWidth: 360 }}>Could not load the catalog. {catalog.error}</div>
        <button
          onClick={loadCatalog}
          style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
        >
          Try again
        </button>
      </div>
    );
  }

  // catalog.ready no longer gates the whole page — the header, hero, and
  // "What We Do" section don't need any vendor data, so they render on the
  // very first paint instead of waiting behind this fetch. CATS/SUPPLIERS
  // just stay empty arrays until it resolves, which every derived list
  // below already handles safely (empty .map()/.filter(), EMPTY_SUPPLIER
  // fallback for sup); the handful of visibly data-dependent sections
  // (category tiles, Featured Vendors/Offerings, Discover Vendors) show
  // their own small "Loading…" via V.catalogLoading instead of a
  // misleading empty state.

  // Converts one detail-fetched vendor's raw product tuples into the named
  // shape the rest of the app expects. Only ever called on a vendor whose
  // full detail has actually been fetched (see ensureVendorDetail) — never
  // a global flatten across every vendor, since list-view vendors (from
  // vendor_list_view) don't carry a .products array at all.
  const productsOf = (s) =>
    (s.products || []).map((p, i) => ({
      id: s.id + '-' + (i + 1),
      supId: s.id,
      name: p[0],
      description: p[1],
      min: p[2],
      max: p[3],
      unit: p[4],
      minQty: p[5],
      group: p[7] || 'General',
      photoUrl: p[8] || '',
      inclusions: p[9] || [],
      priceOnRequest: !!s.priceOnRequest,
    }));
  // Resolves a single product id ("<vendorId>-<index>") against whichever
  // vendor's full detail is currently cached — the open profile page, or a
  // saved-item's vendor once ensureVendorDetail has fetched it. Returns
  // undefined until that detail has loaded, same as the old lookup did
  // while the whole catalog was still loading.
  const product = (id) => {
    const supId = id.slice(0, id.lastIndexOf('-'));
    const detail = st.vendorDetail[supId];
    if (!detail) return undefined;
    return productsOf(detail).find((p) => p.id === id);
  };
  const supplier = (id) => SUPPLIERS.find((s) => s.id === id);
  const catName = (code) => {
    const c = CATS.find((c) => c[0] === code);
    return c ? c[1] : '';
  };
  const priceLabel = (p) =>
    p.priceOnRequest ? 'Inquire for pricing' : money(p.min) + '–' + money(p.max) + (p.unit === 'flat' ? '' : ' ' + p.unit);
  // s.minProductPrice comes pre-aggregated from vendor_list_view (min
  // products.price_min, computed server-side) so this never needs a
  // vendor's full .products array — safe to call on every list-view row.
  const startPrice = (s) => (s.priceOnRequest || s.minProductPrice === null || s.minProductPrice === undefined ? null : s.minProductPrice);

  const toggleSave = (pid) => {
    patch((s) => {
      const saved = s.saved || [];
      return { saved: saved.indexOf(pid) >= 0 ? saved.filter((x) => x !== pid) : saved.concat([pid]) };
    });
  };
  const shareProduct = (pid) => {
    const p = product(pid);
    if (!p) return;
    const s = supplier(p.supId);
    const url = window.location.origin + window.location.pathname + '?product=' + encodeURIComponent(pid);
    const text = p.name + (s ? ' from ' + s.name : '') + ' on Eventory';
    if (navigator.share) {
      navigator.share({ title: p.name, text, url }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          patch({ copiedPid: pid });
          setTimeout(() => patch((s2) => (s2.copiedPid === pid ? { copiedPid: null } : {})), 1800);
        })
        .catch(() => {});
    }
  };

  const toggleSaveVendor = (supId) => {
    patch((s) => {
      const savedVendors = s.savedVendors || [];
      return {
        savedVendors: savedVendors.indexOf(supId) >= 0 ? savedVendors.filter((x) => x !== supId) : savedVendors.concat([supId]),
      };
    });
  };
  const shareVendor = (supId) => {
    const s = supplier(supId);
    if (!s) return;
    const url = window.location.origin + window.location.pathname + '?supplier=' + encodeURIComponent(supId);
    const text = s.name + ' on Eventory';
    if (navigator.share) {
      navigator.share({ title: s.name, text, url }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          patch({ copiedVendorId: supId });
          setTimeout(() => patch((s2) => (s2.copiedVendorId === supId ? { copiedVendorId: null } : {})), 1800);
        })
        .catch(() => {});
    }
  };

  // ---- derived view-model ----
  const nav = (screen, extra) => () => patch({ screen, navMenuOpen: false, ...(extra || {}) });
  const openCat = (code) => () =>
    patch({ screen: 'suppliers', dirCat: code, dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false });
  const catTile = (c) => {
    const n = SUPPLIERS.filter((s) => (s.codes || [s.code]).includes(c[0])).length;
    return {
      code: c[0],
      name: c[1],
      supplierLabel: n ? n + (n === 1 ? ' vendor' : ' vendors') : 'Coming soon',
      open: openCat(c[0]),
    };
  };

  // Shared by the homepage's full "Claim Your Business" list and the
  // Discover Vendors page's filtered one.
  const claimTile = (b) => ({
    key: b.id,
    name: b.name,
    categoryCode: b.categoryCode,
    categoryName: catName(b.categoryCode),
    city: b.city,
    phone: b.phone,
    sourceUrl: b.sourceUrl,
    photo: weddingVenue2Photo,
    waUrl: b.phone
      ? 'https://wa.me/' + whatsappDigits(b.phone) + '?text=' + encodeURIComponent(`Hi ${b.name}, I found your business on Eventory and wanted to reach out.`)
      : null,
    claim: () =>
      patch({
        screen: 'vendor-onboarding',
        voStep: st.signedIn ? 2 : 0,
        voDone: false,
        voVendorId: null,
        voSectors: [b.categoryCode],
        voSectorOtherText: '',
        voSubcategory: '',
        voBusinessName: b.name,
        voContactPerson: '',
        voCountry: null,
        voCity: null,
        voCityOther: '',
        voStartingPrice: '',
        voEmail: st.signedIn ? st.email || '' : '',
        voPhone: b.phone || '',
        voPassword: '',
        voConfirmPassword: '',
        voAgree: false,
        voStep1Error: null,
        navMenuOpen: false,
      }),
  });

  const dirQueryLower = (st.dirQuery || '').trim().toLowerCase();
  const dirFiltered = SUPPLIERS.filter((s) => {
    if (st.dirCat !== 'ALL' && !(s.codes || [s.code]).includes(st.dirCat)) return false;
    if ((st.dirCats || []).length && !(s.codes || [s.code]).some((c) => st.dirCats.includes(c))) return false;
    if (st.dirLoc !== 0 && s.region !== LOCATIONS[st.dirLoc]) return false;
    if (!PRICE_FILTERS[st.dirPrice || 0].test(startPrice(s))) return false;
    if (!dirQueryLower) return true;
    const inSupplier =
      s.name.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.bio.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.desc.toLowerCase().indexOf(dirQueryLower) >= 0 ||
      catName(s.code).toLowerCase().indexOf(dirQueryLower) >= 0 ||
      s.tags.some((t) => t.toLowerCase().indexOf(dirQueryLower) >= 0);
    // s.searchText comes pre-aggregated from vendor_list_view (every
    // product's name + description, lowercased server-side) so matching a
    // search term against a vendor's offerings doesn't need its full
    // .products array.
    const inProducts = s.searchText.indexOf(dirQueryLower) >= 0;
    return inSupplier || inProducts;
  });

  // sup merges the lean list-view row (name, city, rating, etc. — always
  // available) with that vendor's full detail once ensureVendorDetail has
  // fetched it (products, gallery, reviews, faqs, policies, menu, promos —
  // all default to [] via EMPTY_SUPPLIER until then, so every tab renders
  // an empty state instead of erroring while detail is still in flight).
  const supLean = supplier(st.supId) || SUPPLIERS[0] || EMPTY_SUPPLIER;
  const sup = { ...EMPTY_SUPPLIER, ...supLean, ...(st.vendorDetail[supLean.id] || {}) };
  const supDetailLoading = !!st.vendorDetailLoading[sup.id] && !st.vendorDetail[sup.id];
  const supProducts = productsOf(sup);
  const socialUrl = (platform, handle) => {
    if (!handle) return null;
    const h = handle
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^(www\.)?(instagram|facebook|tiktok)\.com\//i, '')
      .replace(/^@/, '');
    if (!h) return null;
    if (platform === 'instagram') return 'https://instagram.com/' + h;
    if (platform === 'facebook') return 'https://facebook.com/' + h;
    if (platform === 'tiktok') return 'https://tiktok.com/@' + h;
    return null;
  };
  const buildWaMessage = (name, { eventTypeLabel, eventDate, venue, attendees, service, buyerName, message }) => {
    let msg = buyerName
      ? `Hi ${name}, I'm ${buyerName} and I found you on Eventory. I'm interested in ${service ? `your ${service}` : 'your services'}`
      : `Hi ${name}, I found you on Eventory and I'm interested in ${service ? `your ${service}` : 'your services'}`;
    const details = [];
    if (eventTypeLabel) details.push(`for a ${eventTypeLabel}`);
    if (eventDate) details.push(`on ${eventDate}`);
    if (venue) details.push(`at ${venue}`);
    if (attendees) details.push(`for about ${attendees} guests`);
    if (details.length) msg += ' ' + details.join(' ');
    msg += '.';
    if (message) msg += ` ${message}`;
    return msg;
  };
  const supCoverFallback = sup.coverUrl || fallbackPhotoFor(sup.code, 0);
  const supCarouselPhotos = (() => {
    const galleryPhotos = (sup.gallery || []).map((g) => g.photoUrl).filter(Boolean);
    const photos = [supCoverFallback, ...galleryPhotos].filter(Boolean).slice(0, 3);
    return photos.length ? photos : [supCoverFallback];
  })();

  const svcGroups = Array.from(new Set(supProducts.map((p) => p.group)));
  const svcGroupFilter = st.svcGroup || 'All';
  const svcQueryLower = (st.svcQuery || '').trim().toLowerCase();
  const svcFiltered = supProducts.filter(
    (p) =>
      (svcGroupFilter === 'All' || p.group === svcGroupFilter) &&
      (!svcQueryLower ||
        p.name.toLowerCase().indexOf(svcQueryLower) >= 0 ||
        p.description.toLowerCase().indexOf(svcQueryLower) >= 0)
  );
  const svcVisibleCount = st.svcVisible || 8;
  const svcVisible = svcFiltered.slice(0, svcVisibleCount);
  const hasPolicies = (sup.policies || []).length > 0;
  const hasMenu = (sup.menuItems || []).length > 0;

  const chip = (on) =>
    on ? { bg: '#171717', fg: '#FFFFFF', border: '#171717' } : { bg: '#FFFFFF', fg: '#171717', border: '#D7D7D2' };

  const V = {
    catalogLoading: !catalog.ready,
    isHome: st.screen === 'home',
    isHowItWorks: st.screen === 'how-it-works',
    isSuppliers: st.screen === 'suppliers',
    isSupplier: st.screen === 'supplier',
    isJoin: st.screen === 'join',
    isSpotlight: st.screen === 'spotlight',
    isAccount: st.screen === 'account',
    isVendorSignIn: st.screen === 'vendor-signin',
    isVendorSetPassword: st.screen === 'vendor-set-password',
    isVendorDashboard: st.screen === 'vendor-dashboard',
    goVendorSignIn: () =>
      patch({
        screen: 'vendor-signin',
        navMenuOpen: false,
        vsiEmail: '',
        vsiPassword: '',
        vsiSubmitting: false,
        vsiError: null,
        vsiForgotMode: false,
        vsiForgotSent: false,
        vsiForgotError: null,
      }),
    isAbout: st.screen === 'about',
    isTerms: st.screen === 'terms',
    isPrivacy: st.screen === 'privacy',
    goTerms: nav('terms'),
    goPrivacy: nav('privacy'),
    // Real browser back, not a fixed "go home" — so opening Terms/Privacy
    // mid-onboarding (or from anywhere else) returns to exactly where you
    // were, since only `screen` changes on the way there.
    goBack: () => window.history.back(),
    sourcingOpen: st.sourcingOpen,
    goHome: nav('home'),
    goSuppliers: nav('suppliers'),
    goSourcing: () =>
      patch({
        sourcingOpen: true,
        sourcingSent: false,
        sourcingName: '',
        sourcingPhone: '',
        sourcingEmail: '',
        sourcingDescription: '',
        sourcingCompany: '',
        sourcingSubmitting: false,
        sourcingError: null,
      }),
    closeSourcing: () => patch({ sourcingOpen: false, sourcingSent: false }),
    sourcingSent: !!st.sourcingSent,
    sourcingName: st.sourcingName || '',
    setSourcingName: (e) => patch({ sourcingName: e.target.value }),
    sourcingPhone: st.sourcingPhone || '',
    setSourcingPhone: (e) => patch({ sourcingPhone: e.target.value }),
    sourcingEmail: st.sourcingEmail || '',
    setSourcingEmail: (e) => patch({ sourcingEmail: e.target.value }),
    sourcingDescription: st.sourcingDescription || '',
    setSourcingDescription: (e) => patch({ sourcingDescription: e.target.value }),
    sourcingCompany: st.sourcingCompany || '',
    setSourcingCompany: (e) => patch({ sourcingCompany: e.target.value }),
    sourcingSubmitting: !!st.sourcingSubmitting,
    sourcingError: st.sourcingError || '',
    sourcingDisabled:
      !(st.sourcingName || '').trim() ||
      !(st.sourcingDescription || '').trim() ||
      (!(st.sourcingPhone || '').trim() && !(st.sourcingEmail || '').trim()) ||
      !!st.sourcingSubmitting,
    submitSourcing: async () => {
      const name = (st.sourcingName || '').trim();
      const description = (st.sourcingDescription || '').trim();
      const phone = (st.sourcingPhone || '').trim();
      const email = (st.sourcingEmail || '').trim();
      if (!name || !description || (!phone && !email) || st.sourcingSubmitting) return;
      patch({ sourcingSubmitting: true, sourcingError: null });
      try {
        await submitSourcingRequest({ name, phone, email, description, company: st.sourcingCompany });
        patch({ sourcingSubmitting: false, sourcingSent: true });
      } catch (err) {
        patch({ sourcingSubmitting: false, sourcingError: err.message || 'Could not send your request. Please try again.' });
      }
    },
    goHowItWorks: nav('how-it-works'),
    goSpotlight: nav('spotlight'),
    goVendorHowItWorks: nav('join'),
    goAbout: nav('about', { contactSent: false, contactName: '', contactEmail: '', contactMessage: '', contactError: null }),
    contactName: st.contactName || '',
    setContactName: (e) => patch({ contactName: e.target.value }),
    contactEmail: st.contactEmail || '',
    setContactEmail: (e) => patch({ contactEmail: e.target.value }),
    contactMessage: st.contactMessage || '',
    setContactMessage: (e) => patch({ contactMessage: e.target.value }),
    contactCompany: st.contactCompany || '',
    setContactCompany: (e) => patch({ contactCompany: e.target.value }),
    contactSubmitting: !!st.contactSubmitting,
    contactError: st.contactError || '',
    contactDisabled:
      !((st.contactName || '').trim() && (st.contactEmail || '').trim() && (st.contactMessage || '').trim()) || !!st.contactSubmitting,
    submitContact: async () => {
      const name = (st.contactName || '').trim();
      const email = (st.contactEmail || '').trim();
      const message = (st.contactMessage || '').trim();
      if (!name || !email || !message || st.contactSubmitting) return;
      patch({ contactSubmitting: true, contactError: null });
      try {
        await submitContactMessage({ name, email, message, company: st.contactCompany });
        patch({ contactSubmitting: false, contactSent: true, contactName: '', contactEmail: '', contactMessage: '' });
      } catch (err) {
        patch({ contactSubmitting: false, contactError: err.message || 'Could not send your message. Please try again.' });
      }
    },
    contactSent: !!st.contactSent,
    openPromoPlan: (planKey) => () =>
      patch({
        promoPlanOpen: true,
        promoPlanSent: false,
        promoPlanKey: planKey,
        promoPlanName: '',
        promoPlanEmail: '',
        promoPlanPhone: '',
        promoPlanSubmitting: false,
        promoPlanError: null,
      }),
    closePromoPlan: () => patch({ promoPlanOpen: false, promoPlanSent: false }),
    promoPlanOpen: !!st.promoPlanOpen,
    promoPlanSent: !!st.promoPlanSent,
    promoPlan: SPOTLIGHT_PLANS.find((p) => p.key === st.promoPlanKey) || SPOTLIGHT_PLANS[0],
    promoPlanNameInput: st.promoPlanName || '',
    setPromoPlanName: (e) => patch({ promoPlanName: e.target.value }),
    promoPlanEmailInput: st.promoPlanEmail || '',
    setPromoPlanEmail: (e) => patch({ promoPlanEmail: e.target.value }),
    promoPlanPhoneInput: st.promoPlanPhone || '',
    setPromoPlanPhone: (e) => patch({ promoPlanPhone: e.target.value }),
    promoPlanCompanyInput: st.promoPlanCompany || '',
    setPromoPlanCompany: (e) => patch({ promoPlanCompany: e.target.value }),
    promoPlanSubmitting: !!st.promoPlanSubmitting,
    promoPlanError: st.promoPlanError || '',
    promoPlanSubmitDisabled:
      !(st.promoPlanName || '').trim() || !(st.promoPlanEmail || '').trim() || st.promoPlanEmail.indexOf('@') < 1 || !!st.promoPlanSubmitting,
    submitPromoPlan: async () => {
      const name = (st.promoPlanName || '').trim();
      const email = (st.promoPlanEmail || '').trim();
      if (!name || !email || email.indexOf('@') < 1 || st.promoPlanSubmitting) return;
      const plan = SPOTLIGHT_PLANS.find((p) => p.key === st.promoPlanKey) || SPOTLIGHT_PLANS[0];
      patch({ promoPlanSubmitting: true, promoPlanError: null });
      try {
        await submitSpotlightInterest({
          plan: plan.name,
          businessName: name,
          email,
          phone: (st.promoPlanPhone || '').trim(),
          company: st.promoPlanCompany,
        });
        patch({ promoPlanSubmitting: false, promoPlanSent: true });
      } catch (err) {
        patch({ promoPlanSubmitting: false, promoPlanError: err.message || 'Could not send your request. Please try again.' });
      }
    },
    goAccount: st.accountRole === 'vendor' ? nav('vendor-dashboard') : nav('account'),
    navMenuOpen: !!st.navMenuOpen,
    toggleNavMenu: () => patch((s) => ({ navMenuOpen: !s.navMenuOpen })),
    closeNavMenu: () => patch({ navMenuOpen: false }),
    startPlanning: () =>
      patch({
        planModalOpen: true,
        planStep: 1,
        planCelebrationType: null,
        planOccasion: null,
        planEventDate: '',
        planLoc: 0,
        planCats: [],
        planBudget: 0,
        planAuthEmail: st.email || '',
        planAuthSending: false,
        planAuthSent: false,
        planAuthError: null,
        planSubmitting: false,
        planSubmitError: null,
      }),
    planModalOpen: !!st.planModalOpen,
    closePlanModal: () => patch({ planModalOpen: false }),
    planStep: st.planStep || 1,
    planTotalSteps: 6,
    planStepBack: () => patch((s) => ({ planStep: Math.max(1, (s.planStep || 1) - 1) })),
    celebrationTypeTiles: CELEBRATION_TYPES.map((t) => ({
      key: t.key,
      label: t.label,
      hint: t.hint,
      on: st.planCelebrationType === t.key,
      pick: () => patch({ planCelebrationType: t.key, planOccasion: null, planStep: 2 }),
    })),
    planOccasionTiles: (OCCASIONS_BY_CELEBRATION_TYPE[st.planCelebrationType] || []).map((label) => ({
      label,
      on: st.planOccasion === label,
      pick: () => {
        const suggested = OCCASION_SUGGESTED_CATEGORIES[label] || [];
        const codes = CATS.filter((c) => suggested.includes(c[1])).map((c) => c[0]);
        patch({ planOccasion: label, planCats: codes, planStep: 3 });
      },
    })),
    planEventLabel: st.planOccasion || '',

    planEventDate: st.planEventDate || '',
    setPlanEventDate: (e) => patch({ planEventDate: e.target.value }),
    planLoc: st.planLoc || 0,
    setPlanLoc: (e) => patch({ planLoc: Number(e.target.value) }),
    planWhenWhereNext: () => patch({ planStep: 4 }),

    planCategoryTiles: CATS.map((c) => ({
      code: c[0],
      name: c[1],
      on: (st.planCats || []).includes(c[0]),
      toggle: () =>
        patch((s) => ({
          planCats: (s.planCats || []).includes(c[0])
            ? s.planCats.filter((x) => x !== c[0])
            : s.planCats.concat([c[0]]),
        })),
    })),
    planServicesNext: () => patch({ planStep: 5 }),
    planServicesNextDisabled: !(st.planCats || []).length,

    planBudgetTiles: PRICE_FILTERS.map((f, i) => ({
      label: f.label,
      on: (st.planBudget || 0) === i,
      pick: () => patch({ planBudget: i }),
    })),
    planBudgetNext: () => patch({ planStep: 6 }),

    planAuthEmail: st.planAuthEmail || '',
    setPlanAuthEmail: (e) => patch({ planAuthEmail: e.target.value, planAuthSent: false, planAuthError: null }),
    planAuthSending: !!st.planAuthSending,
    planAuthSent: !!st.planAuthSent,
    planAuthError: st.planAuthError || '',
    planSendMagicLink: async () => {
      const email = (st.planAuthEmail || '').trim();
      if (!email || email.indexOf('@') < 1 || st.planAuthSending) return;
      patch({ planAuthSending: true, planAuthError: null });
      try {
        localStorage.setItem(
          POST_AUTH_RETURN_KEY,
          JSON.stringify({
            resumePlan: {
              eventLabel: st.planOccasion || 'Your event',
              eventDate: st.planEventDate || '',
              locationLabel: LOCATIONS[st.planLoc || 0],
              locIndex: st.planLoc || 0,
              categoryCodes: st.planCats || [],
              budgetLabel: PRICE_FILTERS[st.planBudget || 0].label,
              budgetIndex: st.planBudget || 0,
            },
          })
        );
      } catch {
        // ignore storage failures — worst case they land back signed in without the plan auto-saved
      }
      try {
        await sendMagicLink(email);
        patch({ planAuthSending: false, planAuthSent: true });
      } catch (err) {
        patch({ planAuthSending: false, planAuthError: err.message || 'Something went wrong sending your sign-in link. Please try again.' });
      }
    },
    planSubmitting: !!st.planSubmitting,
    planSubmitError: st.planSubmitError || '',
    planSubmitDisabled: !!st.planSubmitting,
    finishPlanning: async () => {
      if (st.planSubmitting) return;
      const label = st.planOccasion || 'Your event';
      patch({ planSubmitting: true, planSubmitError: null });
      try {
        await submitPlanningRequest({
          eventLabel: label,
          eventDate: st.planEventDate || '',
          location: LOCATIONS[st.planLoc || 0],
          categoryCodes: st.planCats || [],
          budgetLabel: PRICE_FILTERS[st.planBudget || 0].label,
          contactEmail: st.email || '',
        });
        patch({
          planModalOpen: false,
          planSubmitting: false,
          screen: 'suppliers',
          dirCat: 'ALL',
          dirCats: st.planCats || [],
          dirPlanLabel: label,
          dirLoc: st.planLoc || 0,
          dirPrice: st.planBudget || 0,
          dirVisible: 6,
          navMenuOpen: false,
        });
      } catch (err) {
        patch({ planSubmitting: false, planSubmitError: err.message || 'Something went wrong. Please try again.' });
      }
    },
    dirPlanLabel: st.dirPlanLabel || '',
    clearDirPlan: () => patch({ dirCats: [], dirPlanLabel: '' }),
    backToCategory: () =>
      patch({ screen: 'suppliers', dirCat: sup.code, dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false }),

    homeQuery: st.dirQuery || '',
    setHomeQuery: (e) => patch({ dirQuery: e.target.value }),
    runHomeSearch: () => patch({ screen: 'suppliers', dirCat: 'ALL', dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false }),
    homeSearchKeyDown: (e) => {
      if (e.key === 'Enter') patch({ screen: 'suppliers', dirCat: 'ALL', dirCats: [], dirPlanLabel: '', dirLoc: 0, dirVisible: 6, navMenuOpen: false });
    },

    topCategoryTiles: (() => {
      const all = CATS.map((c) => ({ c, n: SUPPLIERS.filter((s) => (s.codes || [s.code]).includes(c[0])).length }))
        .sort((a, b) => b.n - a.n)
        .map((x) => catTile(x.c));
      return st.catExpanded ? all : all.slice(0, 8);
    })(),
    catHasMore: CATS.length > 8,
    catExpanded: !!st.catExpanded,
    toggleCatExpanded: () => patch((s) => ({ catExpanded: !s.catExpanded })),

    // "Claim Your Business" — real businesses found via web search, not yet
    // listed on Eventory. Claiming just routes into the normal vendor
    // onboarding flow, pre-filled with what we already found.
    claimBusinessTiles: unclaimedBusinesses.map(claimTile),
    // Same list, but respecting whatever category/location/search filters
    // are active on the Discover Vendors page, so it doesn't show
    // businesses that don't match what the buyer is currently looking for.
    dirClaimBusinessTiles: unclaimedBusinesses
      .filter((b) => {
        if (st.dirCat !== 'ALL' && b.categoryCode !== st.dirCat) return false;
        if ((st.dirCats || []).length && !st.dirCats.includes(b.categoryCode)) return false;
        if (st.dirLoc !== 0 && b.city !== LOCATIONS[st.dirLoc]) return false;
        if (dirQueryLower && b.name.toLowerCase().indexOf(dirQueryLower) < 0 && catName(b.categoryCode).toLowerCase().indexOf(dirQueryLower) < 0) return false;
        return true;
      })
      .map(claimTile),

    topSuppliers: SUPPLIERS.slice()
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 6)
      .map((s, i) => ({
        key: s.id,
        cover: s.coverUrl || fallbackPhotoFor(s.code, i),
        name: s.name,
        location: s.city,
        categoryName: catName(s.code),
        rating: s.rating,
        startPriceLabel: s.priceOnRequest ? 'Price on request' : startPrice(s) === null ? '' : 'From ' + money(startPrice(s)),
        isSaved: (st.savedVendors || []).indexOf(s.id) >= 0,
        toggleSaved: () => toggleSaveVendor(s.id),
        share: () => shareVendor(s.id),
        justCopied: st.copiedVendorId === s.id,
        open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
      })),

    dirActiveCat: st.dirCat === 'ALL' ? null : CATS.find((c) => c[0] === st.dirCat) || null,
    dirCategoryFilters: [{ code: 'ALL', name: 'All categories' }, ...CATS.map((c) => ({ code: c[0], name: c[1] }))].map((c) => {
      const n = c.code === 'ALL' ? SUPPLIERS.length : SUPPLIERS.filter((s) => (s.codes || [s.code]).includes(c.code)).length;
      return {
        code: c.code,
        label: c.name,
        countLabel: c.code === 'ALL' ? n + (n === 1 ? ' vendor' : ' vendors') : n ? String(n) : 'None yet',
        on: st.dirCat === c.code,
        pick: () => patch({ dirCat: c.code, dirCatMenuOpen: false, dirVisible: 6, dirCats: [], dirPlanLabel: '' }),
      };
    }),
    dirCategoryLabel: (CATS.find((c) => c[0] === st.dirCat) || [null, 'Select category'])[1],
    dirCatMenuOpen: !!st.dirCatMenuOpen,
    toggleDirCatMenu: () => patch((s) => ({ dirCatMenuOpen: !s.dirCatMenuOpen })),
    closeDirCatMenu: () => patch({ dirCatMenuOpen: false }),
    dirLocationFilters: LOCATIONS.map((l, i) => ({
      label: l,
      on: i === (st.dirLoc || 0),
      pick: () => patch({ dirLoc: i, dirVisible: 6, dirLocMenuOpen: false }),
    })),
    dirLocationLabel: LOCATIONS[st.dirLoc || 0],
    dirLocMenuOpen: !!st.dirLocMenuOpen,
    toggleDirLocMenu: () => patch((s) => ({ dirLocMenuOpen: !s.dirLocMenuOpen })),
    closeDirLocMenu: () => patch({ dirLocMenuOpen: false }),
    dirPriceFilters: PRICE_FILTERS.map((f, i) => ({ label: f.label, ...chip(i === (st.dirPrice || 0)), pick: () => patch({ dirPrice: i, dirVisible: 6 }) })),
    dirQuery: st.dirQuery || '',
    setDirQuery: (e) => patch({ dirQuery: e.target.value, dirVisible: 6 }),
    dirResultLabel: dirFiltered.length + ' of ' + SUPPLIERS.length + ' vendors',
    dirSupplierRows: dirFiltered.slice(0, st.dirVisible || 6).map((s, i) => ({
      key: s.id,
      cover: s.coverUrl || fallbackPhotoFor(s.code, i),
      name: s.name,
      location: s.city,
      categoryName: catName(s.code),
      description: s.bio,
      rating: s.rating,
      startPriceLabel: s.priceOnRequest ? 'Price on request' : startPrice(s) === null ? '' : 'From ' + money(startPrice(s)),
      isSaved: (st.savedVendors || []).indexOf(s.id) >= 0,
      toggleSaved: () => toggleSaveVendor(s.id),
      share: () => shareVendor(s.id),
      justCopied: st.copiedVendorId === s.id,
      open: () => patch({ screen: 'supplier', supId: s.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
    })),
    dirShowSeeAll: dirFiltered.length > (st.dirVisible || 6),
    dirSeeAllLabel: 'See all ' + dirFiltered.length + ' vendors',
    seeAllDir: () => patch({ dirVisible: dirFiltered.length }),

    supDetailLoading,
    sup: {
      logo: sup.logoUrl || avatarUrl(sup.name),
      cover: supCoverFallback,
      carouselPhotos: supCarouselPhotos,
      carouselIndex: (st.supCarouselIndex || 0) % supCarouselPhotos.length,
      isSaved: (st.savedVendors || []).indexOf(sup.id) >= 0,
      toggleSaved: () => toggleSaveVendor(sup.id),
      share: () => shareVendor(sup.id),
      justCopied: st.copiedVendorId === sup.id,
      name: sup.name,
      code: sup.code,
      description: sup.bio,
      about: sup.desc,
      categoryName: catName(sup.code),
      verified: !!sup.verified,
      ratingLabel: sup.rating,
      startPriceLabel: sup.priceOnRequest ? 'Price on request' : startPrice(sup) === null ? '' : 'From ' + money(startPrice(sup)),
      facts: [
        { label: 'Based in', value: sup.city },
        sup.addressLine1
          ? { label: 'Address', value: [sup.addressLine1, sup.addressLine2].filter(Boolean).join(', ') }
          : null,
        { label: 'Service radius', value: sup.radius ? sup.radius + ' km' : 'On site only' },
        { label: 'Min group', value: sup.minGroup + ' guests' },
        { label: 'Rating', value: sup.rating },
        { label: 'Response time', value: sup.response },
      ].filter(Boolean),
      phone: sup.phone,
      whatsappUrl: sup.phone
        ? 'https://wa.me/' +
          whatsappDigits(sup.phone) +
          '?text=' +
          encodeURIComponent(`Hi ${sup.name}, I found you on Eventory and I'm interested in your services.`)
        : null,
      social: [
        sup.instagram ? { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', sup.instagram) } : null,
        sup.facebook ? { key: 'facebook', label: 'Facebook', href: socialUrl('facebook', sup.facebook) } : null,
        sup.tiktok ? { key: 'tiktok', label: 'TikTok', href: socialUrl('tiktok', sup.tiktok) } : null,
      ].filter(Boolean),
      promos: (sup.promos || []).map((p) => ({ key: p.title, ...p })),
      reviews: (sup.reviews || []).map((r) => ({
        key: r.author,
        author: r.author,
        stars: '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars),
        text: r.text,
      })),
      faqs: (sup.faqs || []).map((f) => ({ key: f.q, q: f.q, a: f.a })),
      gallery: Object.entries(
        (sup.gallery || []).reduce((acc, g) => {
          const key = g.eventType || 'General';
          (acc[key] = acc[key] || []).push(g.photoUrl);
          return acc;
        }, {})
      ).map(([eventType, photos]) => ({ key: eventType, eventType, photos })),
      policies: (sup.policies || []).map((p) => ({ key: p.title, label: p.title, text: p.body })),
      menuItems: sup.menuItems || [],
    },

    openWaModal: () =>
      patch({ waModalOpen: true, waEventType: null, waEventTypeOther: '', waEventDate: '', waVenue: '', waAttendees: '', waService: null }),
    closeWaModal: () => patch({ waModalOpen: false }),
    waModalOpen: !!st.waModalOpen,
    waEventTypeTiles: EVENT_TYPES.map((t) => ({
      key: t.key,
      label: t.label,
      on: st.waEventType === t.key,
      pick: () => patch({ waEventType: t.key }),
    })),
    waEventTypeOther: st.waEventTypeOther || '',
    setWaEventTypeOther: (e) => patch({ waEventTypeOther: e.target.value }),
    waEventDate: st.waEventDate || '',
    setWaEventDate: (e) => patch({ waEventDate: e.target.value }),
    waVenue: st.waVenue || '',
    setWaVenue: (e) => patch({ waVenue: e.target.value }),
    waAttendees: st.waAttendees || '',
    setWaAttendees: (e) => patch({ waAttendees: e.target.value.replace(/[^0-9]/g, '') }),
    waServiceTiles: supProducts.map((p) => ({
      key: p.name,
      label: p.name,
      on: st.waService === p.name,
      pick: () => patch({ waService: st.waService === p.name ? null : p.name }),
    })),
    waSendDisabled: !st.waEventType || (st.waEventType === 'other' && !(st.waEventTypeOther || '').trim()),
    waSendUrl: sup.phone
      ? 'https://wa.me/' +
        whatsappDigits(sup.phone) +
        '?text=' +
        encodeURIComponent(
          buildWaMessage(sup.name, {
            eventTypeLabel:
              st.waEventType === 'other'
                ? (st.waEventTypeOther || '').trim()
                : ((EVENT_TYPES.find((t) => t.key === st.waEventType) || {}).label || '').toLowerCase(),
            eventDate: st.waEventDate,
            venue: st.waVenue,
            attendees: st.waAttendees,
            service: st.waService,
          })
        )
      : null,

    startQuote: () => {
      if (!st.signedIn) {
        try {
          localStorage.setItem(POST_AUTH_RETURN_KEY, JSON.stringify({ screen: 'supplier', supId: sup.id, openQuote: true }));
        } catch {
          // ignore storage failures — worst case the user has to click again after signing in
        }
        patch({ screen: 'account', navMenuOpen: false });
        return;
      }
      patch({
        quoteModalOpen: true,
        quoteStep: 1,
        quoteEventType: null,
        quoteEventTypeOther: '',
        quoteEventDate: '',
        quoteVenue: '',
        quoteAnswers: {},
        quoteContactName: st.quoteContactName || '',
        quoteContactEmail: st.quoteContactEmail || st.email || '',
        quoteContactPhone: st.quoteContactPhone || '',
        quoteSubmitting: false,
        quoteSubmitError: null,
        quoteSent: false,
      });
    },
    quoteModalOpen: !!st.quoteModalOpen,
    closeQuoteModal: () => patch({ quoteModalOpen: false }),
    quoteStep: st.quoteStep || 1,
    quoteTotalSteps: 6,
    quoteStepBack: () => patch((s) => ({ quoteStep: Math.max(1, (s.quoteStep || 1) - 1) })),
    quoteEventTypeTiles: EVENT_TYPES.map((t) => ({
      key: t.key,
      label: t.label,
      on: st.quoteEventType === t.key,
      pick: () => patch({ quoteEventType: t.key }),
    })),
    quoteEventTypeOther: st.quoteEventTypeOther || '',
    setQuoteEventTypeOther: (e) => patch({ quoteEventTypeOther: e.target.value }),
    quoteStep1Valid: !!st.quoteEventType && (st.quoteEventType !== 'other' || !!(st.quoteEventTypeOther || '').trim()),
    quoteEventDate: st.quoteEventDate || '',
    setQuoteEventDate: (e) => patch({ quoteEventDate: e.target.value }),
    quoteStep2Valid: !!st.quoteEventDate,
    quoteVenue: st.quoteVenue || '',
    setQuoteVenue: (e) => patch({ quoteVenue: e.target.value }),
    quoteStep3Valid: !!(st.quoteVenue || '').trim(),
    quoteCategoryFields: FIELDS[sup.code] || FIELDS_DEFAULT,
    quoteAnswer: (k) => (st.quoteAnswers || {})[k] || '',
    setQuoteAnswer: (k) => (e) => patch((s) => ({ quoteAnswers: { ...(s.quoteAnswers || {}), [k]: e.target.value } })),
    pickQuoteAnswer: (k, v) => () => patch((s) => ({ quoteAnswers: { ...(s.quoteAnswers || {}), [k]: v } })),
    quoteContactName: st.quoteContactName || '',
    setQuoteContactName: (e) => patch({ quoteContactName: e.target.value }),
    quoteContactEmail: st.quoteContactEmail || '',
    setQuoteContactEmail: (e) => patch({ quoteContactEmail: e.target.value }),
    quoteContactPhone: st.quoteContactPhone || '',
    setQuoteContactPhone: (e) => patch({ quoteContactPhone: e.target.value }),
    quoteStep5Valid: !!(st.quoteContactName || '').trim() && !!(st.quoteContactEmail || '').trim() && st.quoteContactEmail.indexOf('@') > 0,
    quoteNextStep: () => patch((s) => ({ quoteStep: Math.min(6, (s.quoteStep || 1) + 1) })),
    quoteEventLabel:
      st.quoteEventType === 'other'
        ? st.quoteEventTypeOther || 'Other'
        : (EVENT_TYPES.find((t) => t.key === st.quoteEventType) || {}).label || '',
    quoteReviewAnswers: (FIELDS[sup.code] || FIELDS_DEFAULT)
      .map((f) => ({ key: f.k, label: f.label, value: (st.quoteAnswers || {})[f.k] }))
      .filter((r) => r.value),
    quoteSubmitting: !!st.quoteSubmitting,
    quoteSubmitError: st.quoteSubmitError || '',
    quoteSent: !!st.quoteSent,
    submitQuote: async () => {
      if (st.quoteSubmitting) return;
      patch({ quoteSubmitting: true, quoteSubmitError: null });
      try {
        await submitQuoteRequest({
          vendorId: sup.id,
          eventType:
            st.quoteEventType === 'other'
              ? st.quoteEventTypeOther || 'Other'
              : (EVENT_TYPES.find((t) => t.key === st.quoteEventType) || {}).label || st.quoteEventType,
          eventTypeOther: st.quoteEventType === 'other' ? st.quoteEventTypeOther : null,
          eventDate: st.quoteEventDate,
          venue: st.quoteVenue,
          categoryAnswers: st.quoteAnswers || {},
          contactName: st.quoteContactName,
          contactEmail: st.quoteContactEmail,
          contactPhone: st.quoteContactPhone,
        });
        patch({ quoteSubmitting: false, quoteSent: true });
      } catch (err) {
        patch({ quoteSubmitting: false, quoteSubmitError: err.message || 'Could not send your request. Please try again.' });
      }
    },

    // Inline "Inquire" tab on the vendor profile — a single-page version of
    // the quote/WhatsApp flows above, so a buyer can fill one form and send
    // it either way without leaving the tab.
    inqName: st.inqName || '',
    setInqName: (e) => patch({ inqName: e.target.value }),
    inqEmail: st.inqEmail || '',
    setInqEmail: (e) => patch({ inqEmail: e.target.value }),
    inqPhone: st.inqPhone || '',
    setInqPhone: (e) => patch({ inqPhone: e.target.value }),
    inqEventType: st.inqEventType || '',
    setInqEventType: (e) => patch({ inqEventType: e.target.value }),
    inqEventTypeOther: st.inqEventTypeOther || '',
    setInqEventTypeOther: (e) => patch({ inqEventTypeOther: e.target.value }),
    inqEventDate: st.inqEventDate || '',
    setInqEventDate: (e) => patch({ inqEventDate: e.target.value }),
    inqGuests: st.inqGuests || '',
    setInqGuests: (e) => patch({ inqGuests: e.target.value.replace(/[^0-9]/g, '') }),
    inqMessage: st.inqMessage || '',
    setInqMessage: (e) => patch({ inqMessage: e.target.value }),
    inqServiceTiles: supProducts.map((p) => ({
      key: p.name,
      label: p.name,
      on: st.inqService === p.name,
      pick: () => patch({ inqService: st.inqService === p.name ? null : p.name }),
    })),
    inqEventTypeLabel:
      st.inqEventType === 'other'
        ? (st.inqEventTypeOther || '').trim()
        : (EVENT_TYPES.find((t) => t.key === st.inqEventType) || {}).label || '',
    inqWaUrl: sup.phone
      ? 'https://wa.me/' +
        whatsappDigits(sup.phone) +
        '?text=' +
        encodeURIComponent(
          buildWaMessage(sup.name, {
            eventTypeLabel:
              st.inqEventType === 'other'
                ? (st.inqEventTypeOther || '').trim()
                : ((EVENT_TYPES.find((t) => t.key === st.inqEventType) || {}).label || '').toLowerCase(),
            eventDate: st.inqEventDate,
            attendees: st.inqGuests,
            service: st.inqService,
            buyerName: (st.inqName || '').trim() || null,
            message: (st.inqMessage || '').trim() || null,
          })
        )
      : null,
    inqServiceRequired: supProducts.length > 0,
    inqServiceMissing: supProducts.length > 0 && !st.inqService,
    inqWaDisabled: supProducts.length > 0 && !st.inqService,
    inqSubmitting: !!st.inqSubmitting,
    inqSubmitError: st.inqSubmitError || '',
    inqSent: !!st.inqSent,
    inqSubmitDisabled:
      (supProducts.length > 0 && !st.inqService) ||
      (st.signedIn && (!(st.inqName || '').trim() || !(st.inqEmail || '').trim() || !!st.inqSubmitting)),
    submitInlineInquiry: async () => {
      if (!st.signedIn) {
        try {
          localStorage.setItem(POST_AUTH_RETURN_KEY, JSON.stringify({ screen: 'supplier', supId: sup.id, supplierTab: 'inquire' }));
        } catch {
          // ignore storage failures — worst case the user has to click again after signing in
        }
        patch({ screen: 'account', navMenuOpen: false });
        return;
      }
      const name = (st.inqName || '').trim();
      const email = (st.inqEmail || '').trim();
      if (!name || !email || st.inqSubmitting) return;
      const eventTypeLabel =
        st.inqEventType === 'other' ? (st.inqEventTypeOther || '').trim() || 'Other' : (EVENT_TYPES.find((t) => t.key === st.inqEventType) || {}).label || 'Not specified';
      patch({ inqSubmitting: true, inqSubmitError: null });
      try {
        const answers = {};
        if (st.inqService) answers.Service = st.inqService;
        if ((st.inqGuests || '').trim()) answers.Guests = st.inqGuests.trim();
        if ((st.inqMessage || '').trim()) answers.Message = st.inqMessage.trim();
        await submitQuoteRequest({
          vendorId: sup.id,
          eventType: eventTypeLabel,
          eventTypeOther: st.inqEventType === 'other' ? st.inqEventTypeOther : null,
          eventDate: st.inqEventDate,
          venue: '',
          categoryAnswers: answers,
          contactName: name,
          contactEmail: email,
          contactPhone: st.inqPhone,
        });
        patch({ inqSubmitting: false, inqSent: true });
      } catch (err) {
        patch({ inqSubmitting: false, inqSubmitError: err.message || 'Could not send your inquiry. Please try again.' });
      }
    },

    openFaqKey: st.openFaqKey || null,
    toggleFaq: (key) => patch((s) => ({ openFaqKey: s.openFaqKey === key ? null : key })),
    supplierTab: st.supplierTab || 'services',
    supplierTabs: [
      { key: 'inquire', label: 'Inquire', highlight: true },
      { key: 'about', label: 'About' },
      { key: 'services', label: 'Packages (' + supProducts.length + ')' },
      { key: 'gallery', label: 'Gallery' },
      hasMenu && { key: 'menu', label: 'Menu' },
      { key: 'reviews', label: 'Reviews (' + (sup.reviews || []).length + ')' },
      { key: 'faq', label: 'FAQ' },
      hasPolicies && { key: 'policies', label: 'Policies' },
    ]
      .filter(Boolean)
      .map((t) => ({
        ...t,
        active: (st.supplierTab || 'services') === t.key,
        go: () => patch({ supplierTab: t.key }),
      })),

    reviewFormOpen: !!st.reviewFormOpen,
    reviewSent: !!st.reviewSent,
    reviewSending: !!st.reviewSending,
    reviewError: st.reviewError || '',
    reviewAuthor: st.reviewAuthor || '',
    setReviewAuthor: (e) => patch({ reviewAuthor: e.target.value }),
    reviewStars: st.reviewStars || 0,
    setReviewStars: (n) => patch({ reviewStars: n }),
    reviewBody: st.reviewBody || '',
    setReviewBody: (e) => patch({ reviewBody: e.target.value }),
    reviewCompany: st.reviewCompany || '',
    setReviewCompany: (e) => patch({ reviewCompany: e.target.value }),
    openReviewForm: () => patch({ reviewFormOpen: true, reviewSent: false, reviewError: null }),
    cancelReviewForm: () =>
      patch({ reviewFormOpen: false, reviewError: null, reviewAuthor: '', reviewStars: 0, reviewBody: '', reviewCompany: '' }),
    submitReview: async () => {
      if (st.reviewSending) return;
      if (!st.reviewAuthor || !st.reviewAuthor.trim()) {
        patch({ reviewError: 'Enter your name.' });
        return;
      }
      if (!st.reviewStars) {
        patch({ reviewError: 'Choose a star rating.' });
        return;
      }
      if (!st.reviewBody || !st.reviewBody.trim()) {
        patch({ reviewError: 'Share a few words about your experience.' });
        return;
      }
      patch({ reviewSending: true, reviewError: null });
      try {
        await submitVendorReview({
          vendorId: sup.id,
          author: st.reviewAuthor.trim(),
          stars: st.reviewStars,
          body: st.reviewBody.trim(),
          company: st.reviewCompany,
        });
        patch({
          reviewSending: false,
          reviewSent: true,
          reviewFormOpen: false,
          reviewAuthor: '',
          reviewStars: 0,
          reviewBody: '',
          reviewCompany: '',
        });
      } catch (err) {
        patch({ reviewSending: false, reviewError: err.message || 'Something went wrong submitting your review. Please try again.' });
      }
    },

    svcQuery: st.svcQuery || '',
    setSvcQuery: (e) => patch({ svcQuery: e.target.value, svcVisible: 8 }),
    svcHasGroups: svcGroups.length > 1,
    svcGroupFilters: ['All'].concat(svcGroups).map((g) => ({
      label: g,
      ...chip(svcGroupFilter === g),
      pick: () => patch({ svcGroup: g, svcVisible: 8 }),
    })),
    svcResultLabel:
      svcFiltered.length +
      (svcFiltered.length === 1 ? ' service' : ' services') +
      (svcFiltered.length !== supProducts.length ? ' of ' + supProducts.length : ''),
    svcShowMore: svcFiltered.length > svcVisible.length,
    svcRemainingLabel: 'Show ' + Math.min(8, svcFiltered.length - svcVisible.length) + ' more',
    loadMoreSvc: () => patch((s) => ({ svcVisible: (s.svcVisible || 8) + 8 })),
    supplierProducts: svcVisible.map((p, i) => ({
      key: p.id,
      photo: p.photoUrl || fallbackPhotoFor(sup.code, i),
      name: p.name,
      description: p.description,
      inclusions: p.inclusions || [],
      termsLabel: 'Min ' + p.minQty + ' ' + (p.unit === 'flat' ? 'booking' : 'units'),
      priceLabel: priceLabel(p),
      saved: (st.saved || []).indexOf(p.id) >= 0,
      saveLabel: (st.saved || []).indexOf(p.id) >= 0 ? '★ Saved' : '☆ Save',
      toggleSave: () => toggleSave(p.id),
      shareLabel: st.copiedPid === p.id ? 'Copied!' : 'Share',
      share: () => shareProduct(p.id),
    })),
    signInDisabled: !(st.email && st.email.indexOf('@') > 0) || !!st.authSending,

    email: st.email || '',
    setEmail: (e) => patch({ email: e.target.value, authSent: false, authError: null }),
    signedIn: !!st.signedIn,
    needsAccount: !st.signedIn,
    accountLabel: st.signedIn ? 'Signed in · ' + st.email : 'Sign in',

    isSignedIn: !!st.signedIn,
    accountNeedsSignIn: !st.signedIn,
    accountEmail: st.email || '',
    setAccountEmail: (e) => patch({ email: e.target.value, authSent: false, authError: null }),
    authSending: !!st.authSending,
    authSent: !!st.authSent,
    authError: st.authError || '',
    useDifferentEmail: () => patch({ authSent: false, authError: null }),
    signIn: async () => {
      if (!st.email || st.email.indexOf('@') < 1 || st.authSending) return;
      patch({ authSending: true, authError: null });
      try {
        let existing = {};
        try {
          const raw = localStorage.getItem(POST_AUTH_RETURN_KEY);
          if (raw) existing = JSON.parse(raw) || {};
        } catch {
          // ignore malformed/inaccessible storage
        }
        localStorage.setItem(
          POST_AUTH_RETURN_KEY,
          JSON.stringify({
            screen: existing.screen || st.screen,
            ...(existing.supId ? { supId: existing.supId } : {}),
            ...(existing.supplierTab ? { supplierTab: existing.supplierTab } : {}),
            ...(existing.openQuote ? { openQuote: true } : {}),
          })
        );
      } catch {
        // ignore storage failures — worst case the user lands back on home
      }
      try {
        await sendMagicLink(st.email);
        patch({ authSending: false, authSent: true });
      } catch (err) {
        patch({ authSending: false, authError: err.message || 'Something went wrong sending your sign-in link. Please try again.' });
      }
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      patch({ signedIn: false, authSent: false, authError: null });
    },
    promoOptIn: !!st.promoOptIn,
    togglePromoOptIn: () => patch((s) => ({ promoOptIn: !s.promoOptIn })),

    savedProducts: (st.saved || [])
      .map((pid) => {
        const p = product(pid);
        if (!p) return null;
        const s = supplier(p.supId);
        return {
          key: pid,
          photo: p.photoUrl || fallbackPhotoFor(s ? s.code : null, 0),
          name: p.name,
          supplierName: s ? s.name : '',
          priceLabel: priceLabel(p),
          openSupplier: () =>
            patch({ screen: 'supplier', supId: p.supId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
          remove: () => toggleSave(pid),
          share: () => shareProduct(pid),
          shareLabel: st.copiedPid === pid ? 'Copied!' : 'Share',
        };
      })
      .filter(Boolean),
    hasSaved: (st.saved || []).length > 0,

    savedVendorRows: (st.savedVendors || [])
      .map((vid) => {
        const s = supplier(vid);
        if (!s) return null;
        return {
          key: vid,
          logo: s.logoUrl || avatarUrl(s.name),
          name: s.name,
          categoryName: catName(s.code),
          open: () =>
            patch({ screen: 'supplier', supId: vid, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
          unsave: () => toggleSaveVendor(vid),
        };
      })
      .filter(Boolean),
    hasSavedVendors: (st.savedVendors || []).length > 0,

    dashboardQuotesLoading: !!st.dashboardQuotesLoading,
    dashboardQuotesError: st.dashboardQuotesError || '',
    dashboardInquiries: (st.dashboardQuotes || []).map((q) => ({
      key: q.id,
      vendorName: q.vendorName,
      eventType: q.eventType,
      eventDate: q.eventDate,
      venue: q.venue,
      statusLabel: q.status === 'new' ? 'Sent' : q.status,
      open: () =>
        patch({ screen: 'supplier', supId: q.vendorId, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
    })),
    hasDashboardInquiries: (st.dashboardQuotes || []).length > 0,

    vsiEmail: st.vsiEmail || '',
    setVsiEmail: (e) => patch({ vsiEmail: e.target.value, vsiError: null }),
    vsiPassword: st.vsiPassword || '',
    setVsiPassword: (e) => patch({ vsiPassword: e.target.value, vsiError: null }),
    vsiShowPassword: !!st.vsiShowPassword,
    toggleVsiShowPassword: () => patch((s) => ({ vsiShowPassword: !s.vsiShowPassword })),
    vsiSubmitting: !!st.vsiSubmitting,
    vsiError: st.vsiError || '',
    vsiDisabled: !(st.vsiEmail && st.vsiEmail.indexOf('@') > 0 && (st.vsiPassword || '').length > 0) || !!st.vsiSubmitting,
    vsiSignIn: async () => {
      if (!st.vsiEmail || st.vsiEmail.indexOf('@') < 1 || !st.vsiPassword || st.vsiSubmitting) return;
      patch({ vsiSubmitting: true, vsiError: null });
      try {
        const user = await signInVendor(st.vsiEmail, st.vsiPassword);
        patch({ vsiSubmitting: false, signedIn: true, email: user.email || st.vsiEmail, accountRole: 'vendor', screen: 'vendor-dashboard' });
      } catch (err) {
        patch({ vsiSubmitting: false, vsiError: err.message || 'Could not sign in. Check your email and password and try again.' });
      }
    },
    vsiForgotMode: !!st.vsiForgotMode,
    openVsiForgot: () => patch({ vsiForgotMode: true, vsiForgotSent: false, vsiForgotError: null }),
    closeVsiForgot: () => patch({ vsiForgotMode: false, vsiForgotSent: false, vsiForgotError: null }),
    vsiForgotSubmitting: !!st.vsiForgotSubmitting,
    vsiForgotSent: !!st.vsiForgotSent,
    vsiForgotError: st.vsiForgotError || '',
    vsiForgotDisabled: !(st.vsiEmail && st.vsiEmail.indexOf('@') > 0) || !!st.vsiForgotSubmitting,
    submitVsiForgot: async () => {
      if (!st.vsiEmail || st.vsiEmail.indexOf('@') < 1 || st.vsiForgotSubmitting) return;
      patch({ vsiForgotSubmitting: true, vsiForgotError: null });
      try {
        await sendVendorAccountSetupEmail(st.vsiEmail);
        patch({ vsiForgotSubmitting: false, vsiForgotSent: true });
      } catch (err) {
        patch({ vsiForgotSubmitting: false, vsiForgotError: err.message || 'Could not send a reset link. Please try again.' });
      }
    },

    newPassword: st.newPassword || '',
    setNewPassword: (e) => patch({ newPassword: e.target.value }),
    newPasswordConfirm: st.newPasswordConfirm || '',
    setNewPasswordConfirm: (e) => patch({ newPasswordConfirm: e.target.value }),
    newShowPassword: !!st.newShowPassword,
    toggleNewShowPassword: () => patch((s) => ({ newShowPassword: !s.newShowPassword })),
    newShowPasswordConfirm: !!st.newShowPasswordConfirm,
    toggleNewShowPasswordConfirm: () => patch((s) => ({ newShowPasswordConfirm: !s.newShowPasswordConfirm })),
    newPasswordSubmitting: !!st.newPasswordSubmitting,
    newPasswordError: st.newPasswordError || '',
    newPasswordDisabled:
      !((st.newPassword || '').length >= 6 && st.newPassword === st.newPasswordConfirm) || !!st.newPasswordSubmitting,
    submitNewPassword: async () => {
      if ((st.newPassword || '').length < 6 || st.newPassword !== st.newPasswordConfirm || st.newPasswordSubmitting) return;
      patch({ newPasswordSubmitting: true, newPasswordError: null });
      try {
        await updateVendorPassword(st.newPassword);
        patch({
          newPasswordSubmitting: false,
          newPassword: '',
          newPasswordConfirm: '',
          screen: 'vendor-dashboard',
        });
      } catch (err) {
        patch({ newPasswordSubmitting: false, newPasswordError: err.message || 'Could not set your password. Please try again.' });
      }
    },

    vdLoading: !!st.vdLoading,
    vdError: st.vdError || '',
    vdVendor: st.vdVendor,
    vdHasVendor: !!st.vdVendor,
    vdStatusLabel: st.vdVendor ? (st.vdVendor.published ? 'Published' : 'Pending review') : '',
    // Nothing shown until the vendor is either walking the guided steps or
    // has opened Inquiries — there's no free-browse edit mode anymore, so
    // the dashboard never dumps a form on them unprompted.
    vdTab: st.vdTab || '',
    vdInquiriesCount: (st.vdQuotes || []).length,
    toggleVdInquiries: () => patch({ vdTab: st.vdTab === 'inquiries' ? '' : 'inquiries' }),
    vdSubmittedAt: (st.vdVendor && st.vdVendor.submittedAt) || null,
    vdSubmitting: !!st.vdSubmitting,
    vdSubmitError: st.vdSubmitError || '',
    vdSubmitForReview: () => {
      if (!st.vdVendor || st.vdSubmitting) return;
      patch({ vdSubmitting: true, vdSubmitError: null });
      submitVendorForReview(st.vdVendor.id)
        .then(() =>
          patch((s) => ({
            vdSubmitting: false,
            vdGuidedOpen: false,
            vdTab: '',
            vdVendor: s.vdVendor ? { ...s.vdVendor, submittedAt: new Date().toISOString() } : s.vdVendor,
          }))
        )
        .catch((err) => patch({ vdSubmitting: false, vdSubmitError: err.message || 'Could not submit for review. Please try again.' }));
    },
    // Building your profile is the guided step-through — Previous/Continue
    // over the same tab content and save logic as before, just walked in
    // sequence instead of browsed freely. Clearing vdTab on the way out
    // keeps the dashboard from showing whatever section was last open.
    vdGuidedOpen: !!st.vdGuidedOpen,
    startVdGuide: () => patch({ vdGuidedOpen: true, vdTab: VD_GUIDE_TABS[0] }),
    exitVdGuide: () => patch({ vdGuidedOpen: false, vdTab: '' }),
    vdGuideStepNumber: VD_GUIDE_TABS.indexOf(st.vdTab || 'profile') + 1,
    vdGuideStepCount: VD_GUIDE_TABS.length,
    vdGuideStepLabel: VD_TAB_LABELS[st.vdTab || 'profile'],
    vdGuideIsFirst: VD_GUIDE_TABS.indexOf(st.vdTab || 'profile') === 0,
    vdGuideIsLast: VD_GUIDE_TABS.indexOf(st.vdTab || 'profile') === VD_GUIDE_TABS.length - 1,
    vdGuidePrev: () => {
      const i = VD_GUIDE_TABS.indexOf(st.vdTab || 'profile');
      if (i > 0) patch({ vdTab: VD_GUIDE_TABS[i - 1] });
    },
    vdGuideNext: () => {
      const i = VD_GUIDE_TABS.indexOf(st.vdTab || 'profile');
      if (i < VD_GUIDE_TABS.length - 1) patch({ vdTab: VD_GUIDE_TABS[i + 1] });
    },
    goVdPublicProfile: () =>
      st.vdVendor &&
      patch({ screen: 'supplier', supId: st.vdVendor.id, supplierTab: 'services', svcQuery: '', svcGroup: 'All', svcVisible: 8, reviewFormOpen: false, reviewSent: false, supCarouselIndex: 0, inqName: '', inqEmail: '', inqPhone: '', inqEventType: '', inqEventTypeOther: '', inqEventDate: '', inqGuests: '', inqMessage: '', inqService: null, inqSubmitError: null, inqSent: false }),
    vdSignOut: async () => {
      if (supabase) await supabase.auth.signOut();
      patch({ signedIn: false, screen: 'home', authSent: false, authError: null, vdVendor: null });
    },

    vdSubcategory: st.vdSubcategory || '',
    setVdSubcategory: (e) => patch({ vdSubcategory: e.target.value }),
    vdContactPerson: st.vdContactPerson || '',
    setVdContactPerson: (e) => patch({ vdContactPerson: e.target.value }),
    vdPhone: st.vdPhone || '',
    setVdPhone: (e) => patch({ vdPhone: e.target.value }),
    vdCityOptions: MUNICIPALITIES,
    vdCity: st.vdCity || '',
    setVdCity: (e) => patch({ vdCity: e.target.value }),
    vdCityOtherSelected: st.vdCity === 'Other',
    vdCityOther: st.vdCityOther || '',
    setVdCityOther: (e) => patch({ vdCityOther: e.target.value }),
    vdBio: st.vdBio || '',
    setVdBio: (e) => patch({ vdBio: e.target.value }),
    vdDescription: st.vdDescription || '',
    setVdDescription: (e) => patch({ vdDescription: e.target.value }),
    vdLogoUrl: st.vdLogoUrl || '',
    vdUploadingLogo: !!st.vdUploadingLogo,
    uploadVdLogo: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ vdUploadingLogo: true, vdSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ vdUploadingLogo: false, vdLogoUrl: url });
      } catch (err) {
        patch({ vdUploadingLogo: false, vdSaveError: err.message || 'Could not upload photo.' });
      }
    },
    vdCoverUrl: st.vdCoverUrl || '',
    vdUploadingCover: !!st.vdUploadingCover,
    uploadVdCover: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ vdUploadingCover: true, vdSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ vdUploadingCover: false, vdCoverUrl: url });
      } catch (err) {
        patch({ vdUploadingCover: false, vdSaveError: err.message || 'Could not upload photo.' });
      }
    },
    vdInstagram: st.vdInstagram || '',
    setVdInstagram: (e) => patch({ vdInstagram: e.target.value }),
    vdFacebook: st.vdFacebook || '',
    setVdFacebook: (e) => patch({ vdFacebook: e.target.value }),
    vdTiktok: st.vdTiktok || '',
    setVdTiktok: (e) => patch({ vdTiktok: e.target.value }),
    vdMapLink: st.vdMapLink || '',
    setVdMapLink: (e) => patch({ vdMapLink: e.target.value }),
    vdAddressLine1: st.vdAddressLine1 || '',
    setVdAddressLine1: (e) => patch({ vdAddressLine1: e.target.value }),
    vdAddressLine2: st.vdAddressLine2 || '',
    setVdAddressLine2: (e) => patch({ vdAddressLine2: e.target.value }),
    vdStartingPrice: st.vdStartingPrice || '',
    setVdStartingPrice: (e) => patch({ vdStartingPrice: e.target.value }),
    vdSaving: !!st.vdSaving,
    vdSaveError: st.vdSaveError || '',
    vdSaved: !!st.vdSaved,
    saveVdProfile: async () => {
      if (!st.vdVendor || st.vdSaving) return;
      const vdEffectiveCity = st.vdCity === 'Other' ? (st.vdCityOther || '').trim() : st.vdCity;
      patch({ vdSaving: true, vdSaveError: null, vdSaved: false });
      try {
        await updateVendorProfile(st.vdVendor.id, {
          subcategory: st.vdSubcategory,
          contactPerson: st.vdContactPerson,
          phone: st.vdPhone,
          city: vdEffectiveCity,
          bio: st.vdBio,
          description: st.vdDescription,
          logoUrl: st.vdLogoUrl,
          coverUrl: st.vdCoverUrl,
          instagram: st.vdInstagram,
          facebook: st.vdFacebook,
          tiktok: st.vdTiktok,
          mapLink: st.vdMapLink,
          addressLine1: st.vdAddressLine1,
          addressLine2: st.vdAddressLine2,
          startingPrice: st.vdStartingPrice ? Number(st.vdStartingPrice) : null,
        });
        patch((s) => ({
          vdSaving: false,
          vdSaved: true,
          vdVendor: {
            ...s.vdVendor,
            subcategory: s.vdSubcategory,
            contactPerson: s.vdContactPerson,
            phone: s.vdPhone,
            city: vdEffectiveCity,
            bio: s.vdBio,
            description: s.vdDescription,
            logoUrl: s.vdLogoUrl,
            coverUrl: s.vdCoverUrl,
            instagram: s.vdInstagram,
            facebook: s.vdFacebook,
            tiktok: s.vdTiktok,
            mapLink: s.vdMapLink,
            addressLine1: s.vdAddressLine1,
            addressLine2: s.vdAddressLine2,
            startingPrice: s.vdStartingPrice ? Number(s.vdStartingPrice) : null,
          },
        }));
        setTimeout(() => patch((s) => (s.vdSaved ? { vdSaved: false } : {})), 2500);
      } catch (err) {
        patch({ vdSaving: false, vdSaveError: err.message || 'Could not save changes. Please try again.' });
      }
    },

    vdPkgName: st.vdPkgName || '',
    setVdPkgName: (e) => patch({ vdPkgName: e.target.value }),
    vdPkgDescription: st.vdPkgDescription || '',
    setVdPkgDescription: (e) => patch({ vdPkgDescription: e.target.value }),
    vdPkgPriceMin: st.vdPkgPriceMin || '',
    setVdPkgPriceMin: (e) => patch({ vdPkgPriceMin: e.target.value }),
    vdPkgPriceMax: st.vdPkgPriceMax || '',
    setVdPkgPriceMax: (e) => patch({ vdPkgPriceMax: e.target.value }),
    suggestedVdPackageChips: SUGGESTED_PACKAGES.map((name) => ({ name, pick: () => patch({ vdPkgName: name }) })),
    vdPkgPhotoUrl: st.vdPkgPhotoUrl || '',
    vdUploadingPkgPhoto: !!st.vdUploadingPkgPhoto,
    uploadVdPkgPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ vdUploadingPkgPhoto: true, vdSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ vdUploadingPkgPhoto: false, vdPkgPhotoUrl: url });
      } catch (err) {
        patch({ vdUploadingPkgPhoto: false, vdSaveError: err.message || 'Could not upload photo.' });
      }
    },
    vdAddingPkg: !!st.vdAddingPkg,
    vdAddPkgDisabled: !((st.vdPkgName || '').trim() && st.vdPkgPriceMin && st.vdPkgPriceMax) || !!st.vdAddingPkg,
    addVdPackage: async () => {
      const name = (st.vdPkgName || '').trim();
      if (!name || !st.vdPkgPriceMin || !st.vdPkgPriceMax || st.vdAddingPkg || !st.vdVendor) return;
      patch({ vdAddingPkg: true, vdSaveError: null });
      try {
        const row = await addVendorPackage(st.vdVendor.id, {
          name,
          description: (st.vdPkgDescription || '').trim(),
          priceMin: Number(st.vdPkgPriceMin),
          priceMax: Number(st.vdPkgPriceMax),
          photoUrl: st.vdPkgPhotoUrl || null,
          sortOrder: st.vdVendor.packages.length,
        });
        patch((s) => ({
          vdAddingPkg: false,
          vdPkgName: '',
          vdPkgDescription: '',
          vdPkgPriceMin: '',
          vdPkgPriceMax: '',
          vdPkgPhotoUrl: '',
          vdVendor: {
            ...s.vdVendor,
            packages: s.vdVendor.packages.concat([
              { id: row.id, name: row.name, description: row.description || '', priceMin: Number(row.price_min), priceMax: Number(row.price_max), unit: row.unit, photoUrl: row.photo_url || '', inclusions: row.inclusions || [] },
            ]),
          },
        }));
      } catch (err) {
        patch({ vdAddingPkg: false, vdSaveError: err.message || 'Could not add package.' });
      }
    },
    removeVdPackage: (id) => async () => {
      try {
        await removeVendorPackage(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, packages: s.vdVendor.packages.filter((p) => p.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove package.' });
      }
    },

    vdAlbumEventType: st.vdAlbumEventType || '',
    setVdAlbumEventType: (e) => patch({ vdAlbumEventType: e.target.value }),
    suggestedVdAlbumChips: SUGGESTED_ALBUMS.map((name) => ({ name, pick: () => patch({ vdAlbumEventType: name }) })),
    vdUploadingGalleryPhoto: !!st.vdUploadingGalleryPhoto,
    uploadVdGalleryPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !st.vdVendor) return;
      const eventType = (st.vdAlbumEventType || '').trim() || 'General';
      patch({ vdUploadingGalleryPhoto: true, vdSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        const row = await addVendorGalleryPhoto(st.vdVendor.id, { eventType, photoUrl: url, sortOrder: st.vdVendor.gallery.length });
        patch((s) => ({
          vdUploadingGalleryPhoto: false,
          vdVendor: { ...s.vdVendor, gallery: s.vdVendor.gallery.concat([{ id: row.id, eventType: row.event_type, photoUrl: row.photo_url }]) },
        }));
      } catch (err) {
        patch({ vdUploadingGalleryPhoto: false, vdSaveError: err.message || 'Could not upload photo.' });
      }
    },
    removeVdGalleryPhoto: (id) => async () => {
      try {
        await removeVendorGalleryPhoto(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, gallery: s.vdVendor.gallery.filter((g) => g.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove photo.' });
      }
    },

    vdMenuDraft: st.vdMenuDraft || '',
    setVdMenuDraft: (e) => patch({ vdMenuDraft: e.target.value }),
    vdAddingMenuItem: !!st.vdAddingMenuItem,
    addVdMenuItem: async () => {
      const name = (st.vdMenuDraft || '').trim();
      if (!name || st.vdAddingMenuItem || !st.vdVendor) return;
      patch({ vdAddingMenuItem: true, vdSaveError: null });
      try {
        const row = await addVendorMenuItem(st.vdVendor.id, name);
        patch((s) => ({ vdAddingMenuItem: false, vdMenuDraft: '', vdVendor: { ...s.vdVendor, menu: s.vdVendor.menu.concat([{ id: row.id, name: row.name }]) } }));
      } catch (err) {
        patch({ vdAddingMenuItem: false, vdSaveError: err.message || 'Could not add item.' });
      }
    },
    removeVdMenuItem: (id) => async () => {
      try {
        await removeVendorMenuItem(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, menu: s.vdVendor.menu.filter((m) => m.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove item.' });
      }
    },

    vdFaqQ: st.vdFaqQ || '',
    setVdFaqQ: (e) => patch({ vdFaqQ: e.target.value }),
    vdFaqA: st.vdFaqA || '',
    setVdFaqA: (e) => patch({ vdFaqA: e.target.value }),
    suggestedVdFaqChips: SUGGESTED_FAQS.filter((q) => !((st.vdVendor && st.vdVendor.faqs) || []).some((f) => f.q === q)).map((q) => ({
      q,
      pick: () => patch({ vdFaqQ: q }),
    })),
    vdAddingFaq: !!st.vdAddingFaq,
    addVdFaq: async () => {
      const q = (st.vdFaqQ || '').trim();
      const a = (st.vdFaqA || '').trim();
      if (!q || !a || st.vdAddingFaq || !st.vdVendor) return;
      patch({ vdAddingFaq: true, vdSaveError: null });
      try {
        const row = await addVendorFaq(st.vdVendor.id, { q, a });
        patch((s) => ({ vdAddingFaq: false, vdFaqQ: '', vdFaqA: '', vdVendor: { ...s.vdVendor, faqs: s.vdVendor.faqs.concat([{ id: row.id, q: row.question, a: row.answer }]) } }));
      } catch (err) {
        patch({ vdAddingFaq: false, vdSaveError: err.message || 'Could not add FAQ.' });
      }
    },
    removeVdFaq: (id) => async () => {
      try {
        await removeVendorFaq(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, faqs: s.vdVendor.faqs.filter((f) => f.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove FAQ.' });
      }
    },

    vdPolicyTitle: st.vdPolicyTitle || '',
    setVdPolicyTitle: (e) => patch({ vdPolicyTitle: e.target.value }),
    vdPolicyBody: st.vdPolicyBody || '',
    setVdPolicyBody: (e) => patch({ vdPolicyBody: e.target.value }),
    suggestedVdPolicyChips: SUGGESTED_POLICIES.filter(
      (title) => !((st.vdVendor && st.vdVendor.policies) || []).some((p) => p.title === title)
    ).map((title) => ({ title, pick: () => patch({ vdPolicyTitle: title }) })),
    vdAddingPolicy: !!st.vdAddingPolicy,
    addVdPolicy: async () => {
      const title = (st.vdPolicyTitle || '').trim();
      const body = (st.vdPolicyBody || '').trim();
      if (!title || !body || st.vdAddingPolicy || !st.vdVendor) return;
      patch({ vdAddingPolicy: true, vdSaveError: null });
      try {
        const row = await addVendorPolicy(st.vdVendor.id, { title, body, sortOrder: st.vdVendor.policies.length });
        patch((s) => ({ vdAddingPolicy: false, vdPolicyTitle: '', vdPolicyBody: '', vdVendor: { ...s.vdVendor, policies: s.vdVendor.policies.concat([{ id: row.id, title: row.title, body: row.body }]) } }));
      } catch (err) {
        patch({ vdAddingPolicy: false, vdSaveError: err.message || 'Could not add policy.' });
      }
    },
    removeVdPolicy: (id) => async () => {
      try {
        await removeVendorPolicy(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, policies: s.vdVendor.policies.filter((p) => p.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove policy.' });
      }
    },

    vdPromoTitle: st.vdPromoTitle || '',
    setVdPromoTitle: (e) => patch({ vdPromoTitle: e.target.value }),
    vdPromoDiscount: st.vdPromoDiscount || '',
    setVdPromoDiscount: (e) => patch({ vdPromoDiscount: e.target.value }),
    vdPromoDescription: st.vdPromoDescription || '',
    setVdPromoDescription: (e) => patch({ vdPromoDescription: e.target.value }),
    vdPromoExpiresAt: st.vdPromoExpiresAt || '',
    setVdPromoExpiresAt: (e) => patch({ vdPromoExpiresAt: e.target.value }),
    vdAddingPromo: !!st.vdAddingPromo,
    addVdPromo: async () => {
      const title = (st.vdPromoTitle || '').trim();
      if (!title || st.vdAddingPromo || !st.vdVendor) return;
      patch({ vdAddingPromo: true, vdSaveError: null });
      try {
        const row = await addVendorPromo(st.vdVendor.id, {
          title,
          discount: (st.vdPromoDiscount || '').trim(),
          description: (st.vdPromoDescription || '').trim(),
          expiresAt: st.vdPromoExpiresAt || null,
        });
        patch((s) => ({
          vdAddingPromo: false,
          vdPromoTitle: '',
          vdPromoDiscount: '',
          vdPromoDescription: '',
          vdPromoExpiresAt: '',
          vdVendor: {
            ...s.vdVendor,
            promos: s.vdVendor.promos.concat([
              { id: row.id, title: row.title, discount: row.discount || '', description: row.description || '', expiresAt: row.expires_at || '' },
            ]),
          },
        }));
      } catch (err) {
        patch({ vdAddingPromo: false, vdSaveError: err.message || 'Could not add promo.' });
      }
    },
    removeVdPromo: (id) => async () => {
      try {
        await removeVendorPromo(id);
        patch((s) => ({ vdVendor: { ...s.vdVendor, promos: s.vdVendor.promos.filter((p) => p.id !== id) } }));
      } catch (err) {
        patch({ vdSaveError: err.message || 'Could not remove promo.' });
      }
    },

    vdQuotesLoading: !!st.vdQuotesLoading,
    vdQuotesError: st.vdQuotesError || '',
    vdQuoteRows: (st.vdQuotes || []).map((q) => ({
      key: q.id,
      eventType: q.eventType,
      eventDate: q.eventDate,
      venue: q.venue,
      contactName: q.contactName,
      contactEmail: q.contactEmail,
      contactPhone: q.contactPhone,
      statusLabel: q.status === 'new' ? 'New' : q.status,
      answerRows: Object.entries(q.categoryAnswers || {})
        .filter(([, v]) => v)
        .map(([k, v]) => ({ key: k, label: k, value: v })),
    })),
    hasVdQuotes: (st.vdQuotes || []).length > 0,

    isAdmin: st.screen === 'admin',
    adminIsAuthed: st.signedIn && st.email === ADMIN_EMAIL,
    adminSubScreen: st.adminSubScreen || 'dashboard',
    adminVendors: (st.adminVendors || [])
      .slice()
      .sort((a, b) => {
        const aReady = !a.published && a.submitted_at ? 1 : 0;
        const bReady = !b.published && b.submitted_at ? 1 : 0;
        return bReady - aReady;
      }),
    adminVendorsLoading: !!st.adminVendorsLoading,
    adminVendorsError: st.adminVendorsError || '',
    loadAdminVendors: async () => {
      patch({ adminVendorsLoading: true, adminVendorsError: null });
      try {
        const rows = await adminListVendors();
        patch({ adminVendorsLoading: false, adminVendors: rows });
      } catch (err) {
        patch({ adminVendorsLoading: false, adminVendorsError: err.message || 'Could not load vendors.' });
      }
    },
    togglePublish: async (vendorId, next) => {
      patch({ adminVendorsError: null });
      try {
        await adminSetPublished(vendorId, next);
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) => (v.id === vendorId ? { ...v, published: next } : v)),
        }));
      } catch (err) {
        patch({ adminVendorsError: err.message || 'Could not update that vendor.' });
      }
    },
    setAdminLoginEmailDraft: (vendorId) => (e) =>
      patch((s) => ({
        adminVendors: (s.adminVendors || []).map((v) =>
          v.id === vendorId ? { ...v, loginEmailDraft: e.target.value } : v
        ),
      })),
    createAdminVendorLogin: async (vendorId) => {
      const vendor = (st.adminVendors || []).find((v) => v.id === vendorId);
      if (!vendor) return;
      const email = (vendor.loginEmailDraft ?? vendor.email ?? '').trim();
      if (!email || vendor.loginBusy) return;
      patch((s) => ({
        adminVendors: (s.adminVendors || []).map((v) =>
          v.id === vendorId ? { ...v, loginBusy: true, loginError: null } : v
        ),
      }));
      try {
        await adminCreateVendorLogin(vendorId, email);
        await sendVendorAccountSetupEmail(email);
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) =>
            v.id === vendorId ? { ...v, loginBusy: false, loginDone: true, email, owner_user_id: v.owner_user_id || 'pending' } : v
          ),
        }));
      } catch (err) {
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) =>
            v.id === vendorId ? { ...v, loginBusy: false, loginError: err.message || 'Could not create login.' } : v
          ),
        }));
      }
    },
    resendAdminVendorSetupEmail: async (vendorId) => {
      const vendor = (st.adminVendors || []).find((v) => v.id === vendorId);
      if (!vendor || !vendor.email || vendor.loginBusy) return;
      patch((s) => ({
        adminVendors: (s.adminVendors || []).map((v) =>
          v.id === vendorId ? { ...v, loginBusy: true, loginError: null } : v
        ),
      }));
      try {
        await sendVendorAccountSetupEmail(vendor.email);
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) => (v.id === vendorId ? { ...v, loginBusy: false, loginDone: true } : v)),
        }));
      } catch (err) {
        patch((s) => ({
          adminVendors: (s.adminVendors || []).map((v) =>
            v.id === vendorId ? { ...v, loginBusy: false, loginError: err.message || 'Could not send email.' } : v
          ),
        }));
      }
    },
    goAdminDashboard: () => patch({ adminSubScreen: 'dashboard' }),
    goAdminNewVendor: () =>
      patch({
        adminSubScreen: 'wizard',
        adminStep: 1,
        adminSaveError: null,
        adminName: '',
        adminCategoryCode: null,
        adminRegion: null,
        adminCity: '',
        adminWhatsapp: '',
        adminEmail: '',
        adminBio: '',
        adminDescription: '',
        adminCoverUrl: '',
        adminLogoUrl: '',
        adminUploadingCover: false,
        adminUploadingLogo: false,
        adminGallery: [],
        adminGalleryEventType: '',
        adminGalleryPhotoUrl: '',
        adminUploadingGalleryPhoto: false,
        adminPackages: [],
        adminPkgName: '',
        adminPkgPhotoUrl: '',
        adminUploadingPkgPhoto: false,
        adminPkgDescription: '',
        adminPkgInclusionsText: '',
        adminPkgPriceMin: '',
        adminPkgPriceMax: '',
        adminFaqs: DEFAULT_FAQ_TEMPLATES.map((f) => ({ ...f })),
        adminPaymentTerms: '',
        adminDepositTerms: '',
        adminReschedulePolicy: '',
        adminCancellationPolicy: '',
      }),

    goAdminBulkImport: () =>
      patch({
        adminSubScreen: 'bulk-import',
        bulkCsvFileName: '',
        bulkCsvRows: [],
        bulkImporting: false,
        bulkImportError: null,
        bulkImportResult: null,
      }),
    bulkCsvFileName: st.bulkCsvFileName || '',
    bulkCsvRows: st.bulkCsvRows || [],
    bulkCsvValidRows: (st.bulkCsvRows || []).filter((r) => r.errors.length === 0),
    bulkCsvInvalidCount: (st.bulkCsvRows || []).filter((r) => r.errors.length > 0).length,
    onBulkCsvFileChange: (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ bulkImportError: null, bulkImportResult: null });
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseCsvText(String(reader.result || ''));
          const rows = validateBulkCsvRows(parsed, CATS, LOCATIONS);
          patch({ bulkCsvFileName: file.name, bulkCsvRows: rows });
        } catch {
          patch({ bulkImportError: 'Could not read that file — make sure it is a plain CSV export.' });
        }
      };
      reader.onerror = () => patch({ bulkImportError: 'Could not read that file.' });
      reader.readAsText(file);
      e.target.value = '';
    },
    bulkImporting: !!st.bulkImporting,
    bulkImportError: st.bulkImportError || '',
    bulkImportResult: st.bulkImportResult,
    runBulkImport: async () => {
      const validRows = (st.bulkCsvRows || []).filter((r) => r.errors.length === 0);
      if (!validRows.length || st.bulkImporting) return;
      patch({ bulkImporting: true, bulkImportError: null });
      try {
        const created = await adminBulkCreateVendors(validRows);
        patch({ bulkImporting: false, bulkImportResult: { created }, bulkCsvRows: [], bulkCsvFileName: '' });
      } catch (err) {
        patch({ bulkImporting: false, bulkImportError: err.message || 'Could not import these vendors.' });
      }
    },

    adminStep: st.adminStep || 1,
    adminTotalSteps: 7,
    adminStepBack: () => patch((s) => ({ adminStep: Math.max(1, (s.adminStep || 1) - 1) })),

    adminName: st.adminName || '',
    setAdminName: (e) => patch({ adminName: e.target.value }),
    adminCategoryTiles: CATS.map((c) => ({
      code: c[0],
      name: c[1],
      on: st.adminCategoryCode === c[0],
      pick: () => patch({ adminCategoryCode: c[0] }),
    })),
    adminRegionTiles: LOCATIONS.filter((l) => l !== 'All areas').map((l) => ({
      label: l,
      on: st.adminRegion === l,
      pick: () => patch({ adminRegion: l }),
    })),
    adminCity: st.adminCity || '',
    setAdminCity: (e) => patch({ adminCity: e.target.value }),
    adminWhatsapp: st.adminWhatsapp || '',
    setAdminWhatsapp: (e) => patch({ adminWhatsapp: e.target.value }),
    adminEmail: st.adminEmail || '',
    setAdminEmail: (e) => patch({ adminEmail: e.target.value }),
    adminBio: st.adminBio || '',
    setAdminBio: (e) => patch({ adminBio: e.target.value }),
    adminStep1NextDisabled: !(
      (st.adminName || '').trim() &&
      st.adminCategoryCode &&
      st.adminRegion &&
      (st.adminCity || '').trim()
    ),
    adminStep1Next: () => patch({ adminStep: 2 }),

    adminDescription: st.adminDescription || '',
    setAdminDescription: (e) => patch({ adminDescription: e.target.value }),
    adminCoverUrl: st.adminCoverUrl || '',
    adminUploadingCover: !!st.adminUploadingCover,
    uploadAdminCover: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ adminUploadingCover: true, adminSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ adminUploadingCover: false, adminCoverUrl: url });
      } catch (err) {
        patch({ adminUploadingCover: false, adminSaveError: err.message || 'Could not upload photo.' });
      }
    },
    adminLogoUrl: st.adminLogoUrl || '',
    adminUploadingLogo: !!st.adminUploadingLogo,
    uploadAdminLogo: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ adminUploadingLogo: true, adminSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ adminUploadingLogo: false, adminLogoUrl: url });
      } catch (err) {
        patch({ adminUploadingLogo: false, adminSaveError: err.message || 'Could not upload photo.' });
      }
    },
    adminStep2Next: () => patch({ adminStep: 3 }),

    adminGallery: st.adminGallery || [],
    adminGalleryEventType: st.adminGalleryEventType || '',
    setAdminGalleryEventType: (e) => patch({ adminGalleryEventType: e.target.value }),
    adminGalleryPhotoUrl: st.adminGalleryPhotoUrl || '',
    adminUploadingGalleryPhoto: !!st.adminUploadingGalleryPhoto,
    uploadAdminGalleryPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ adminUploadingGalleryPhoto: true, adminSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ adminUploadingGalleryPhoto: false, adminGalleryPhotoUrl: url });
      } catch (err) {
        patch({ adminUploadingGalleryPhoto: false, adminSaveError: err.message || 'Could not upload photo.' });
      }
    },
    adminAddGalleryPhotoDisabled: !((st.adminGalleryEventType || '').trim() && (st.adminGalleryPhotoUrl || '').trim()),
    adminAddGalleryPhoto: () => {
      const eventType = (st.adminGalleryEventType || '').trim();
      const photoUrl = (st.adminGalleryPhotoUrl || '').trim();
      if (!eventType || !photoUrl) return;
      patch((s) => ({
        adminGallery: (s.adminGallery || []).concat([{ eventType, photoUrl }]),
        adminGalleryPhotoUrl: '',
      }));
    },
    adminRemoveGalleryPhoto: (i) =>
      patch((s) => ({ adminGallery: (s.adminGallery || []).filter((_, idx) => idx !== i) })),
    adminStep3Next: () => patch({ adminStep: 4 }),

    adminPackages: st.adminPackages || [],
    adminPkgName: st.adminPkgName || '',
    setAdminPkgName: (e) => patch({ adminPkgName: e.target.value }),
    adminPkgPhotoUrl: st.adminPkgPhotoUrl || '',
    adminUploadingPkgPhoto: !!st.adminUploadingPkgPhoto,
    uploadAdminPkgPhoto: async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      patch({ adminUploadingPkgPhoto: true, adminSaveError: null });
      try {
        const url = await uploadVendorMedia(file);
        patch({ adminUploadingPkgPhoto: false, adminPkgPhotoUrl: url });
      } catch (err) {
        patch({ adminUploadingPkgPhoto: false, adminSaveError: err.message || 'Could not upload photo.' });
      }
    },
    adminPkgDescription: st.adminPkgDescription || '',
    setAdminPkgDescription: (e) => patch({ adminPkgDescription: e.target.value }),
    adminPkgInclusionsText: st.adminPkgInclusionsText || '',
    setAdminPkgInclusionsText: (e) => patch({ adminPkgInclusionsText: e.target.value }),
    adminPkgPriceMin: st.adminPkgPriceMin || '',
    setAdminPkgPriceMin: (e) => patch({ adminPkgPriceMin: e.target.value }),
    adminPkgPriceMax: st.adminPkgPriceMax || '',
    setAdminPkgPriceMax: (e) => patch({ adminPkgPriceMax: e.target.value }),
    adminAddPackageDisabled: !(
      (st.adminPkgName || '').trim() &&
      Number(st.adminPkgPriceMin) > 0 &&
      Number(st.adminPkgPriceMax) >= Number(st.adminPkgPriceMin)
    ),
    adminAddPackage: () => {
      const name = (st.adminPkgName || '').trim();
      const priceMin = Number(st.adminPkgPriceMin);
      const priceMax = Number(st.adminPkgPriceMax);
      if (!name || !(priceMin > 0) || !(priceMax >= priceMin)) return;
      patch((s) => ({
        adminPackages: (s.adminPackages || []).concat([
          {
            name,
            photoUrl: (s.adminPkgPhotoUrl || '').trim(),
            description: (s.adminPkgDescription || '').trim(),
            inclusions: (s.adminPkgInclusionsText || '')
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean),
            priceMin,
            priceMax,
            unit: 'event',
          },
        ]),
        adminPkgName: '',
        adminPkgPhotoUrl: '',
        adminPkgDescription: '',
        adminPkgInclusionsText: '',
        adminPkgPriceMin: '',
        adminPkgPriceMax: '',
      }));
    },
    adminRemovePackage: (i) => patch((s) => ({ adminPackages: (s.adminPackages || []).filter((_, idx) => idx !== i) })),
    adminStep4Next: () => patch({ adminStep: 5 }),

    adminFaqs: st.adminFaqs || [],
    setAdminFaqQ: (i, e) =>
      patch((s) => ({
        adminFaqs: (s.adminFaqs || []).map((f, idx) => (idx === i ? { ...f, q: e.target.value } : f)),
      })),
    setAdminFaqA: (i, e) =>
      patch((s) => ({
        adminFaqs: (s.adminFaqs || []).map((f, idx) => (idx === i ? { ...f, a: e.target.value } : f)),
      })),
    adminAddFaqRow: () => patch((s) => ({ adminFaqs: (s.adminFaqs || []).concat([{ q: '', a: '' }]) })),
    adminRemoveFaqRow: (i) => patch((s) => ({ adminFaqs: (s.adminFaqs || []).filter((_, idx) => idx !== i) })),
    adminStep5Next: () => patch({ adminStep: 6 }),

    adminPaymentTerms: st.adminPaymentTerms || '',
    setAdminPaymentTerms: (e) => patch({ adminPaymentTerms: e.target.value }),
    adminDepositTerms: st.adminDepositTerms || '',
    setAdminDepositTerms: (e) => patch({ adminDepositTerms: e.target.value }),
    adminReschedulePolicy: st.adminReschedulePolicy || '',
    setAdminReschedulePolicy: (e) => patch({ adminReschedulePolicy: e.target.value }),
    adminCancellationPolicy: st.adminCancellationPolicy || '',
    setAdminCancellationPolicy: (e) => patch({ adminCancellationPolicy: e.target.value }),
    adminStep6Next: () => patch({ adminStep: 7 }),

    adminSaving: !!st.adminSaving,
    adminSaveError: st.adminSaveError || '',
    adminSaveVendor: async (published) => {
      if (st.adminSaving) return;
      patch({ adminSaving: true, adminSaveError: null });
      try {
        await adminCreateVendor({
          categoryCode: st.adminCategoryCode,
          name: (st.adminName || '').trim(),
          city: (st.adminCity || '').trim(),
          region: st.adminRegion,
          bio: (st.adminBio || '').trim(),
          description: (st.adminDescription || '').trim(),
          phone: (st.adminWhatsapp || '').trim(),
          email: (st.adminEmail || '').trim(),
          coverUrl: (st.adminCoverUrl || '').trim(),
          logoUrl: (st.adminLogoUrl || '').trim(),
          gallery: st.adminGallery || [],
          packages: st.adminPackages || [],
          faqs: (st.adminFaqs || []).filter((f) => f.q.trim() && f.a.trim()),
          paymentTerms: (st.adminPaymentTerms || '').trim(),
          depositTerms: (st.adminDepositTerms || '').trim(),
          reschedulePolicy: (st.adminReschedulePolicy || '').trim(),
          cancellationPolicy: (st.adminCancellationPolicy || '').trim(),
          published,
        });
        patch({ adminSaving: false, adminSubScreen: 'dashboard' });
        loadCatalog();
      } catch (err) {
        patch({ adminSaving: false, adminSaveError: err.message || 'Could not save this vendor.' });
      }
    },

    isVendorOnboarding: st.screen === 'vendor-onboarding',
    goVendorOnboarding: () =>
      patch({
        screen: 'vendor-onboarding',
        // Already signed in (e.g. confirmed their email and landed back
        // logged in, but never got a listing created) — skip straight to
        // business info instead of asking them to sign up again, which
        // would just fail since the account already exists.
        voStep: st.signedIn ? 2 : 0,
        voDone: false,
        voVendorId: null,
        voSectors: [],
        voSectorOtherText: '',
        voSubcategory: '',
        voBusinessName: '',
        voContactPerson: '',
        voCountry: null,
        voCity: null,
        voCityOther: '',
        voStartingPrice: '',
        voEmail: st.signedIn ? st.email || '' : '',
        voPhone: '',
        voPassword: '',
        voConfirmPassword: '',
        voAgree: false,
        voStep1Error: null,
        navMenuOpen: false,
      }),
    voStep: st.voStep ?? 1,
    voDone: !!st.voDone,

    voSectorTiles: [...CATS.map((c) => ({ key: c[0], name: c[1] })), { key: 'OTHER', name: 'Other' }].map((c) => ({
      code: c.key,
      name: c.name,
      on: (st.voSectors || []).includes(c.key),
      maxed: (st.voSectors || []).length >= 3 && !(st.voSectors || []).includes(c.key),
      pick: () =>
        patch((s) => {
          const cur = s.voSectors || [];
          if (cur.includes(c.key)) return { voSectors: cur.filter((x) => x !== c.key) };
          if (cur.length >= 3) return {};
          return { voSectors: [...cur, c.key] };
        }),
    })),
    voSectorOtherSelected: (st.voSectors || []).includes('OTHER'),
    voSectorOtherText: st.voSectorOtherText || '',
    setVoSectorOtherText: (e) => patch({ voSectorOtherText: e.target.value }),
    voSubcategory: st.voSubcategory || '',
    setVoSubcategory: (e) => patch({ voSubcategory: e.target.value }),
    voBusinessName: st.voBusinessName || '',
    setVoBusinessName: (e) => patch({ voBusinessName: e.target.value }),
    voContactPerson: st.voContactPerson || '',
    setVoContactPerson: (e) => patch({ voContactPerson: e.target.value }),
    voCountryTiles: ['Trinidad', 'Tobago'].map((c) => ({
      label: c,
      on: st.voCountry === c,
      pick: () => patch({ voCountry: c }),
    })),
    voCityOptions: MUNICIPALITIES,
    voCity: st.voCity || '',
    setVoCity: (e) => patch({ voCity: e.target.value }),
    voCityOtherSelected: st.voCity === 'Other',
    voCityOther: st.voCityOther || '',
    setVoCityOther: (e) => patch({ voCityOther: e.target.value }),
    voStartingPrice: st.voStartingPrice || '',
    setVoStartingPrice: (e) => patch({ voStartingPrice: e.target.value }),
    voEmail: st.voEmail || '',
    setVoEmail: (e) => patch({ voEmail: e.target.value }),
    voPhone: st.voPhone || '',
    setVoPhone: (e) => patch({ voPhone: e.target.value }),
    voPassword: st.voPassword || '',
    setVoPassword: (e) => patch({ voPassword: e.target.value }),
    voConfirmPassword: st.voConfirmPassword || '',
    setVoConfirmPassword: (e) => patch({ voConfirmPassword: e.target.value }),
    voShowPassword: !!st.voShowPassword,
    toggleVoShowPassword: () => patch((s) => ({ voShowPassword: !s.voShowPassword })),
    voShowConfirmPassword: !!st.voShowConfirmPassword,
    toggleVoShowConfirmPassword: () => patch((s) => ({ voShowConfirmPassword: !s.voShowConfirmPassword })),
    voAgree: !!st.voAgree,
    toggleVoAgree: () => patch((s) => ({ voAgree: !s.voAgree })),
    voStep1Submitting: !!st.voStep1Submitting,
    voStep1Error: st.voStep1Error || '',
    voAccountStepDisabled: !(
      (st.voEmail || '').trim() &&
      st.voEmail.indexOf('@') > 0 &&
      (st.voPhone || '').trim() &&
      (st.voPassword || '').length >= 6 &&
      st.voPassword === st.voConfirmPassword &&
      st.voAgree
    ),
    goVoBusinessStep: () => {
      const disabled = !(
        (st.voEmail || '').trim() &&
        st.voEmail.indexOf('@') > 0 &&
        (st.voPhone || '').trim() &&
        (st.voPassword || '').length >= 6 &&
        st.voPassword === st.voConfirmPassword &&
        st.voAgree
      );
      if (disabled) return;
      patch({ voStep: 2 });
    },
    voStep1Disabled: !(
      (st.voSectors || []).some((c) => c !== 'OTHER') &&
      (!(st.voSectors || []).includes('OTHER') || (st.voSectorOtherText || '').trim()) &&
      (st.voBusinessName || '').trim() &&
      (st.voContactPerson || '').trim() &&
      st.voCountry &&
      (st.voCity === 'Other' ? (st.voCityOther || '').trim() : st.voCity) &&
      (st.voEmail || '').trim() &&
      (st.voPhone || '').trim() &&
      (st.signedIn ||
        ((st.voPassword || '').length >= 6 && st.voPassword === st.voConfirmPassword && st.voAgree))
    ),
    voStep1Next: async () => {
      const name = (st.voBusinessName || '').trim();
      const contactPerson = (st.voContactPerson || '').trim();
      const email = (st.voEmail || '').trim();
      const phone = (st.voPhone || '').trim();
      const realSectors = (st.voSectors || []).filter((c) => c !== 'OTHER');
      const otherIncluded = (st.voSectors || []).includes('OTHER');
      const otherCategory = otherIncluded ? (st.voSectorOtherText || '').trim() : '';
      const city = st.voCity === 'Other' ? (st.voCityOther || '').trim() : st.voCity;
      if (
        !realSectors.length ||
        (otherIncluded && !otherCategory) ||
        !name ||
        !contactPerson ||
        !st.voCountry ||
        !city ||
        !email ||
        !phone ||
        (!st.signedIn &&
          ((st.voPassword || '').length < 6 || st.voPassword !== st.voConfirmPassword || !st.voAgree)) ||
        st.voStep1Submitting
      ) {
        return;
      }
      patch({ voStep1Submitting: true, voStep1Error: null });
      try {
        // Already signed in (e.g. this is a confirmed account that never
        // got a listing created) — skip signUp, which would just fail
        // since the account already exists, and create the listing
        // directly under the current session.
        const vendorId = await (st.signedIn ? createVendorListing : createVendorAccount)({
          categoryCode: realSectors[0],
          categoryCodes: realSectors,
          otherCategory: otherCategory || null,
          subcategory: (st.voSubcategory || '').trim(),
          name,
          contactPerson,
          country: st.voCountry,
          city,
          email,
          phone,
          password: st.voPassword,
          startingPrice: st.voStartingPrice ? Number(st.voStartingPrice) : null,
        });
        patch({
          voStep1Submitting: false,
          voVendorId: vendorId,
          voDone: true,
          accountRole: 'vendor',
        });
      } catch (err) {
        patch({ voStep1Submitting: false, voStep1Error: err.message || 'Could not create your account. Please try again.' });
      }
    },
  };

  return (
    <>
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '0 16px 64px' : '0 28px 96px' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: '#FFFFFF',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 10,
            gap: 24,
            padding: '18px 0 16px',
            borderBottom: '1px solid #ECECEC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', columnGap: isMobile ? 14 : 32, flexWrap: 'wrap', rowGap: 8 }}>
            <button
              onClick={V.goHome}
              style={{
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              Eventory
            </button>
            {isMobile ? (
              <button
                onClick={V.toggleNavMenu}
                aria-label="Menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  marginLeft: -8,
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#171717',
                  lineHeight: 1,
                }}
              >
                {V.navMenuOpen ? '✕' : '☰'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 22, flexWrap: 'wrap', rowGap: 6 }}>
                <button
                  onClick={V.goSuppliers}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  Discover Vendors
                </button>
                <button
                  onClick={V.goHowItWorks}
                  style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#5B5B5B' }}
                >
                  How It Works
                </button>
              </div>
            )}
          </div>
          {isMobile && V.navMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                minWidth: 220,
                border: '1px solid #ECECEC',
                borderRadius: 16,
                background: '#FFFFFF',
                boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 22,
              }}
            >
              <button
                onClick={V.goSuppliers}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                Discover Vendors
              </button>
              <button
                onClick={V.goHowItWorks}
                style={{ border: 0, borderRadius: 10, background: 'transparent', padding: '12px 14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#171717', textAlign: 'left' }}
              >
                How It Works
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={V.goAccount}
            aria-label={V.accountLabel}
            title={V.accountLabel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid #171717',
              borderRadius: 999,
              background: V.isSignedIn ? '#171717' : '#FFFFFF',
              color: V.isSignedIn ? '#FFFFFF' : '#171717',
              padding: '9px 18px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {V.isSignedIn ? 'Dashboard' : 'Sign in'}
          </button>
          </div>
        </div>
        {isMobile && V.navMenuOpen && (
          <div
            onClick={V.closeNavMenu}
            style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'transparent' }}
          />
        )}
      </div>

      {V.isHome && (
        <div>
          <div
            style={{
              position: 'relative',
              isolation: 'isolate',
              marginTop: 18,
              borderRadius: 28,
              overflow: 'hidden',
              background: '#141414',
            }}
          >
            <img
              src={weddingVenue2Photo}
              alt="An empty reception hall strung with fairy lights and chandeliers, tables set for guests"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />
            <div style={{ position: 'relative', mixBlendMode: 'lighten', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#FFFFFF', padding: isMobile ? '18px 16px 20px' : '26px 28px 30px' }}>
                <div
                  style={{
                    fontFamily: DISPLAY_BLACK,
                    fontSize: isMobile ? 'clamp(40px, 15vw, 90px)' : 'clamp(64px, 15.5vw, 300px)',
                    lineHeight: 0.82,
                    letterSpacing: '-0.045em',
                    textTransform: 'uppercase',
                    color: '#000000',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Eventory
                </div>
              </div>
              <div style={{ height: isMobile ? 190 : 300 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 26 }}>
            <button
              onClick={V.startPlanning}
              style={{
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                border: 0,
                borderRadius: 999,
                background: ACCENT,
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Start Planning
            </button>
            <button
              onClick={V.goVendorOnboarding}
              style={{
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                border: 0,
                borderRadius: 999,
                background: '#171717',
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Join as a Vendor
            </button>
          </div>

          <div style={{ marginTop: 30, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#171717' }}>What are you looking for?</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '6px 8px 6px 18px' }}>
              <span style={{ fontSize: 15, color: '#9A9A9A', flexShrink: 0 }}>🔍</span>
              <input
                type="search"
                value={V.homeQuery}
                onChange={V.setHomeQuery}
                onKeyDown={V.homeSearchKeyDown}
                placeholder="Caterers, photographers, venues..."
                style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', padding: '9px 0', fontFamily: SANS, fontSize: 14, color: '#171717' }}
              />
              <button
                onClick={V.runHomeSearch}
                style={{
                  flexShrink: 0,
                  border: 0,
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Search
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: isMobile ? 48 : 84,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 24px 60px -30px rgba(23,23,23,0.35)',
            }}
          >
            <img
              src={wineGlassesEventPhoto}
              alt="Wine glasses and fruit on a table at an evening reception, guests mingling under string lights"
              style={{ flex: isMobile ? 'none' : '1 1 46%', width: isMobile ? '100%' : 'auto', height: isMobile ? 240 : 440, objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                flex: isMobile ? 'none' : '1 1 54%',
                background: '#171717',
                color: '#FFFFFF',
                padding: isMobile ? '32px 26px' : '52px 52px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: isMobile ? 26 : 34,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700 }}>
                What we do
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 22 : 28 }}>
                {['Discover trusted vendors', 'Plan your special moment', 'Connect with the right people'].map((title, i) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 14 : 20 }}>
                    <div style={{ flexShrink: 0, fontFamily: MONO, fontSize: isMobile ? 20 : 28, fontWeight: 600, color: ACCENT }}>
                      {'0' + (i + 1)}
                    </div>
                    <div style={{ fontSize: isMobile ? 19 : 25, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.15 }}>{title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: isMobile ? '48px 0 0' : '84px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Browse by category</h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B', textAlign: isMobile ? 'left' : 'right' }}>
                Pick the category that fits your event to see who's available.
              </p>
            </div>
            {V.catalogLoading && <div style={{ marginTop: 16, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {V.topCategoryTiles.map((c) => (
                <button
                  key={c.code}
                  onClick={c.open}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    textAlign: 'center',
                    border: '1px solid #ECECEC',
                    borderRadius: 18,
                    padding: '20px 10px',
                    cursor: 'pointer',
                    minHeight: 110,
                    background: '#F7F7F5',
                  }}
                >
                  <CategoryIcon code={c.code} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, color: '#171717' }}>{c.name}</div>
                    <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 10, color: '#9A9A9A' }}>{c.supplierLabel}</div>
                  </div>
                </button>
              ))}
            </div>
            {V.catHasMore && (
              <button
                onClick={V.toggleCatExpanded}
                style={{
                  marginTop: 16,
                  border: `1px solid ${CTA_ACCENT}55`,
                  borderRadius: 999,
                  background: 'transparent',
                  padding: '11px 20px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: CTA_ACCENT,
                }}
              >
                {V.catExpanded ? 'Show less ↑' : 'See all categories ↓'}
              </button>
            )}
          </div>

          <div id="featured-vendors" style={{ padding: isMobile ? '48px 0 0' : '84px 0 0', scrollMarginTop: 100 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Featured Vendors</h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                From birthday parties to corporate functions, here's who's ready to help.
              </p>
            </div>
            {V.catalogLoading && <div style={{ marginTop: 16, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {V.topSuppliers.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={s.open}
                    style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#F7F7F5' }}>
                      <img src={s.cover} alt={s.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {s.rating && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            border: 0,
                            borderRadius: 999,
                            background: 'rgba(23,23,23,0.72)',
                            color: '#FFFFFF',
                            padding: '4px 10px',
                            fontFamily: MONO,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          ★ {s.rating}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: isMobile ? '14px 14px 0' : '16px 18px 0' }}>
                      <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.name}</div>
                      {s.startPriceLabel && (
                        <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{s.startPriceLabel}</div>
                      )}
                    </div>
                  </button>
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      borderTop: '1px solid #F2F2F0',
                      padding: isMobile ? '10px 14px 14px' : '10px 18px 16px',
                    }}
                  >
                    <button
                      onClick={s.open}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {s.location}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={s.toggleSaved}
                        aria-label={s.isSaved ? 'Unsave vendor' : 'Save vendor'}
                        title={s.isSaved ? 'Unsave vendor' : 'Save vendor'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: s.isSaved ? '#171717' : '#FFFFFF',
                          color: s.isSaved ? '#FFFFFF' : '#171717',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={s.isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={s.share}
                        aria-label="Share vendor"
                        title={s.justCopied ? 'Link copied' : 'Share vendor'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#FFFFFF',
                          color: '#171717',
                          cursor: 'pointer',
                        }}
                      >
                        {s.justCopied ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                            <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={V.runHomeSearch}
              style={{
                marginTop: 16,
                border: `1px solid ${CTA_ACCENT}55`,
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: CTA_ACCENT,
              }}
            >
              Explore all →
            </button>
          </div>

          {V.claimBusinessTiles.length > 0 && (
            <div style={{ padding: isMobile ? '48px 0 0' : '84px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 800 }}>Claim Your Business</h2>
                <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                  We found these businesses through search and public information on the internet. If one's yours, set up a free listing in minutes.
                </p>
              </div>
              <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {V.claimBusinessTiles.map((b) => (
                  <div key={b.key} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ECECEC', borderRadius: 20, background: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#F7F7F5' }}>
                      <img src={b.photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          display: 'inline-block',
                          border: 0,
                          borderRadius: 999,
                          background: 'rgba(23,23,23,0.72)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {b.categoryName}
                      </span>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{b.name}</div>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {b.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {b.city}
                          </div>
                        )}
                        {b.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {b.phone}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                        {b.waUrl && (
                          <a
                            href={b.waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Inquire via WhatsApp"
                            title="Inquire via WhatsApp"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              flexShrink: 0,
                              order: isMobile ? 1 : 0,
                              width: isMobile ? '100%' : 38,
                              border: 0,
                              borderRadius: 999,
                              background: '#25D366',
                              color: '#FFFFFF',
                              padding: isMobile ? '10px 16px' : 0,
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7-1.87-1.87-4.36-2.94-7.01-2.94zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.7 8.24-8.24 8.24z" />
                            </svg>
                            {isMobile && 'WhatsApp'}
                          </a>
                        )}
                        <button
                          onClick={b.claim}
                          style={{
                            flex: 1,
                            order: isMobile ? 0 : 1,
                            border: 0,
                            borderRadius: 999,
                            background: '#171717',
                            color: '#FFFFFF',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Claim now →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {V.isHowItWorks && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 22, maxWidth: 640 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>How Eventory Works</h1>
          </div>

          <div style={{ marginTop: isMobile ? 24 : 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                borderRadius: 24,
                background: ACCENT,
                color: ACCENT_ON,
                padding: isMobile ? '20px 22px' : '28px 32px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Discover</div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                  Choose your event and browse vendors and what they offer.
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 34, color: ACCENT_ON_MUTED }}>01</div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                borderRadius: 24,
                background: '#171717',
                padding: isMobile ? '20px 22px' : '28px 32px',
                color: '#FFFFFF',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Reach out</div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#A8A8A8' }}>
                  Message a vendor on WhatsApp straight from their profile, or sign in and send them a
                  detailed quote request.
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 34, color: '#4A4A4A' }}>02</div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                borderRadius: 24,
                background: '#F2F2F0',
                padding: isMobile ? '20px 22px' : '28px 32px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Connect</div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
                  The vendor replies directly with availability, pricing and details for your event.
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 34, color: '#C2C2BC' }}>03</div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 28,
                borderRadius: 24,
                border: '1px solid #ECECEC',
                padding: isMobile ? '20px 22px' : '28px 32px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: 720 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Can't find what you need?</div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
                  Tell us what you're looking for and we'll help you find it.
                </div>
                <button
                  onClick={V.goSourcing}
                  style={{
                    marginTop: 16,
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '13px 22px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Source
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, color: '#5B5B5B' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
              Note
            </span>
            Eventory does not process payments. You deal directly with each vendor.
          </div>
        </div>
      )}

      {V.isSuppliers && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Home
          </button>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
                {V.dirActiveCat ? V.dirActiveCat[1] : 'Discover Vendors'}
              </h1>
              <p style={{ margin: '12px 0 0', maxWidth: 560, fontSize: 15, lineHeight: 1.5, color: '#5B5B5B' }}>
                {V.dirActiveCat ? V.dirActiveCat[2] : 'Browse every vendor on Eventory, or narrow down by category, location and price.'}
              </p>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{V.dirResultLabel}</div>
          </div>

          {V.dirPlanLabel && (
            <div style={{ marginTop: 14, display: 'flex' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #171717',
                  borderRadius: 999,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '7px 8px 7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Showing vendors for {V.dirPlanLabel}
                <button
                  onClick={V.clearDirPlan}
                  aria-label="Clear planned event filter"
                  style={{
                    border: 0,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    width: 20,
                    height: 20,
                    lineHeight: '20px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          )}

          <div
            style={{
              marginTop: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 16 : 14,
              borderTop: '1px solid #ECECEC',
              borderBottom: '1px solid #ECECEC',
              padding: '16px 0',
            }}
          >
            <input
              type="search"
              value={V.dirQuery}
              onChange={V.setDirQuery}
              placeholder="Search vendors or products..."
              style={{
                border: '1px solid #E4E4DF',
                borderRadius: 999,
                background: '#F7F7F5',
                padding: '11px 16px',
                fontFamily: SANS,
                fontSize: 14,
                color: '#171717',
              }}
            />
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={V.toggleDirCatMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: `2px solid ${st.dirCat !== 'ALL' ? '#171717' : ACCENT}`,
                    borderRadius: 999,
                    background: st.dirCat !== 'ALL' ? '#171717' : 'rgba(224,81,43,0.08)',
                    color: st.dirCat !== 'ALL' ? '#FFFFFF' : ACCENT,
                    padding: isMobile ? '13px 18px' : '14px 22px',
                    cursor: 'pointer',
                    fontSize: isMobile ? 14.5 : 15.5,
                    fontWeight: 700,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'space-between' : 'flex-start',
                    boxShadow: st.dirCat !== 'ALL' ? 'none' : '0 2px 10px rgba(224,81,43,0.2)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  {V.dirCategoryLabel}
                  <span style={{ fontSize: 13, marginLeft: isMobile ? 0 : 2 }}>{V.dirCatMenuOpen ? '▲' : '▼'}</span>
                </button>
                {V.dirCatMenuOpen && (
                  <>
                    <div
                      onClick={V.closeDirCatMenu}
                      style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'transparent' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        width: isMobile ? '100%' : 320,
                        maxHeight: 360,
                        overflowY: 'auto',
                        border: '1px solid #ECECEC',
                        borderRadius: 16,
                        background: '#FFFFFF',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 22,
                      }}
                    >
                      {V.dirCategoryFilters.map((f) => (
                        <button
                          key={f.code}
                          onClick={f.pick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            border: 0,
                            borderRadius: 10,
                            background: f.on ? '#F7F7F5' : 'transparent',
                            padding: '11px 14px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: f.on ? 700 : 500,
                            color: '#171717',
                            textAlign: 'left',
                          }}
                        >
                          <span>{f.label}</span>
                          <span style={{ fontFamily: MONO, fontSize: 11, color: f.on ? '#171717' : '#9A9A9A' }}>{f.countLabel}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: isMobile ? 16 : 20, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Location
                </span>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={V.toggleDirLocMenu}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isMobile ? 'space-between' : 'flex-start',
                      gap: 8,
                      border: '1px solid #E4E4DF',
                      borderRadius: 999,
                      background: '#F7F7F5',
                      color: '#171717',
                      padding: isMobile ? '9px 14px' : '9px 16px',
                      cursor: 'pointer',
                      fontSize: isMobile ? 13 : 13.5,
                      fontWeight: 600,
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    {V.dirLocationLabel}
                    <span style={{ fontSize: 11 }}>{V.dirLocMenuOpen ? '▲' : '▼'}</span>
                  </button>
                  {V.dirLocMenuOpen && (
                    <>
                      <div onClick={V.closeDirLocMenu} style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'transparent' }} />
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          width: isMobile ? '100%' : 240,
                          maxHeight: 320,
                          overflowY: 'auto',
                          border: '1px solid #ECECEC',
                          borderRadius: 16,
                          background: '#FFFFFF',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                          padding: 6,
                          display: 'flex',
                          flexDirection: 'column',
                          zIndex: 22,
                        }}
                      >
                        {V.dirLocationFilters.map((f) => (
                          <button
                            key={f.label}
                            onClick={f.pick}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              border: 0,
                              borderRadius: 10,
                              background: f.on ? '#F7F7F5' : 'transparent',
                              padding: '10px 14px',
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: f.on ? 700 : 500,
                              textAlign: 'left',
                              color: '#171717',
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Price
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: isMobile ? 2 : 0,
                    minWidth: 0,
                  }}
                >
                  {V.dirPriceFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={f.pick}
                      style={{
                        border: `1px solid ${f.border}`,
                        borderRadius: 999,
                        background: f.bg,
                        color: f.fg,
                        padding: isMobile ? '6px 12px' : '7px 14px',
                        cursor: 'pointer',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 600,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {V.dirSupplierRows.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #ECECEC',
                  borderRadius: 20,
                  background: '#FFFFFF',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={s.open}
                  style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#F7F7F5' }}>
                    <img src={s.cover} alt={s.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {s.rating && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          border: 0,
                          borderRadius: 999,
                          background: 'rgba(23,23,23,0.72)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        ★ {s.rating}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '14px 14px 0' : '16px 18px 0' }}>
                    <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.name}</div>
                    {s.startPriceLabel && (
                      <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>{s.startPriceLabel}</div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#F7F7F5',
                          padding: '4px 10px',
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#4A4A4A',
                        }}
                      >
                        {s.categoryName}
                      </span>
                    </div>
                    {s.description && (
                      <p
                        style={{
                          margin: '10px 0 0',
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: '#4A4A4A',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {s.description}
                      </p>
                    )}
                  </div>
                </button>
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    borderTop: '1px solid #F2F2F0',
                    padding: isMobile ? '10px 14px 14px' : '10px 18px 16px',
                  }}
                >
                  <button
                    onClick={s.open}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {s.location}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={s.toggleSaved}
                      aria-label={s.isSaved ? 'Unsave vendor' : 'Save vendor'}
                      title={s.isSaved ? 'Unsave vendor' : 'Save vendor'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: s.isSaved ? '#171717' : '#FFFFFF',
                        color: s.isSaved ? '#FFFFFF' : '#171717',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={s.isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={s.share}
                      aria-label="Share vendor"
                      title={s.justCopied ? 'Link copied' : 'Share vendor'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#FFFFFF',
                        color: '#171717',
                        cursor: 'pointer',
                      }}
                    >
                      {s.justCopied ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                          <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {V.catalogLoading && V.dirSupplierRows.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>Loading…</div>
            )}
            {!V.catalogLoading && V.dirSupplierRows.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>No vendors match your search.</div>
            )}
          </div>

          {V.dirShowSeeAll && (
            <button
              onClick={V.seeAllDir}
              style={{
                marginTop: 16,
                border: '1px solid #D7D7D2',
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: '#171717',
              }}
            >
              {V.dirSeeAllLabel}
            </button>
          )}

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              borderRadius: 22,
              background: '#F2F2F0',
              padding: '22px 26px',
            }}
          >
            <div style={{ fontSize: 15, color: '#4A4A4A' }}>Nothing here fits? Tell us what you need and we will go find it.</div>
            <button
              onClick={V.goSourcing}
              style={{
                border: '1px solid #171717',
                borderRadius: 999,
                background: 'transparent',
                padding: '11px 20px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Submit a sourcing request
            </button>
          </div>

          {V.dirClaimBusinessTiles.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 32, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Claim Your Business</h2>
                <p style={{ margin: 0, maxWidth: 420, fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  We found these businesses through search and public information on the internet. If one's yours, set up a free listing in minutes.
                </p>
              </div>
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {V.dirClaimBusinessTiles.map((b) => (
                  <div key={b.key} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ECECEC', borderRadius: 20, background: '#FFFFFF', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#F7F7F5' }}>
                      <img src={b.photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          display: 'inline-block',
                          border: 0,
                          borderRadius: 999,
                          background: 'rgba(23,23,23,0.72)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {b.categoryName}
                      </span>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{b.name}</div>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {b.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {b.city}
                          </div>
                        )}
                        {b.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {b.phone}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                        {b.waUrl && (
                          <a
                            href={b.waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Inquire via WhatsApp"
                            title="Inquire via WhatsApp"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              flexShrink: 0,
                              order: isMobile ? 1 : 0,
                              width: isMobile ? '100%' : 38,
                              border: 0,
                              borderRadius: 999,
                              background: '#25D366',
                              color: '#FFFFFF',
                              padding: isMobile ? '10px 16px' : 0,
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7-1.87-1.87-4.36-2.94-7.01-2.94zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.7 8.24-8.24 8.24z" />
                            </svg>
                            {isMobile && 'WhatsApp'}
                          </a>
                        )}
                        <button
                          onClick={b.claim}
                          style={{
                            flex: 1,
                            order: isMobile ? 0 : 1,
                            border: 0,
                            borderRadius: 999,
                            background: '#171717',
                            color: '#FFFFFF',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Claim now →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {V.isSupplier && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.backToCategory}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← {V.sup.categoryName}
          </button>
          <div style={{ marginTop: 22, position: 'relative', borderRadius: 24, overflow: 'hidden', height: isMobile ? 200 : 320 }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                transform: `translateX(-${V.sup.carouselIndex * 100}%)`,
                transition: 'transform 0.7s ease',
              }}
            >
              {V.sup.carouselPhotos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={V.sup.name + ' photo ' + (i + 1)}
                  loading={i === 0 ? undefined : 'lazy'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', flex: '0 0 100%' }}
                />
              ))}
            </div>
            {V.sup.carouselPhotos.length > 1 && (
              <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {V.sup.carouselPhotos.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: i === V.sup.carouselIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ position: 'relative', border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 20 : 28 }}>
                <img
                  src={V.sup.logo}
                  alt={V.sup.name + ' logo'}
                  style={{ position: 'absolute', top: -32, left: isMobile ? 20 : 28, width: 64, height: 64, borderRadius: 999, border: '4px solid #FFFFFF', background: '#171717', display: 'block' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={V.sup.toggleSaved}
                      aria-label={V.sup.isSaved ? 'Unsave vendor' : 'Save vendor'}
                      title={V.sup.isSaved ? 'Unsave vendor' : 'Save vendor'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: V.sup.isSaved ? '#171717' : '#FFFFFF',
                        color: V.sup.isSaved ? '#FFFFFF' : '#171717',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={V.sup.isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={V.sup.share}
                      aria-label="Share vendor"
                      title={V.sup.justCopied ? 'Link copied' : 'Share vendor'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#FFFFFF',
                        color: '#171717',
                        cursor: 'pointer',
                      }}
                    >
                      {V.sup.justCopied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                          <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
                        </svg>
                      )}
                    </button>
                    {V.sup.social.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 38,
                          height: 38,
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#FFFFFF',
                          color: '#171717',
                          textDecoration: 'none',
                        }}
                      >
                        {s.key === 'instagram' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        )}
                        {s.key === 'facebook' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </svg>
                        )}
                        {s.key === 'tiktok' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                          </svg>
                        )}
                      </a>
                    ))}
                  </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Meet {V.sup.name}</h1>
                  {V.sup.verified && (
                    <span
                      title="Verified vendor"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: '1px solid #171717',
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '4px 11px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span
                    style={{
                      border: '1px solid #E4E4DF',
                      borderRadius: 999,
                      background: '#F7F7F5',
                      padding: '6px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#171717',
                    }}
                  >
                    {V.sup.categoryName}
                  </span>
                  {V.sup.ratingLabel && (
                    <span
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '6px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      ★ {V.sup.ratingLabel}
                    </span>
                  )}
                  {V.sup.startPriceLabel && (
                    <span
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '6px 14px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {V.sup.startPriceLabel}
                    </span>
                  )}
                </div>
                <p style={{ margin: '14px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.55, color: '#4A4A4A' }}>{V.sup.description}</p>
                <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {V.sup.whatsappUrl && (
                    <button
                      onClick={V.openWaModal}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: 0,
                        borderRadius: 999,
                        background: '#25D366',
                        color: '#FFFFFF',
                        padding: '10px 18px',
                        cursor: 'pointer',
                        fontFamily: DISPLAY,
                        fontSize: 13.5,
                        fontWeight: 600,
                      }}
                    >
                      Message on WhatsApp →
                    </button>
                  )}
                  <button
                    onClick={V.startQuote}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid #171717',
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '13px 24px',
                      cursor: 'pointer',
                      fontFamily: DISPLAY,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    Get a quote →
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid #ECECEC', paddingBottom: 16 }}>
                {V.supplierTabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={t.go}
                    style={
                      t.highlight
                        ? {
                            border: `1px solid ${ACCENT}`,
                            borderRadius: 999,
                            background: t.active ? ACCENT : `${ACCENT}17`,
                            color: t.active ? '#FFFFFF' : ACCENT,
                            padding: '9px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 800,
                          }
                        : {
                            border: `1px solid ${t.active ? '#171717' : '#D7D7D2'}`,
                            borderRadius: 999,
                            background: t.active ? '#171717' : 'transparent',
                            color: t.active ? '#FFFFFF' : '#171717',
                            padding: '9px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                          }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {V.supplierTab === 'about' && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {V.sup.facts.map((f) => (
                      <div key={f.label} style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                          {f.label}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #ECECEC' }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      About {V.sup.name}
                    </div>
                    <p style={{ margin: '8px 0 0', maxWidth: 620, fontSize: 15, lineHeight: 1.6, color: '#4A4A4A' }}>{V.sup.about}</p>
                  </div>
                </div>
              )}

              {V.supplierTab === 'services' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Packages</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <input
                      type="search"
                      value={V.svcQuery}
                      onChange={V.setSvcQuery}
                      placeholder="Search services"
                      style={{
                        flex: '1 1 220px',
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: '#F7F7F5',
                        padding: '11px 16px',
                        fontFamily: SANS,
                        fontSize: 14,
                        color: '#171717',
                      }}
                    />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A', flexShrink: 0 }}>{V.svcResultLabel}</span>
                  </div>
                  {V.svcHasGroups && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.svcGroupFilters.map((f) => (
                        <button
                          key={f.label}
                          onClick={f.pick}
                          style={{
                            border: `1px solid ${f.border}`,
                            borderRadius: 999,
                            background: f.bg,
                            color: f.fg,
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {V.supplierProducts.map((p) => (
                      <div
                        key={p.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid #ECECEC',
                          borderRadius: 20,
                          overflow: 'hidden',
                          background: '#FFFFFF',
                        }}
                      >
                        <img
                          src={p.photo}
                          alt={p.name}
                          loading="lazy"
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.name}</div>
                          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>{p.description}</div>
                          {p.inclusions.length > 0 && (
                            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {p.inclusions.map((inc) => (
                                <li key={inc} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, lineHeight: 1.5, color: '#4A4A4A' }}>
                                  <span style={{ flexShrink: 0, color: '#16A34A', fontWeight: 800 }}>✓</span>
                                  {inc}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{p.termsLabel}</div>
                          <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 17, fontWeight: 700 }}>{p.priceLabel}</div>
                          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={p.toggleSave}
                              aria-label={p.saveLabel}
                              style={{
                                border: '1px solid #D7D7D2',
                                borderRadius: 999,
                                background: p.saved ? '#171717' : 'transparent',
                                color: p.saved ? '#FFFFFF' : '#171717',
                                padding: '9px 14px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {p.saveLabel}
                            </button>
                            <button
                              onClick={p.share}
                              style={{
                                border: '1px solid #D7D7D2',
                                borderRadius: 999,
                                background: 'transparent',
                                color: '#171717',
                                padding: '9px 14px',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {p.shareLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!V.supDetailLoading && V.supplierProducts.length === 0 && (
                    <div style={{ padding: '28px 2px', fontSize: 14, color: '#9A9A9A' }}>No packages match your search.</div>
                  )}
                  {V.svcShowMore && (
                    <button
                      onClick={V.loadMoreSvc}
                      style={{
                        marginTop: 16,
                        border: '1px solid #D7D7D2',
                        borderRadius: 999,
                        background: 'transparent',
                        padding: '11px 20px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {V.svcRemainingLabel}
                    </button>
                  )}
                </div>
              )}

              {V.supplierTab === 'gallery' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Gallery</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  {!V.supDetailLoading && V.sup.gallery.length === 0 && (
                    <div style={{ marginTop: 14, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, color: '#5B5B5B' }}>No photos added yet.</div>
                    </div>
                  )}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {V.sup.gallery.map((g) => (
                      <div key={g.key}>
                        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                          {g.eventType}
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {g.photos.map((photo, i) => (
                            <img
                              key={photo + i}
                              src={photo}
                              alt={g.eventType + ' photo'}
                              loading="lazy"
                              style={{ width: '100%', height: 160, borderRadius: 14, objectFit: 'cover', display: 'block' }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'menu' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Menu</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {V.sup.menuItems.map((name) => (
                      <span
                        key={name}
                        style={{
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          background: '#F7F7F5',
                          padding: '8px 16px',
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: '#171717',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'reviews' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Reviews</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.reviews.map((r) => (
                      <div key={r.key} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{r.author}</div>
                          <div style={{ color: '#DDA915', fontSize: 14, letterSpacing: '2px' }}>{r.stars}</div>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{r.text}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #ECECEC' }}>
                    {V.reviewSent ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>Thanks for your review</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                          We appreciate you taking the time to share your experience.
                        </p>
                      </>
                    ) : V.reviewFormOpen ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>Write a review</div>
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                              Your name
                            </span>
                            <input
                              type="text"
                              placeholder="Your name"
                              value={V.reviewAuthor}
                              onChange={V.setReviewAuthor}
                              style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                            />
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                              Rating
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => V.setReviewStars(n)}
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontSize: 26,
                                    lineHeight: 1,
                                    color: n <= V.reviewStars ? '#DDA915' : '#D8D8D2',
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                              Your review
                            </span>
                            <textarea
                              placeholder="Share what it was like working with them."
                              value={V.reviewBody}
                              onChange={V.setReviewBody}
                              style={{
                                minHeight: 100,
                                border: '1px solid #E4E4DF',
                                borderRadius: 14,
                                background: '#F7F7F5',
                                padding: 14,
                                fontFamily: SANS,
                                fontSize: 15,
                                lineHeight: 1.5,
                                color: '#171717',
                                resize: 'vertical',
                              }}
                            />
                          </label>
                          <label style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} aria-hidden="true">
                            Company
                            <input type="text" tabIndex={-1} autoComplete="off" value={V.reviewCompany} onChange={V.setReviewCompany} />
                          </label>
                          {V.reviewError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.reviewError}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                              onClick={V.cancelReviewForm}
                              style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '12px 4px', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={V.submitReview}
                              style={{
                                border: 0,
                                borderRadius: 999,
                                background: '#171717',
                                color: '#FFFFFF',
                                padding: '13px 24px',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 700,
                                opacity: V.reviewSending ? 0.6 : 1,
                              }}
                            >
                              {V.reviewSending ? 'Submitting…' : 'Submit review'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={V.openReviewForm}
                        style={{
                          border: '1px solid #171717',
                          borderRadius: 999,
                          background: 'transparent',
                          color: '#171717',
                          padding: '13px 24px',
                          cursor: 'pointer',
                          fontFamily: SANS,
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        Write a review
                      </button>
                    )}
                  </div>
                </div>
              )}

              {V.supplierTab === 'faq' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>FAQ</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.faqs.map((f) => {
                      const open = V.openFaqKey === f.key;
                      return (
                        <div key={f.key} style={{ borderTop: '1px solid #ECECEC' }}>
                          <button
                            onClick={() => V.toggleFaq(f.key)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16,
                              border: 0,
                              background: 'transparent',
                              padding: '18px 2px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#171717',
                            }}
                          >
                            {f.q}
                            <span style={{ flexShrink: 0, fontSize: 18, color: '#9A9A9A' }}>{open ? '−' : '+'}</span>
                          </button>
                          {open && (
                            <p style={{ margin: '0 2px 18px', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{f.a}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {V.supplierTab === 'policies' && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Policies</h2>
                  {V.supDetailLoading && <div style={{ marginTop: 14, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {V.sup.policies.map((p) => (
                      <div key={p.key} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {V.supplierTab === 'inquire' && (
                <div style={{ marginTop: 24, maxWidth: 520 }}>
                  <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>Check availability</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                    Send an inquiry directly to {V.sup.name}.
                  </p>

                  {V.inqSent ? (
                    <div
                      style={{
                        marginTop: 20,
                        border: '1px solid #16A34A',
                        borderRadius: 18,
                        background: '#F0FDF4',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        ✓
                      </span>
                      <div style={{ fontSize: 14, color: '#166534' }}>Your inquiry is on its way — {V.sup.name} will follow up soon.</div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {V.inqServiceTiles.length > 0 && (
                        <div>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                            Which service are you interested in?
                          </span>
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {V.inqServiceTiles.map((t) => (
                              <button
                                key={t.key}
                                onClick={t.pick}
                                style={{
                                  border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                                  borderRadius: 999,
                                  background: t.on ? '#171717' : '#FFFFFF',
                                  color: t.on ? '#FFFFFF' : '#171717',
                                  padding: '9px 14px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Your name</span>
                          <input
                            type="text"
                            value={V.inqName}
                            onChange={V.setInqName}
                            placeholder="e.g. Sarah Mitchell"
                            style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                          />
                        </label>
                        <label style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Email address</span>
                          <input
                            type="email"
                            value={V.inqEmail}
                            onChange={V.setInqEmail}
                            placeholder="sarah@example.com"
                            style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                          />
                        </label>
                      </div>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Phone (optional)</span>
                        <input
                          type="tel"
                          value={V.inqPhone}
                          onChange={V.setInqPhone}
                          placeholder="e.g. 868 123 4567"
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                        />
                      </label>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Event date (optional)</span>
                          <input
                            type="date"
                            value={V.inqEventDate}
                            onChange={V.setInqEventDate}
                            style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                          />
                        </label>
                        <label style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Guests (optional)</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={V.inqGuests}
                            onChange={V.setInqGuests}
                            placeholder="e.g. 150"
                            style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                          />
                        </label>
                      </div>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Event type (optional)</span>
                        <select
                          value={V.inqEventType}
                          onChange={V.setInqEventType}
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                        >
                          <option value="">Select type…</option>
                          {EVENT_TYPES.map((t) => (
                            <option key={t.key} value={t.key}>{t.label}</option>
                          ))}
                        </select>
                        {V.inqEventType === 'other' && (
                          <input
                            type="text"
                            value={V.inqEventTypeOther}
                            onChange={V.setInqEventTypeOther}
                            placeholder="Tell us what you're planning"
                            style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                          />
                        )}
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Message (optional)</span>
                        <textarea
                          value={V.inqMessage}
                          onChange={V.setInqMessage}
                          placeholder="Tell them about your vision…"
                          rows={4}
                          style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717', resize: 'vertical' }}
                        />
                      </label>

                      {V.inqServiceMissing && <div style={{ fontSize: 12, color: '#9A9A9A' }}>Pick a service above to continue.</div>}
                      {V.inqSubmitError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.inqSubmitError}</div>}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {V.inqWaUrl && (V.inqWaDisabled ? (
                          <div
                            style={{
                              flex: '1 1 200px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              border: 0,
                              borderRadius: 999,
                              background: '#25D366',
                              color: '#FFFFFF',
                              padding: '14px 20px',
                              fontFamily: DISPLAY,
                              fontSize: 14.5,
                              fontWeight: 700,
                              opacity: 0.5,
                            }}
                          >
                            Send via WhatsApp →
                          </div>
                        ) : (
                          <a
                            href={V.inqWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: '1 1 200px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              border: 0,
                              borderRadius: 999,
                              background: '#25D366',
                              color: '#FFFFFF',
                              padding: '14px 20px',
                              cursor: 'pointer',
                              fontFamily: DISPLAY,
                              fontSize: 14.5,
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            Send via WhatsApp →
                          </a>
                        ))}
                        <button
                          onClick={V.submitInlineInquiry}
                          disabled={V.inqSubmitDisabled}
                          style={{
                            flex: '1 1 200px',
                            border: 0,
                            borderRadius: 999,
                            background: '#171717',
                            color: '#FFFFFF',
                            padding: '14px 20px',
                            cursor: V.inqSubmitDisabled ? 'not-allowed' : 'pointer',
                            opacity: V.inqSubmitDisabled ? 0.5 : 1,
                            fontSize: 14.5,
                            fontWeight: 700,
                          }}
                        >
                          {V.inqSubmitting ? 'Sending…' : V.signedIn ? 'Send inquiry' : 'Sign in to send inquiry'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {V.isJoin && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 22, maxWidth: 640 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 52, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Join Eventory</h1>
            <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.5, color: '#4A4A4A' }}>
              Right now, somewhere a planner is searching your category. Get seen, and let them come to you.
            </p>
            <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.6, color: '#5B5B5B' }}>
              Set up your own profile in a couple of steps. Planners searching your category find you and message
              you directly. Free to list, free to receive messages.
            </p>
          </div>

          <div style={{ marginTop: isMobile ? 24 : 30, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={V.goVendorOnboarding}
              style={{
                border: 0,
                borderRadius: 999,
                background: ACCENT,
                color: '#FFFFFF',
                padding: '15px 32px',
                cursor: 'pointer',
                fontFamily: DISPLAY,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Get Listed →
            </button>
            <div style={{ fontSize: 13, color: '#5B5B5B' }}>We review every submission by hand.</div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>How it works</h2>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: ACCENT,
                  color: ACCENT_ON,
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Create your account</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: ACCENT_ON_SOFT }}>
                    Two minutes. No design skills, no writing needed.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: ACCENT_ON_MUTED }}>01</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#171717',
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  color: '#FFFFFF',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Build your profile</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#A8A8A8' }}>
                    Add your packages, photos and details yourself, at your own pace.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: '#4A4A4A' }}>02</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 28,
                  borderRadius: 24,
                  background: '#F2F2F0',
                  padding: isMobile ? '20px 22px' : '26px 30px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 480 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Planners find you and message you directly</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>
                    They message you, you close the booking.
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: '#C2C2BC' }}>03</div>
              </div>
            </div>
          </div>


          <div style={{ marginTop: isMobile ? 40 : 56, border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 22 : 34 }}>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, letterSpacing: '-0.02em' }}>What you get, free</div>
            <ul style={{ margin: '14px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Set up your own profile in a couple of steps.</li>
              <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Listed in the directory, found by planners searching your category</li>
              <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Planners message you directly when they're interested</li>
              <li style={{ fontSize: 14, lineHeight: 1.5, color: '#4A4A4A' }}>Free to list, free always</li>
            </ul>
            <button
              onClick={V.goVendorOnboarding}
              style={{
                marginTop: 20,
                border: 0,
                borderRadius: 999,
                background: '#171717',
                color: '#FFFFFF',
                padding: '14px 26px',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              Get Listed →
            </button>
          </div>
        </div>
      )}

      {V.isSpotlight && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 22, maxWidth: 620 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: PROMO_ACCENT, fontWeight: 700 }}>
              Eventory Spotlight Advertising
            </div>
            <h1 style={{ margin: '10px 0 0', fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
              Get found by planners actively booking.
            </h1>
            <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.5, color: '#5B5B5B' }}>
              Every vendor on Eventory is discoverable. Spotlight gets you there faster.
            </p>
          </div>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ECECEC',
                borderRadius: 24,
                padding: isMobile ? 22 : 30,
                background: '#F7F7F5',
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                {SPOTLIGHT_STARTER_PLAN.name} — {SPOTLIGHT_STARTER_PLAN.price}
              </div>
              <div style={{ marginTop: 10, fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {SPOTLIGHT_STARTER_PLAN.tagline}
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {SPOTLIGHT_STARTER_PLAN.bullets.map((b) => {
                  const [label, ...rest] = b.split(' — ');
                  return (
                    <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontSize: 13.5, lineHeight: 1.5, color: '#4A4A4A' }}>
                        <strong style={{ color: '#171717' }}>{label}</strong>
                        {rest.length > 0 ? ' — ' + rest.join(' — ') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={V.goVendorOnboarding}
                style={{
                  marginTop: 24,
                  alignSelf: 'flex-start',
                  border: '1px solid #171717',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#171717',
                  padding: '13px 24px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {SPOTLIGHT_STARTER_PLAN.cta} →
              </button>
            </div>

            {SPOTLIGHT_PLANS.map((plan) => (
              <div
                key={plan.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 24,
                  padding: isMobile ? 22 : 30,
                  background: '#171717',
                  color: '#FFFFFF',
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F0946F', fontWeight: 700 }}>
                  {plan.name} — {plan.price}{plan.period}
                </div>
                <div style={{ marginTop: 10, fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: '-0.01em' }}>{plan.tagline}</div>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {plan.bullets.map((b) => {
                    const [label, ...rest] = b.split(' — ');
                    return (
                      <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F0946F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
                          <strong style={{ color: '#FFFFFF' }}>{label}</strong>
                          {rest.length > 0 ? ' — ' + rest.join(' — ') : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {plan.priceNote && (
                  <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>
                    {plan.priceNote}
                  </div>
                )}
                <button
                  onClick={V.openPromoPlan(plan.key)}
                  style={{
                    marginTop: 16,
                    alignSelf: 'flex-start',
                    border: 0,
                    borderRadius: 999,
                    background: '#FFFFFF',
                    color: '#171717',
                    padding: '13px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {plan.cta} →
                </button>
              </div>
            ))}
          </div>

          <p style={{ margin: '22px 0 0', maxWidth: 560, fontSize: 15, fontWeight: 700, lineHeight: 1.5, color: '#171717' }}>
            {SPOTLIGHT_STARTER_PLAN.name} gets you found. {SPOTLIGHT_PLANS[0].name} gets you found first.
          </p>
        </div>
      )}

      {V.isAbout && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Home
          </button>

          <div style={{ marginTop: 22, maxWidth: 680 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 52, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>About Eventory</h1>
          </div>

          <div
            style={{
              marginTop: isMobile ? 32 : 44,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 24,
              background: ACCENT,
              color: ACCENT_ON,
              padding: isMobile ? 22 : 34,
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: isMobile ? -20 : -10,
                top: isMobile ? -30 : -40,
                fontFamily: MONO,
                fontSize: isMobile ? 100 : 160,
                fontWeight: 700,
                color: ACCENT_ON_MUTED,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              01
            </div>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_ON_SOFT, fontWeight: 700 }}>
                For planners
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 32, letterSpacing: '-0.02em', fontWeight: 800, color: ACCENT_ON }}>
                Planning an Event?
              </h2>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  You have an event to plan and vendors to find.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Eventory puts caterers, venues, DJs, photographers, decorators, and more in one place across
                  Trinidad &amp; Tobago.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Browse vendor profiles, then message them on WhatsApp for a quick question, or sign in and
                  send a detailed quote request built around your event.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: ACCENT_ON_SOFT }}>
                  Either way, the vendor messages you back directly.
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: ACCENT_ON }}>
                  You find the people you need. They take it from there.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: isMobile ? 24 : 32,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 24,
              background: '#171717',
              padding: isMobile ? 22 : 34,
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: isMobile ? -20 : -10,
                top: isMobile ? -30 : -40,
                fontFamily: MONO,
                fontSize: isMobile ? 100 : 160,
                fontWeight: 700,
                color: '#262626',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              02
            </div>
            <div style={{ position: 'relative', maxWidth: 600 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROMO_ACCENT, fontWeight: 700 }}>
                For vendors
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 32, letterSpacing: '-0.02em', fontWeight: 800, color: '#FFFFFF' }}>
                For Vendors
              </h2>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  People are already looking for what you offer.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  Eventory helps them find your business when they're planning an event. They can message you
                  on WhatsApp instantly, or sign in and send a detailed quote request from your profile.
                </p>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#D7D7D2' }}>
                  When they're ready, you receive their request directly, with the event details and what they're
                  interested in.
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: '#FFFFFF' }}>
                  You reach out, discuss the details, and take it from there.
                </p>
              </div>
              <button
                onClick={V.goVendorOnboarding}
                style={{
                  marginTop: 22,
                  border: 0,
                  borderRadius: 999,
                  background: ACCENT,
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  cursor: 'pointer',
                  fontFamily: DISPLAY,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Join Eventory →
              </button>
            </div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>Frequently asked questions</h2>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {ABOUT_FAQS.map((f) => (
                <div key={f.q} style={{ borderTop: '1px solid #ECECEC', padding: '18px 2px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.q}</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>{f.a}</p>
                  {f.linkTo === 'promo' && (
                    <button
                      onClick={V.goSpotlight}
                      style={{
                        marginTop: 10,
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 700,
                        color: PROMO_ACCENT,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      {f.linkLabel} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: isMobile ? 40 : 56, maxWidth: 560, border: '1px solid #ECECEC', borderRadius: 24, padding: isMobile ? 18 : 26 }}>
            {V.contactSent ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Thanks, message sent</div>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                  We'll get back to you within one business day.
                </p>
                <button
                  onClick={V.goHome}
                  style={{
                    marginTop: 20,
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '13px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Back to home
                </button>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 30, letterSpacing: '-0.02em', fontWeight: 800 }}>Contact us</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                  Questions, feedback, or something not covered above? Send us a message.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Name
                    </span>
                    <input
                      type="text"
                      value={V.contactName}
                      onChange={V.setContactName}
                      placeholder="Your name"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Email
                    </span>
                    <input
                      type="email"
                      value={V.contactEmail}
                      onChange={V.setContactEmail}
                      placeholder="you@example.com"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Message
                    </span>
                    <textarea
                      value={V.contactMessage}
                      onChange={V.setContactMessage}
                      placeholder="How can we help?"
                      style={{
                        minHeight: 120,
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: 14,
                        fontFamily: SANS,
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: '#171717',
                        resize: 'vertical',
                      }}
                    />
                  </label>
                  {/* Honeypot — hidden from real visitors via CSS, not just off-screen positioning, so screen readers skip it too. Bots that fill every field trip it; humans never see it. */}
                  <label style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} aria-hidden="true">
                    Company
                    <input type="text" tabIndex={-1} autoComplete="off" value={V.contactCompany} onChange={V.setContactCompany} />
                  </label>
                </div>
                {V.contactError && <div style={{ marginTop: 12, fontSize: 13, color: '#B3261E' }}>{V.contactError}</div>}
                <button
                  onClick={V.submitContact}
                  disabled={V.contactDisabled}
                  style={{
                    marginTop: 20,
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    opacity: V.contactDisabled ? 0.5 : 1,
                  }}
                >
                  {V.contactSubmitting ? 'Sending…' : 'Send message'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {(V.isTerms || V.isPrivacy) && (
        <div style={{ padding: '34px 0 0' }}>
          <button
            onClick={V.goBack}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          <div style={{ marginTop: 22, maxWidth: 680 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
              {V.isTerms ? 'Terms of Service' : 'Privacy Policy'}
            </h1>
            <p style={{ margin: '10px 0 0', fontFamily: MONO, fontSize: 12, color: '#8A8A8A' }}>Last updated {LEGAL_UPDATED}</p>

            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 26 }}>
              {(V.isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS).map((s) => (
                <div key={s.h}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{s.h}</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.65, color: '#4A4A4A' }}>{s.p}</p>
                </div>
              ))}
            </div>

            <p style={{ marginTop: 34, fontSize: 13, color: '#8A8A8A' }}>
              {V.isTerms ? (
                <>
                  See also our{' '}
                  <button onClick={V.goPrivacy} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    Privacy Policy
                  </button>
                  .
                </>
              ) : (
                <>
                  See also our{' '}
                  <button onClick={V.goTerms} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    Terms of Service
                  </button>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {V.isAccount && (
        <div style={{ padding: '34px 0 0', maxWidth: 680 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 30 : 46, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            {V.isSignedIn ? 'Your dashboard' : 'Your account'}
          </h1>

          {V.isSignedIn && (
            <div
              style={{
                marginTop: 22,
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              <button
                onClick={V.startPlanning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: 0,
                  borderRadius: 20,
                  background: '#171717',
                  color: '#FFFFFF',
                  padding: '20px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>Plan a new event</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#B3B3B3' }}>Tell us what you need, we'll match you to vendors</div>
                </div>
                <span style={{ fontSize: 20 }}>→</span>
              </button>
              <button
                onClick={V.goSuppliers}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: '1px solid #ECECEC',
                  borderRadius: 20,
                  background: '#FFFFFF',
                  color: '#171717',
                  padding: '20px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>Browse vendors</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#8A8A8A' }}>Explore every vendor on Eventory</div>
                </div>
                <span style={{ fontSize: 20 }}>→</span>
              </button>
            </div>
          )}

          {V.isSignedIn && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 800 }}>Inquiries made</h2>
              {V.dashboardQuotesLoading && (
                <div style={{ marginTop: 12, fontSize: 14, color: '#8A8A8A' }}>Loading…</div>
              )}
              {V.dashboardQuotesError && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#B3261E' }}>{V.dashboardQuotesError}</div>
              )}
              {!V.dashboardQuotesLoading && !V.hasDashboardInquiries && !V.dashboardQuotesError && (
                <div style={{ marginTop: 12, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, color: '#5B5B5B' }}>
                    No quote requests yet. Message a vendor on WhatsApp or use Get a quote on their profile.
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {V.dashboardInquiries.map((q) => (
                  <button
                    key={q.key}
                    onClick={q.open}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid #ECECEC',
                      borderRadius: 20,
                      background: 'transparent',
                      padding: '16px 18px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{q.vendorName}</div>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 10.5,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#5B5B5B',
                          border: '1px solid #E4E4DF',
                          borderRadius: 999,
                          padding: '3px 10px',
                        }}
                      >
                        {q.statusLabel}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#5B5B5B' }}>
                      {q.eventType}
                      {q.eventDate ? ' · ' + q.eventDate : ''}
                      {q.venue ? ' · ' + q.venue : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 800 }}>Saved</h2>
            {!V.hasSaved && !V.hasSavedVendors && (
              <div style={{ marginTop: 12, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#5B5B5B' }}>Nothing saved yet. Tap Save on a vendor or product to keep it here.</div>
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {V.savedVendorRows.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 220 }}>
                    <img src={s.logo} alt={s.name} loading="lazy" style={{ width: 44, height: 44, borderRadius: 999, objectFit: 'cover', flexShrink: 0, background: '#171717' }} />
                    <div>
                      <button
                        onClick={s.open}
                        style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#171717', textAlign: 'left' }}
                      >
                        {s.name}
                      </button>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>{s.categoryName}</div>
                    </div>
                  </div>
                  <button
                    onClick={s.unsave}
                    style={{
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#8A8A8A',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {V.savedProducts.map((p) => (
                <div
                  key={p.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    border: '1px solid #ECECEC',
                    borderRadius: 20,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 220 }}>
                    <img src={p.photo} alt={p.name} loading="lazy" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                      <button
                        onClick={p.openSupplier}
                        style={{
                          border: 0,
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: MONO,
                          fontSize: 12,
                          color: '#6E6E6E',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        {p.supplierName}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: MONO, fontSize: 13 }}>{p.priceLabel}</div>
                    <button
                      onClick={p.share}
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: 'transparent',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {p.shareLabel}
                    </button>
                    <button
                      onClick={p.remove}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#8A8A8A',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {V.isSignedIn && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 800 }}>Bookings</h2>
              <div style={{ marginTop: 12, border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#5B5B5B' }}>
                  No bookings yet. Once a vendor confirms your event, it'll show up here.
                </div>
              </div>
            </div>
          )}

          {V.accountNeedsSignIn && (
            <div style={{ marginTop: 26, border: '1px solid #ECECEC', borderRadius: 24, padding: 26 }}>
              {V.authSent ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Check your email</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    We sent a sign-in link to {V.accountEmail}. Click it to come back here signed in — you can close
                    this tab.
                  </p>
                  <button
                    onClick={V.useDifferentEmail}
                    style={{ marginTop: 12, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Use a different email
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    No password, we email you a link. New here? The same link creates your account so you can
                    save vendors, send quote requests, and find them again.
                  </p>
                  <label style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Your email
                    </span>
                    <input
                      type="email"
                      value={V.accountEmail}
                      onChange={V.setAccountEmail}
                      placeholder="you@organisation.tt"
                      style={{
                        border: '1px solid #E4E4DF',
                        borderRadius: 14,
                        background: '#F7F7F5',
                        padding: '12px 14px',
                        fontFamily: SANS,
                        fontSize: 15,
                        color: '#171717',
                      }}
                    />
                  </label>
                  <button
                    onClick={V.togglePromoOptIn}
                    style={{
                      marginTop: 16,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      border: 0,
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        marginTop: 1,
                        border: `1px solid ${V.promoOptIn ? '#171717' : '#C8C8C2'}`,
                        borderRadius: 5,
                        background: V.promoOptIn ? '#171717' : 'transparent',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {V.promoOptIn ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: '#5B5B5B' }}>
                      Send me promos and offers from vendors
                    </span>
                  </button>
                  <button
                    onClick={V.signIn}
                    disabled={V.signInDisabled}
                    style={{
                      marginTop: 18,
                      border: 0,
                      borderRadius: 999,
                      background: '#171717',
                      color: '#FFFFFF',
                      padding: '14px 24px',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: V.signInDisabled ? 0.4 : 1,
                    }}
                  >
                    {V.authSending ? 'Sending link…' : 'Continue with email'}
                  </button>
                  {V.authError && (
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.authError}</div>
                  )}
                </>
              )}
            </div>
          )}

          {V.isSignedIn && (
            <>
              <div style={{ marginTop: 26, borderRadius: 24, background: '#171717', color: '#FFFFFF', padding: 26 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9C9C9C', fontWeight: 700 }}>
                  Signed in as
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{V.accountEmail}</div>
                <button
                  onClick={V.togglePromoOptIn}
                  style={{
                    marginTop: 18,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      marginTop: 1,
                      border: `1px solid ${V.promoOptIn ? ACCENT : '#3B3B3B'}`,
                      borderRadius: 5,
                      background: V.promoOptIn ? ACCENT : 'transparent',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {V.promoOptIn ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.4, color: '#A8A8A8' }}>
                    Send me promos and offers from vendors
                  </span>
                </button>
                <button
                  onClick={V.signOut}
                  style={{
                    marginTop: 18,
                    border: '1px solid #3B3B3B',
                    borderRadius: 999,
                    background: 'transparent',
                    color: '#FFFFFF',
                    padding: '11px 18px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {V.isVendorSignIn && (
        <div style={{ padding: '34px 0 0', maxWidth: 440 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 30 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Vendor sign in</h1>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
            For businesses managing a listing on Eventory. Not a vendor yet?{' '}
            <button onClick={V.goVendorOnboarding} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Start onboarding
            </button>
            .
          </p>

          {V.vsiForgotMode ? (
            <div style={{ marginTop: 22, border: '1px solid #ECECEC', borderRadius: 24, padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {V.vsiForgotSent ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Check your email</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    If {V.vsiEmail} has a vendor account, we've sent a link to reset the password. Click it to choose a new one.
                  </p>
                  <button
                    onClick={V.closeVsiForgot}
                    style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Reset your password</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    Enter your account email and we'll send you a link to set a new password.
                  </p>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Email address</span>
                    <input
                      type="email"
                      value={V.vsiEmail}
                      onChange={V.setVsiEmail}
                      placeholder="your@email.com"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '13px 20px', fontFamily: SANS, fontSize: 15 }}
                    />
                  </label>
                  <button
                    onClick={V.submitVsiForgot}
                    disabled={V.vsiForgotDisabled}
                    style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '14px 24px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.vsiForgotDisabled ? 0.5 : 1 }}
                  >
                    {V.vsiForgotSubmitting ? 'Sending…' : 'Send reset link'}
                  </button>
                  {V.vsiForgotError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.vsiForgotError}</div>}
                  <button
                    onClick={V.closeVsiForgot}
                    style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 22, border: '1px solid #ECECEC', borderRadius: 24, padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Email address</span>
                <input
                  type="email"
                  value={V.vsiEmail}
                  onChange={V.setVsiEmail}
                  placeholder="your@email.com"
                  style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '13px 20px', fontFamily: SANS, fontSize: 15 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Password</span>
                  <button
                    onClick={V.openVsiForgot}
                    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: ACCENT }}
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordField value={V.vsiPassword} onChange={V.setVsiPassword} placeholder="Your password" show={V.vsiShowPassword} onToggleShow={V.toggleVsiShowPassword} />
              </label>
              <button
                onClick={V.vsiSignIn}
                disabled={V.vsiDisabled}
                style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '14px 24px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.vsiDisabled ? 0.5 : 1 }}
              >
                {V.vsiSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
              {V.vsiError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.vsiError}</div>}
            </div>
          )}
        </div>
      )}

      {V.isVendorSetPassword && (
        <div style={{ padding: '34px 0 0', maxWidth: 440 }}>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 30 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            Set your password
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
            Choose a password for your Eventory vendor account. You'll use this to sign back in and manage your listing.
          </p>

          <div style={{ marginTop: 22, border: '1px solid #ECECEC', borderRadius: 24, padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>New password (min. 6 characters)</span>
              <PasswordField
                value={V.newPassword}
                onChange={V.setNewPassword}
                placeholder="Create a password"
                show={V.newShowPassword}
                onToggleShow={V.toggleNewShowPassword}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Confirm password</span>
              <PasswordField
                value={V.newPasswordConfirm}
                onChange={V.setNewPasswordConfirm}
                placeholder="Re-enter your password"
                show={V.newShowPasswordConfirm}
                onToggleShow={V.toggleNewShowPasswordConfirm}
              />
            </label>
            <button
              onClick={V.submitNewPassword}
              disabled={V.newPasswordDisabled}
              style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '14px 24px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.newPasswordDisabled ? 0.5 : 1 }}
            >
              {V.newPasswordSubmitting ? 'Saving…' : 'Save password & continue'}
            </button>
            {V.newPasswordError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.newPasswordError}</div>}
          </div>
        </div>
      )}

      {V.isVendorDashboard && (
        <div style={{ padding: '34px 0 0', maxWidth: 780 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>

          {!V.isSignedIn && (
            <div style={{ marginTop: 22 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>Vendor dashboard</h1>
              <p style={{ margin: '12px 0 0', fontSize: 15, color: '#5B5B5B' }}>
                You need to sign in as a vendor to see this.{' '}
                <button onClick={V.goVendorSignIn} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {V.isSignedIn && V.vdLoading && (
            <div style={{ marginTop: 22, fontSize: 15, color: '#8A8A8A' }}>Loading your listing…</div>
          )}

          {V.isSignedIn && !V.vdLoading && V.vdError && (
            <div style={{ marginTop: 22, fontSize: 14, color: '#B3261E' }}>{V.vdError}</div>
          )}

          {V.isSignedIn && !V.vdLoading && !V.vdError && !V.vdHasVendor && (
            <div style={{ marginTop: 22 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>No listing found</h1>
              <p style={{ margin: '12px 0 0', fontSize: 15, color: '#5B5B5B' }}>
                We couldn't find a vendor listing for this account.{' '}
                <button onClick={V.goVendorOnboarding} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Start onboarding
                </button>
              </p>
            </div>
          )}

          {V.isSignedIn && !V.vdLoading && !V.vdError && V.vdHasVendor && (
            <>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>{V.vdVendor.name}</h1>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginTop: 10,
                      border: '1px solid #E4E4DF',
                      borderRadius: 999,
                      background: V.vdVendor.published ? '#EAF6EC' : '#F7F7F5',
                      color: V.vdVendor.published ? '#1E7A32' : '#5B5B5B',
                      padding: '5px 14px',
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {V.vdStatusLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {V.vdVendor.published && (
                    <button
                      onClick={V.goVdPublicProfile}
                      style={{ border: '1px solid #171717', borderRadius: 999, background: '#FFFFFF', color: '#171717', padding: '11px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                    >
                      View public profile
                    </button>
                  )}
                  {!V.vdGuidedOpen && (
                    <button
                      onClick={V.toggleVdInquiries}
                      style={{
                        border: `1px solid ${V.vdTab === 'inquiries' ? '#171717' : '#D7D7D2'}`,
                        borderRadius: 999,
                        background: V.vdTab === 'inquiries' ? '#171717' : 'transparent',
                        color: V.vdTab === 'inquiries' ? '#FFFFFF' : '#5B5B5B',
                        padding: '11px 18px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Inquiries ({V.vdInquiriesCount})
                    </button>
                  )}
                  <button
                    onClick={V.vdSignOut}
                    style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', color: '#5B5B5B', padding: '11px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
              {!V.vdVendor.published && V.vdSubmittedAt && (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: '#8A8A8A' }}>
                  Submitted for review on {new Date(V.vdSubmittedAt).toLocaleDateString()}. We review new listings by hand
                  before publishing — you can keep editing anytime in the meantime.
                </p>
              )}

              {V.vdTab === 'inquiries' && !V.vdGuidedOpen && (
                <h2 style={{ margin: '22px 0 0', fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>Inquiries</h2>
              )}

              {!V.vdGuidedOpen && V.vdTab !== 'inquiries' && (
                <div
                  style={{
                    marginTop: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    borderRadius: 20,
                    padding: isMobile ? 18 : '20px 24px',
                    background: '#171717',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>{V.vdVendor.published || V.vdSubmittedAt ? 'Edit my profile' : 'Build my profile'}</div>
                    <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
                      We'll walk you through your photos, packages, and everything else, one step at a time.
                    </p>
                  </div>
                  <button
                    onClick={V.startVdGuide}
                    style={{
                      flexShrink: 0,
                      border: 0,
                      borderRadius: 999,
                      background: ACCENT,
                      color: '#FFFFFF',
                      padding: '13px 24px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {V.vdVendor.published || V.vdSubmittedAt ? 'Edit my profile →' : 'Build my profile →'}
                  </button>
                </div>
              )}

              {V.vdGuidedOpen && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Step {V.vdGuideStepNumber} of {V.vdGuideStepCount}
                    </div>
                    <button
                      onClick={V.exitVdGuide}
                      style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      Exit — your changes are saved
                    </button>
                  </div>
                  <h2 style={{ margin: '6px 0 0', fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, letterSpacing: '-0.01em' }}>{V.vdGuideStepLabel}</h2>
                  <div style={{ marginTop: 12, display: 'flex', gap: 4 }}>
                    {VD_GUIDE_TABS.map((k) => (
                      <div key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: VD_GUIDE_TABS.indexOf(V.vdTab) >= VD_GUIDE_TABS.indexOf(k) ? '#171717' : '#ECECEC' }} />
                    ))}
                  </div>
                </div>
              )}

              {V.vdSaveError && <div style={{ marginTop: 16, fontSize: 13, color: '#B3261E' }}>{V.vdSaveError}</div>}

              {V.vdTab === 'profile' && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Cover &amp; logo</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Cover photo</span>
                        {V.vdCoverUrl ? (
                          <img src={V.vdCoverUrl} alt="Cover" style={{ width: 180, height: 100, borderRadius: 12, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 180, height: 100, borderRadius: 12, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9A9A9A' }}>
                            {V.vdUploadingCover ? 'Uploading…' : 'Add photo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadVdCover} style={{ fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Logo</span>
                        {V.vdLogoUrl ? (
                          <img src={V.vdLogoUrl} alt="Logo" style={{ width: 100, height: 100, borderRadius: 999, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 100, height: 100, borderRadius: 999, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9A9A9A', textAlign: 'center' }}>
                            {V.vdUploadingLogo ? 'Uploading…' : 'Add logo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadVdLogo} style={{ fontSize: 12 }} />
                      </label>
                    </div>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Main category (optional)</span>
                    <input type="text" value={V.vdSubcategory} onChange={V.setVdSubcategory} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Contact person</span>
                    <input type="text" value={V.vdContactPerson} onChange={V.setVdContactPerson} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Phone number</span>
                    <input type="tel" value={V.vdPhone} onChange={V.setVdPhone} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>City / municipality</span>
                    <select
                      value={V.vdCity}
                      onChange={V.setVdCity}
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    >
                      <option value="" disabled>Select a municipality</option>
                      {V.vdCityOptions.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {V.vdCityOtherSelected && (
                      <input
                        type="text"
                        value={V.vdCityOther}
                        onChange={V.setVdCityOther}
                        placeholder="Tell us your city or town"
                        style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }}
                      />
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Starting price (TT$, optional)</span>
                    <input type="number" value={V.vdStartingPrice} onChange={V.setVdStartingPrice} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Short bio</span>
                    <textarea value={V.vdBio} onChange={V.setVdBio} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>About us</span>
                    <textarea value={V.vdDescription} onChange={V.setVdDescription} rows={4} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Instagram handle</span>
                    <input type="text" value={V.vdInstagram} onChange={V.setVdInstagram} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Facebook handle</span>
                    <input type="text" value={V.vdFacebook} onChange={V.setVdFacebook} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>TikTok handle</span>
                    <input type="text" value={V.vdTiktok} onChange={V.setVdTiktok} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Map link</span>
                    <input type="text" value={V.vdMapLink} onChange={V.setVdMapLink} placeholder="https://maps.google.com/…" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Address line 1 (optional)</span>
                    <input type="text" value={V.vdAddressLine1} onChange={V.setVdAddressLine1} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Address line 2 (optional)</span>
                    <input type="text" value={V.vdAddressLine2} onChange={V.setVdAddressLine2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <button
                    onClick={V.saveVdProfile}
                    disabled={V.vdSaving}
                    style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.vdSaving ? 0.6 : 1 }}
                  >
                    {V.vdSaving ? 'Saving…' : V.vdSaved ? 'Saved ✓' : 'Save changes'}
                  </button>
                </div>
              )}

              {V.vdTab === 'packages' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {V.vdVendor.packages.map((p) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #ECECEC', borderRadius: 16, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.photoUrl && (
                            <img src={p.photoUrl} alt={p.name} loading="lazy" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ fontSize: 14 }}>
                            <strong>{p.name}</strong> — TT${p.priceMin}–TT${p.priceMax}
                          </div>
                        </div>
                        <button onClick={V.removeVdPackage(p.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, border: '1px dashed #D7D7D2', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Add a package</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8A8A8A' }}>These are just ideas — name and price it however you like.</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedVdPackageChips.map((c) => (
                        <button key={c.name} onClick={c.pick} style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#FFFFFF', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{c.name}</button>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input type="text" value={V.vdPkgName} onChange={V.setVdPkgName} placeholder="Package name" style={{ border: '2px solid #171717', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, fontWeight: 600 }} />
                      <input type="text" value={V.vdPkgDescription} onChange={V.setVdPkgDescription} placeholder="Description (optional)" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" value={V.vdPkgPriceMin} onChange={V.setVdPkgPriceMin} placeholder="Price min (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                        <input type="number" value={V.vdPkgPriceMax} onChange={V.setVdPkgPriceMax} placeholder="Price max (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {V.vdPkgPhotoUrl && (
                          <img src={V.vdPkgPhotoUrl} alt="Package" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Photo (optional)</span>
                          <input type="file" accept="image/*" onChange={V.uploadVdPkgPhoto} style={{ fontSize: 12 }} />
                        </label>
                        {V.vdUploadingPkgPhoto && <span style={{ fontSize: 12, color: '#8A8A8A' }}>Uploading…</span>}
                      </div>
                      <button onClick={V.addVdPackage} disabled={V.vdAddPkgDisabled} style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.vdAddPkgDisabled ? 0.5 : 1 }}>
                        {V.vdAddingPkg ? 'Adding…' : 'Add package'}
                      </button>
                      {V.vdSaveError && <div style={{ fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                    </div>
                  </div>
                </div>
              )}

              {V.vdTab === 'gallery' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {V.vdVendor.gallery.map((g) => (
                      <div key={g.id} style={{ position: 'relative' }}>
                        <img src={g.photoUrl} alt={g.eventType} loading="lazy" style={{ width: 140, height: 100, borderRadius: 12, objectFit: 'cover' }} />
                        <div style={{ marginTop: 4, fontSize: 11, color: '#8A8A8A' }}>{g.eventType}</div>
                        <button onClick={V.removeVdGalleryPhoto(g.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700, padding: 0 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, border: '1px dashed #D7D7D2', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Add a photo</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8A8A8A' }}>These are just ideas — name the album whatever fits your business.</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedVdAlbumChips.map((c) => (
                        <button key={c.name} onClick={c.pick} style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#FFFFFF', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{c.name}</button>
                      ))}
                    </div>
                    <input type="text" value={V.vdAlbumEventType} onChange={V.setVdAlbumEventType} placeholder="Album name, e.g. Weddings" style={{ marginTop: 10, width: '100%', border: '2px solid #171717', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, fontWeight: 600 }} />
                    <input type="file" accept="image/*" onChange={V.uploadVdGalleryPhoto} style={{ marginTop: 10, fontSize: 12 }} />
                    {V.vdUploadingGalleryPhoto && <div style={{ marginTop: 8, fontSize: 12, color: '#8A8A8A' }}>Uploading…</div>}
                    {V.vdSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                  </div>
                </div>
              )}

              {V.vdTab === 'menu' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {V.vdVendor.menu.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #ECECEC', borderRadius: 14, padding: '10px 14px' }}>
                        <div style={{ fontSize: 14 }}>{m.name}</div>
                        <button onClick={V.removeVdMenuItem(m.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#B3261E', fontWeight: 800 }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <input type="text" value={V.vdMenuDraft} onChange={V.setVdMenuDraft} placeholder="e.g. Grilled Chicken Platter" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <button onClick={V.addVdMenuItem} disabled={!V.vdMenuDraft.trim() || V.vdAddingMenuItem} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: !V.vdMenuDraft.trim() || V.vdAddingMenuItem ? 0.5 : 1 }}>
                      Add item
                    </button>
                  </div>
                  {V.vdSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                </div>
              )}

              {V.vdTab === 'faqs' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {V.vdVendor.faqs.map((f) => (
                      <div key={f.id} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{f.q}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>{f.a}</div>
                        <button onClick={V.removeVdFaq(f.id)} style={{ marginTop: 8, border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, border: '1px dashed #D7D7D2', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Add a question</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedVdFaqChips.map((c) => (
                        <button key={c.q} onClick={c.pick} style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#FFFFFF', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left' }}>{c.q}</button>
                      ))}
                    </div>
                    <input type="text" value={V.vdFaqQ} onChange={V.setVdFaqQ} placeholder="Question" style={{ marginTop: 10, width: '100%', border: '2px solid #171717', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, fontWeight: 600 }} />
                    <textarea value={V.vdFaqA} onChange={V.setVdFaqA} placeholder="Answer" rows={2} style={{ marginTop: 8, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    <button onClick={V.addVdFaq} disabled={!V.vdFaqQ.trim() || !V.vdFaqA.trim() || V.vdAddingFaq} style={{ marginTop: 8, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: !V.vdFaqQ.trim() || !V.vdFaqA.trim() || V.vdAddingFaq ? 0.5 : 1 }}>
                      {V.vdAddingFaq ? 'Adding…' : 'Add question'}
                    </button>
                    {V.vdSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                  </div>
                </div>
              )}

              {V.vdTab === 'policies' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {V.vdVendor.policies.map((p) => (
                      <div key={p.id} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>{p.body}</div>
                        <button onClick={V.removeVdPolicy(p.id)} style={{ marginTop: 8, border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, border: '1px dashed #D7D7D2', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Add a policy</div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.suggestedVdPolicyChips.map((c) => (
                        <button key={c.title} onClick={c.pick} style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#FFFFFF', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{c.title}</button>
                      ))}
                    </div>
                    <input type="text" value={V.vdPolicyTitle} onChange={V.setVdPolicyTitle} placeholder="Policy title" style={{ marginTop: 10, width: '100%', border: '2px solid #171717', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, fontWeight: 600 }} />
                    <textarea value={V.vdPolicyBody} onChange={V.setVdPolicyBody} placeholder="Details" rows={2} style={{ marginTop: 8, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    <button onClick={V.addVdPolicy} disabled={!V.vdPolicyTitle.trim() || !V.vdPolicyBody.trim() || V.vdAddingPolicy} style={{ marginTop: 8, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: !V.vdPolicyTitle.trim() || !V.vdPolicyBody.trim() || V.vdAddingPolicy ? 0.5 : 1 }}>
                      {V.vdAddingPolicy ? 'Adding…' : 'Add policy'}
                    </button>
                    {V.vdSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                  </div>
                </div>
              )}

              {V.vdTab === 'promos' && (
                <div style={{ marginTop: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {V.vdVendor.promos.map((p) => (
                      <div key={p.id} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                          {p.discount && <div style={{ fontSize: 13, fontWeight: 700, color: PROMO_ACCENT }}>{p.discount}</div>}
                        </div>
                        {p.description && <div style={{ marginTop: 4, fontSize: 13, color: '#5B5B5B' }}>{p.description}</div>}
                        {p.expiresAt && <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 11, color: '#9A9A9A' }}>Ends {p.expiresAt}</div>}
                        <button onClick={V.removeVdPromo(p.id)} style={{ marginTop: 8, border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, border: '1px dashed #D7D7D2', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Add a promo</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8A8A8A' }}>Optional — a limited-time offer shown on your public profile.</div>
                    <input type="text" value={V.vdPromoTitle} onChange={V.setVdPromoTitle} placeholder="Promo title, e.g. Book early and save" style={{ marginTop: 10, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <input type="text" value={V.vdPromoDiscount} onChange={V.setVdPromoDiscount} placeholder="Discount, e.g. 15% off (optional)" style={{ marginTop: 8, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <textarea value={V.vdPromoDescription} onChange={V.setVdPromoDescription} placeholder="Details (optional)" rows={2} style={{ marginTop: 8, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    <label style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Ends (optional)</span>
                      <input type="date" value={V.vdPromoExpiresAt} onChange={V.setVdPromoExpiresAt} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#FFFFFF', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    </label>
                    <button onClick={V.addVdPromo} disabled={!V.vdPromoTitle.trim() || V.vdAddingPromo} style={{ marginTop: 8, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: !V.vdPromoTitle.trim() || V.vdAddingPromo ? 0.5 : 1 }}>
                      {V.vdAddingPromo ? 'Adding…' : 'Add promo'}
                    </button>
                    {V.vdSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.vdSaveError}</div>}
                  </div>
                </div>
              )}

              {V.vdTab === 'inquiries' && (
                <div style={{ marginTop: 22 }}>
                  {V.vdQuotesLoading && <div style={{ fontSize: 14, color: '#8A8A8A' }}>Loading…</div>}
                  {V.vdQuotesError && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.vdQuotesError}</div>}
                  {!V.vdQuotesLoading && !V.hasVdQuotes && !V.vdQuotesError && (
                    <div style={{ border: '1px dashed #D7D7D2', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, color: '#5B5B5B' }}>No quote requests yet. They'll show up here as planners reach out.</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {V.vdQuoteRows.map((q) => (
                      <div key={q.key} style={{ border: '1px solid #ECECEC', borderRadius: 20, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{q.contactName}</div>
                          <span
                            style={{
                              fontFamily: MONO,
                              fontSize: 10.5,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: '#5B5B5B',
                              border: '1px solid #E4E4DF',
                              borderRadius: 999,
                              padding: '3px 10px',
                            }}
                          >
                            {q.statusLabel}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#5B5B5B' }}>
                          {q.eventType}
                          {q.eventDate ? ' · ' + q.eventDate : ''}
                          {q.venue ? ' · ' + q.venue : ''}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#8A8A8A' }}>
                          {q.contactEmail}
                          {q.contactPhone ? ' · ' + q.contactPhone : ''}
                        </div>
                        {q.answerRows.length > 0 && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2F2ED', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {q.answerRows.map((a) => (
                              <div key={a.key} style={{ fontSize: 13, lineHeight: 1.5, color: '#4A4A4A' }}>
                                <span style={{ fontWeight: 700 }}>{a.label}:</span> {a.value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {V.vdGuidedOpen && (
                <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid #ECECEC', display: 'flex', gap: 10 }}>
                  {!V.vdGuideIsFirst && (
                    <button
                      onClick={V.vdGuidePrev}
                      style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '14px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                    >
                      ← Previous
                    </button>
                  )}
                  {V.vdGuideIsLast ? (
                    <button
                      onClick={V.vdSubmitForReview}
                      disabled={V.vdSubmitting}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.vdSubmitting ? 0.6 : 1 }}
                    >
                      {V.vdSubmitting ? 'Submitting…' : 'Submit for review'}
                    </button>
                  ) : (
                    <button
                      onClick={V.vdGuideNext}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                    >
                      Continue →
                    </button>
                  )}
                  {V.vdSubmitError && <div style={{ alignSelf: 'center', fontSize: 13, color: '#B3261E' }}>{V.vdSubmitError}</div>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {V.sourcingOpen && (
        <div
          onClick={V.closeSourcing}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                {V.sourcingSent ? 'Request sent' : 'Tell us what you could not find'}
              </h2>
              <button
                onClick={V.closeSourcing}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.sourcingSent ? (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Got it. We'll look for options that match what you described and follow up by email within one
                  business day.
                </p>
                <button
                  onClick={V.closeSourcing}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Describe what you're looking for in your own words. We'll find options and send them back to you.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 18 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Name
                    </span>
                    <input
                      type="text"
                      value={V.sourcingName}
                      onChange={V.setSourcingName}
                      placeholder="Your name"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Number
                    </span>
                    <input
                      type="tel"
                      value={V.sourcingPhone}
                      onChange={V.setSourcingPhone}
                      placeholder="868 000 0000"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Email
                    </span>
                    <input
                      type="email"
                      value={V.sourcingEmail}
                      onChange={V.setSourcingEmail}
                      placeholder="you@example.com"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                </div>

                <textarea
                  value={V.sourcingDescription}
                  onChange={V.setSourcingDescription}
                  placeholder="e.g. A 20x30 tent with sidewalls for 120 people on the church grounds in Arima, first Saturday in November"
                  style={{
                    marginTop: 18,
                    width: '100%',
                    minHeight: 140,
                    border: '1px solid #E4E4DF',
                    borderRadius: 16,
                    background: '#F7F7F5',
                    padding: 16,
                    fontFamily: SANS,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: '#171717',
                    resize: 'vertical',
                  }}
                />
                <label style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} aria-hidden="true">
                  Company
                  <input type="text" tabIndex={-1} autoComplete="off" value={V.sourcingCompany} onChange={V.setSourcingCompany} />
                </label>

                {V.sourcingError && <div style={{ marginTop: 12, fontSize: 13, color: '#B3261E' }}>{V.sourcingError}</div>}
                <button
                  onClick={V.submitSourcing}
                  disabled={V.sourcingDisabled}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    opacity: V.sourcingDisabled ? 0.5 : 1,
                  }}
                >
                  {V.sourcingSubmitting ? 'Sending…' : 'Submit request'}
                </button>
                <div style={{ marginTop: 12, fontSize: 12, color: '#5B5B5B', textAlign: 'center' }}>
                  We follow up by email within one business day.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {V.isAdmin && (
        <div style={{ padding: '34px 0 0', maxWidth: 760 }}>
          <button
            onClick={V.goHome}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            Admin
          </h1>

          {!V.adminIsAuthed ? (
            <div style={{ marginTop: 24, maxWidth: 420, border: '1px solid #ECECEC', borderRadius: 24, padding: 26 }}>
              {V.signedIn ? (
                <>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    Signed in as {V.email}, but this account doesn't have admin access.
                  </p>
                  <button
                    onClick={V.signOut}
                    style={{ marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Sign out and use a different account
                  </button>
                </>
              ) : V.authSent ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Check your email</div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                    We sent a sign-in link to {V.email}. Click it to come back here signed in.
                  </p>
                  <button
                    onClick={V.useDifferentEmail}
                    style={{ marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#5B5B5B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Use a different email
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Admin sign-in</div>
                  <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Email
                    </span>
                    <input
                      type="email"
                      value={V.email}
                      onChange={V.setEmail}
                      placeholder="you@organisation.tt"
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    />
                  </label>
                  <button
                    onClick={V.signIn}
                    disabled={V.signInDisabled}
                    style={{ marginTop: 14, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.signInDisabled ? 0.4 : 1 }}
                  >
                    {V.authSending ? 'Sending link…' : 'Continue with email'}
                  </button>
                  {V.authError && <div style={{ marginTop: 10, fontSize: 13, color: '#B3261E' }}>{V.authError}</div>}
                </>
              )}
            </div>
          ) : V.adminSubScreen === 'dashboard' ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, color: '#5B5B5B' }}>{V.adminVendors.length} vendors (drafts included)</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={V.goAdminBulkImport}
                    style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: '#FFFFFF', color: '#171717', padding: '11px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                  >
                    Bulk import
                  </button>
                  <button
                    onClick={V.goAdminNewVendor}
                    style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                  >
                    + Add vendor
                  </button>
                </div>
              </div>
              {V.adminVendorsError && (
                <div style={{ marginTop: 14, fontSize: 13, color: '#B3261E' }}>{V.adminVendorsError}</div>
              )}
              {V.adminVendorsLoading ? (
                <div style={{ marginTop: 20, fontSize: 14, color: '#9A9A9A' }}>Loading…</div>
              ) : (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {V.adminVendors.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        borderTop: '1px solid #ECECEC',
                        padding: '16px 2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                            {!v.published && v.submitted_at && (
                              <span
                                style={{
                                  fontFamily: MONO,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  color: '#171717',
                                  border: '1px solid #171717',
                                  borderRadius: 999,
                                  padding: '2px 9px',
                                }}
                              >
                                Ready for review
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 2, fontFamily: MONO, fontSize: 12, color: '#9A9A9A' }}>{v.city}</div>
                        </div>
                        <button
                          onClick={() => V.togglePublish(v.id, !v.published)}
                          style={{
                            border: '1px solid #D7D7D2',
                            borderRadius: 999,
                            background: v.published ? '#171717' : 'transparent',
                            color: v.published ? '#FFFFFF' : '#171717',
                            padding: '9px 16px',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {v.published ? 'Published' : 'Draft — publish'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {v.owner_user_id ? (
                          <>
                            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>✓ Login active</span>
                            <button
                              onClick={() => V.resendAdminVendorSetupEmail(v.id)}
                              disabled={!!v.loginBusy}
                              style={{
                                border: '1px solid #D7D7D2',
                                borderRadius: 999,
                                background: 'transparent',
                                color: '#171717',
                                padding: '7px 14px',
                                cursor: v.loginBusy ? 'default' : 'pointer',
                                fontSize: 12.5,
                                fontWeight: 700,
                                opacity: v.loginBusy ? 0.6 : 1,
                              }}
                            >
                              {v.loginBusy ? 'Sending…' : 'Resend setup email'}
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="email"
                              value={v.loginEmailDraft ?? v.email ?? ''}
                              onChange={V.setAdminLoginEmailDraft(v.id)}
                              placeholder="vendor@business.tt"
                              style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '7px 14px', fontFamily: SANS, fontSize: 13, minWidth: 200 }}
                            />
                            <button
                              onClick={() => V.createAdminVendorLogin(v.id)}
                              disabled={!!v.loginBusy || !(v.loginEmailDraft ?? v.email ?? '').trim()}
                              style={{
                                border: 0,
                                borderRadius: 999,
                                background: '#171717',
                                color: '#FFFFFF',
                                padding: '7px 16px',
                                cursor: 'pointer',
                                fontSize: 12.5,
                                fontWeight: 700,
                                opacity: v.loginBusy || !(v.loginEmailDraft ?? v.email ?? '').trim() ? 0.5 : 1,
                              }}
                            >
                              {v.loginBusy ? 'Creating…' : 'Create login & send setup email'}
                            </button>
                          </>
                        )}
                        {v.loginDone && <span style={{ fontSize: 12, color: '#16A34A' }}>Setup email sent ✓</span>}
                        {v.loginError && <span style={{ fontSize: 12, color: '#B3261E' }}>{v.loginError}</span>}
                      </div>
                    </div>
                  ))}
                  {V.adminVendors.length === 0 && (
                    <div style={{ padding: '20px 2px', fontSize: 14, color: '#9A9A9A' }}>No vendors yet.</div>
                  )}
                </div>
              )}
            </div>
          ) : V.adminSubScreen === 'bulk-import' ? (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={V.goAdminDashboard}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
              >
                ← Dashboard
              </button>
              <h2 style={{ margin: '14px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Bulk import vendors</h2>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B', maxWidth: 560 }}>
                Upload a CSV with columns <strong>name, category, region, city, email</strong> (required) and
                optionally <strong>phone, bio, description</strong>. Category must match one of your categories
                by name or code; region must match one of the municipalities. Imported vendors are created as
                unpublished drafts.
              </p>

              {V.bulkImportResult && (
                <div style={{ marginTop: 18, border: '1px solid #16A34A', borderRadius: 16, padding: '14px 18px', background: '#F0FDF4', fontSize: 14, color: '#166534' }}>
                  Imported {V.bulkImportResult.created} vendor{V.bulkImportResult.created === 1 ? '' : 's'} as drafts.
                  Publish each one from the dashboard once its profile is ready.
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <input type="file" accept=".csv,text/csv" onChange={V.onBulkCsvFileChange} style={{ fontSize: 13 }} />
              </div>
              {V.bulkImportError && <div style={{ marginTop: 10, fontSize: 13, color: '#B3261E' }}>{V.bulkImportError}</div>}

              {V.bulkCsvRows.length > 0 && (
                <>
                  <div style={{ marginTop: 18, fontSize: 14, color: '#5B5B5B' }}>
                    {V.bulkCsvFileName} · {V.bulkCsvValidRows.length} ready to import
                    {V.bulkCsvInvalidCount > 0 ? `, ${V.bulkCsvInvalidCount} with errors` : ''}
                  </div>
                  <div style={{ marginTop: 10, overflowX: 'auto', border: '1px solid #ECECEC', borderRadius: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#F7F7F5' }}>
                          {['Row', 'Name', 'Category', 'Region', 'City', 'Email', 'Status'].map((h) => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9A9A9A', whiteSpace: 'nowrap', fontWeight: 700 }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {V.bulkCsvRows.map((r) => (
                          <tr key={r.rowNumber} style={{ borderTop: '1px solid #ECECEC', background: r.errors.length ? '#FEF2F2' : 'transparent' }}>
                            <td style={{ padding: '8px 12px', color: '#9A9A9A' }}>{r.rowNumber}</td>
                            <td style={{ padding: '8px 12px' }}>{r.name || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{r.categoryLabel || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{r.region || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{r.city || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{r.email || '—'}</td>
                            <td style={{ padding: '8px 12px', color: r.errors.length ? '#B3261E' : '#16A34A', fontWeight: 600 }}>
                              {r.errors.length ? r.errors.join('; ') : 'Ready'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={V.runBulkImport}
                    disabled={!V.bulkCsvValidRows.length || V.bulkImporting}
                    style={{ marginTop: 16, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: !V.bulkCsvValidRows.length || V.bulkImporting ? 0.4 : 1 }}
                  >
                    {V.bulkImporting ? 'Importing…' : `Import ${V.bulkCsvValidRows.length} vendor${V.bulkCsvValidRows.length === 1 ? '' : 's'}`}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={V.goAdminDashboard}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
              >
                ← Dashboard
              </button>
              <div style={{ marginTop: 14, display: 'flex', gap: 4 }}>
                {Array.from({ length: V.adminTotalSteps }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < V.adminStep ? '#171717' : '#ECECEC' }} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                Step {V.adminStep} of {V.adminTotalSteps}
              </div>

              {V.adminStep === 1 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Business basics</h2>
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Business name</span>
                      <input type="text" value={V.adminName} onChange={V.setAdminName} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Category</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.adminCategoryTiles.map((c) => (
                          <button key={c.code} onClick={c.pick} style={{ border: c.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: c.on ? '#171717' : '#FFFFFF', color: c.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Region</div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {V.adminRegionTiles.map((l) => (
                          <button key={l.label} onClick={l.pick} style={{ border: l.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: l.on ? '#171717' : '#FFFFFF', color: l.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>City</span>
                      <input type="text" value={V.adminCity} onChange={V.setAdminCity} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>WhatsApp number</span>
                      <input type="tel" value={V.adminWhatsapp} onChange={V.setAdminWhatsapp} placeholder="e.g. 868 123 4567" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Vendor's email (optional)</span>
                      <input type="email" value={V.adminEmail} onChange={V.setAdminEmail} placeholder="vendor@business.tt" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }} />
                      <span style={{ fontSize: 12, color: '#9A9A9A' }}>Needed later if you want to create their login and hand off the profile.</span>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Short description</span>
                      <textarea value={V.adminBio} onChange={V.setAdminBio} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                    </label>
                  </div>
                  <button
                    onClick={V.adminStep1Next}
                    disabled={V.adminStep1NextDisabled}
                    style={{ marginTop: 22, border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminStep1NextDisabled ? 0.4 : 1 }}
                  >
                    Continue →
                  </button>
                </>
              )}

              {V.adminStep === 2 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Full profile</h2>
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Full description</span>
                      <textarea value={V.adminDescription} onChange={V.setAdminDescription} rows={5} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15, resize: 'vertical' }} />
                    </label>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Cover photo</span>
                        {V.adminCoverUrl ? (
                          <img src={V.adminCoverUrl} alt="Cover" style={{ width: 180, height: 100, borderRadius: 12, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 180, height: 100, borderRadius: 12, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9A9A9A' }}>
                            {V.adminUploadingCover ? 'Uploading…' : 'Add photo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadAdminCover} style={{ fontSize: 12 }} />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Logo</span>
                        {V.adminLogoUrl ? (
                          <img src={V.adminLogoUrl} alt="Logo" style={{ width: 100, height: 100, borderRadius: 999, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 100, height: 100, borderRadius: 999, background: '#F7F7F5', border: '1px dashed #D7D7D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9A9A9A', textAlign: 'center' }}>
                            {V.adminUploadingLogo ? 'Uploading…' : 'Add logo'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={V.uploadAdminLogo} style={{ fontSize: 12 }} />
                      </label>
                    </div>
                    {V.adminSaveError && <div style={{ fontSize: 12, color: '#B3261E' }}>{V.adminSaveError}</div>}
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#9A9A9A' }}>
                      Starting price isn't set here — it's calculated automatically from the cheapest package you add in the next steps.
                    </div>
                  </div>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep2Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 3 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Gallery</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>Add photos grouped by event type (e.g. Weddings, Birthdays).</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" value={V.adminGalleryEventType} onChange={V.setAdminGalleryEventType} placeholder="Event type, e.g. Weddings" style={{ flex: '1 1 180px', border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    {V.adminGalleryPhotoUrl && (
                      <img src={V.adminGalleryPhotoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Photo</span>
                      <input type="file" accept="image/*" onChange={V.uploadAdminGalleryPhoto} style={{ fontSize: 12 }} />
                    </label>
                    {V.adminUploadingGalleryPhoto && <span style={{ fontSize: 12, color: '#8A8A8A' }}>Uploading…</span>}
                    <button onClick={V.adminAddGalleryPhoto} disabled={V.adminAddGalleryPhotoDisabled} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.adminAddGalleryPhotoDisabled ? 0.4 : 1 }}>
                      Add photo
                    </button>
                  </div>
                  {V.adminSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.adminSaveError}</div>}
                  {V.adminGallery.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {V.adminGallery.map((g, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #ECECEC', padding: '10px 2px' }}>
                          <div style={{ fontSize: 13, color: '#4A4A4A' }}>
                            <strong>{g.eventType}</strong> — {g.photoUrl}
                          </div>
                          <button onClick={() => V.adminRemoveGalleryPhoto(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep3Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 4 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Packages</h2>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="text" value={V.adminPkgName} onChange={V.setAdminPkgName} placeholder="Package name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {V.adminPkgPhotoUrl && (
                        <img src={V.adminPkgPhotoUrl} alt="Package" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Photo (optional)</span>
                        <input type="file" accept="image/*" onChange={V.uploadAdminPkgPhoto} style={{ fontSize: 12 }} />
                      </label>
                      {V.adminUploadingPkgPhoto && <span style={{ fontSize: 12, color: '#8A8A8A' }}>Uploading…</span>}
                    </div>
                    <textarea value={V.adminPkgDescription} onChange={V.setAdminPkgDescription} placeholder="Description" rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    <input type="text" value={V.adminPkgInclusionsText} onChange={V.setAdminPkgInclusionsText} placeholder="Inclusions, comma separated" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="number" value={V.adminPkgPriceMin} onChange={V.setAdminPkgPriceMin} placeholder="Price min (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                      <input type="number" value={V.adminPkgPriceMax} onChange={V.setAdminPkgPriceMax} placeholder="Price max (TT$)" style={{ flex: 1, border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14 }} />
                    </div>
                    <button onClick={V.adminAddPackage} disabled={V.adminAddPackageDisabled} style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '11px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: V.adminAddPackageDisabled ? 0.4 : 1 }}>
                      Add package
                    </button>
                  </div>
                  {V.adminSaveError && <div style={{ marginTop: 8, fontSize: 12, color: '#B3261E' }}>{V.adminSaveError}</div>}
                  {V.adminPackages.length > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {V.adminPackages.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #ECECEC', padding: '10px 2px' }}>
                          <div style={{ fontSize: 13, color: '#4A4A4A' }}>
                            <strong>{p.name}</strong> — TT${p.priceMin}–TT${p.priceMax}
                          </div>
                          <button onClick={() => V.adminRemovePackage(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep4Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 5 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>FAQ</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>Edit the defaults, remove ones that don't apply, or add your own.</p>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {V.adminFaqs.map((f, i) => (
                      <div key={i} style={{ border: '1px solid #ECECEC', borderRadius: 16, padding: 14 }}>
                        <input type="text" value={f.q} onChange={(e) => V.setAdminFaqQ(i, e)} placeholder="Question" style={{ width: '100%', border: 0, borderBottom: '1px solid #E4E4DF', background: 'transparent', padding: '6px 2px', fontFamily: SANS, fontSize: 14, fontWeight: 700 }} />
                        <textarea value={f.a} onChange={(e) => V.setAdminFaqA(i, e)} placeholder="Answer" rows={2} style={{ marginTop: 8, width: '100%', border: 0, background: 'transparent', padding: '2px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                        <button onClick={() => V.adminRemoveFaqRow(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B3261E', fontWeight: 700 }}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={V.adminAddFaqRow} style={{ marginTop: 12, border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    + Add question
                  </button>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep5Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue →</button>
                  </div>
                </>
              )}

              {V.adminStep === 6 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Policies</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#5B5B5B' }}>All optional — leave blank to hide a section on the live profile.</p>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Payment</span>
                      <textarea value={V.adminPaymentTerms} onChange={V.setAdminPaymentTerms} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Deposit</span>
                      <textarea value={V.adminDepositTerms} onChange={V.setAdminDepositTerms} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Rescheduling</span>
                      <textarea value={V.adminReschedulePolicy} onChange={V.setAdminReschedulePolicy} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Cancellation &amp; refunds</span>
                      <textarea value={V.adminCancellationPolicy} onChange={V.setAdminCancellationPolicy} rows={2} style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, resize: 'vertical' }} />
                    </label>
                  </div>
                  <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button onClick={V.adminStep6Next} style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Continue to review →</button>
                  </div>
                </>
              )}

              {V.adminStep === 7 && (
                <>
                  <h2 style={{ margin: '6px 0 0', fontSize: 24, letterSpacing: '-0.02em', fontWeight: 800 }}>Review &amp; publish</h2>
                  <div style={{ marginTop: 16, borderRadius: 20, background: '#F7F7F5', padding: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                    <div><strong>{V.adminName || '(no name)'}</strong> · {catName(st.adminCategoryCode)} · {st.adminRegion}, {V.adminCity}</div>
                    <div style={{ color: '#5B5B5B' }}>{V.adminGallery.length} gallery photos · {V.adminPackages.length} packages · {(st.adminFaqs || []).filter((f) => f.q.trim() && f.a.trim()).length} FAQ entries</div>
                  </div>
                  {V.adminSaveError && <div style={{ marginTop: 12, fontSize: 13, color: '#B3261E' }}>{V.adminSaveError}</div>}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={V.adminStepBack} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '13px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back</button>
                    <button
                      onClick={() => V.adminSaveVendor(false)}
                      disabled={V.adminSaving}
                      style={{ border: '1px solid #171717', borderRadius: 999, background: 'transparent', color: '#171717', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminSaving ? 0.5 : 1 }}
                    >
                      Save as draft
                    </button>
                    <button
                      onClick={() => V.adminSaveVendor(true)}
                      disabled={V.adminSaving}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '13px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: V.adminSaving ? 0.5 : 1 }}
                    >
                      {V.adminSaving ? 'Publishing…' : 'Publish'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {V.isVendorOnboarding && (
        <div style={{ padding: '34px 0 0', maxWidth: 720 }}>
          <button
            onClick={
              !V.voDone && V.voStep > 0 && !(V.signedIn && V.voStep === 2)
                ? () => patch({ voStep: V.voStep - 1 })
                : V.goHome
            }
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '18px 0 0', fontSize: isMobile ? 28 : 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 800 }}>
            {V.voStep === 0 && !V.voDone ? 'List your business on Eventory' : 'Vendor onboarding'}
          </h1>

          {V.voDone ? (
            <div style={{ marginTop: 24, maxWidth: 460, border: '1px solid #ECECEC', borderRadius: 24, padding: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>You're in!</div>
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#5B5B5B' }}>
                Your account is live. Add photos, packages, and the rest of your profile whenever you're
                ready — straight from your dashboard, no rush.
              </p>
              <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => patch({ screen: 'vendor-dashboard' })}
                  style={{ border: 0, borderRadius: 999, background: '#171717', color: '#FFFFFF', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                >
                  Go to your dashboard
                </button>
                <button
                  onClick={V.goHome}
                  style={{ border: '1px solid #D7D7D2', borderRadius: 999, background: 'transparent', color: '#5B5B5B', padding: '13px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                >
                  Back to home
                </button>
              </div>
            </div>
          ) : V.voStep === 0 ? (
            <>
              <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.5, color: '#5B5B5B', maxWidth: 480 }}>
                Get discovered by people planning events in T&amp;T. Takes about two minutes.
              </p>

              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => patch({ voStep: 1 })}
                  style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '15px 30px', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}
                >
                  Get started →
                </button>
                <button onClick={V.goVendorSignIn} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Sign in instead
                </button>
              </div>

              <div style={{ marginTop: 28, borderRadius: 24, background: '#171717', color: '#FFFFFF', padding: isMobile ? '22px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 18 }}>
                {[
                  'Get discovered',
                  'Set your own terms — no commission taken',
                  'Talk directly to clients — no middleman',
                ].map((title, i) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18 }}>
                    <div style={{ flexShrink: 0, fontFamily: MONO, fontSize: isMobile ? 16 : 18, fontWeight: 600, color: ACCENT }}>{'0' + (i + 1)}</div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: ACCENT }}>
                Step {V.voStep} of 2 · {['', 'Create your account', 'Your business'][V.voStep]}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                {V.voStep === 1 && "Let's get you set up — this takes about a minute."}
                {V.voStep === 2 && "Almost there — tell us what you do and where to find you. You can add photos, pricing, and everything else later from your dashboard."}
              </p>
              {V.voStep === 1 && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#8A8A8A' }}>
                  Already have a vendor account?{' '}
                  <button onClick={V.goVendorSignIn} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#171717', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    Sign in
                  </button>{' '}
                  instead of creating a new one.
                </p>
              )}
              <div style={{ marginTop: 14, display: 'flex', gap: 4 }}>
                {[1, 2].map((n) => (
                  <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: V.voStep >= n ? '#171717' : '#ECECEC' }} />
                ))}
              </div>

              {V.voStep === 1 && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Email address *</span>
                    <input type="email" value={V.voEmail} onChange={V.setVoEmail} placeholder="your@email.com" style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '13px 20px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Phone number *</span>
                    <input type="tel" value={V.voPhone} onChange={V.setVoPhone} placeholder="868 123 4567" style={{ border: '1px solid #E4E4DF', borderRadius: 999, background: '#F7F7F5', padding: '13px 20px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Password * (min. 6 characters)</span>
                    <PasswordField value={V.voPassword} onChange={V.setVoPassword} placeholder="Create a strong password" show={V.voShowPassword} onToggleShow={V.toggleVoShowPassword} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Confirm password *</span>
                    <PasswordField value={V.voConfirmPassword} onChange={V.setVoConfirmPassword} placeholder="Re-enter your password" show={V.voShowConfirmPassword} onToggleShow={V.toggleVoShowConfirmPassword} />
                  </label>

                  <div onClick={V.toggleVoAgree} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, marginTop: 1, border: `1px solid ${V.voAgree ? '#171717' : '#C8C8C2'}`, borderRadius: 5, background: V.voAgree ? '#171717' : 'transparent', color: '#FFFFFF', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {V.voAgree ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: '#5B5B5B' }}>
                      I agree to the{' '}
                      <button
                        onClick={(e) => { e.stopPropagation(); V.goTerms(); }}
                        style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: '#171717', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        onClick={(e) => { e.stopPropagation(); V.goPrivacy(); }}
                        style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: '#171717', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </div>

                  <button
                    onClick={V.goVoBusinessStep}
                    disabled={V.voAccountStepDisabled}
                    style={{ alignSelf: 'flex-start', border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.voAccountStepDisabled ? 0.5 : 1 }}
                  >
                    Continue →
                  </button>
                </div>
              )}

              {V.voStep === 2 && (
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Sector * (up to 3)</div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.voSectorTiles.map((c) => (
                        <button
                          key={c.code}
                          onClick={c.pick}
                          disabled={c.maxed}
                          style={{
                            border: c.on ? '2px solid #171717' : '1px solid #E4E4DF',
                            borderRadius: 999,
                            background: c.on ? '#171717' : '#FFFFFF',
                            color: c.on ? '#FFFFFF' : c.maxed ? '#C8C8C2' : '#171717',
                            padding: '9px 16px',
                            cursor: c.maxed ? 'default' : 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            opacity: c.maxed ? 0.6 : 1,
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    {V.voSectorOtherSelected && (
                      <input
                        type="text"
                        value={V.voSectorOtherText}
                        onChange={V.setVoSectorOtherText}
                        placeholder="Tell us what you offer"
                        style={{ marginTop: 8, width: '100%', border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }}
                      />
                    )}
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Main category (optional)</span>
                    <input type="text" value={V.voSubcategory} onChange={V.setVoSubcategory} placeholder="e.g. Buffet Catering, Wedding Venues" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Business name *</span>
                    <input type="text" value={V.voBusinessName} onChange={V.setVoBusinessName} placeholder="Your business name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Contact person *</span>
                    <input type="text" value={V.voContactPerson} onChange={V.setVoContactPerson} placeholder="Your full name" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                  </label>
                  {V.signedIn && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Phone number *</span>
                      <input type="tel" value={V.voPhone} onChange={V.setVoPhone} placeholder="868 123 4567" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                    </label>
                  )}
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Country *</div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {V.voCountryTiles.map((c) => (
                        <button
                          key={c.label}
                          onClick={c.pick}
                          style={{ border: c.on ? '2px solid #171717' : '1px solid #E4E4DF', borderRadius: 999, background: c.on ? '#171717' : '#FFFFFF', color: c.on ? '#FFFFFF' : '#171717', padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>City / municipality *</span>
                    <select
                      value={V.voCity}
                      onChange={V.setVoCity}
                      style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                    >
                      <option value="" disabled>Select a municipality</option>
                      {V.voCityOptions.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {V.voCityOtherSelected && (
                      <input
                        type="text"
                        value={V.voCityOther}
                        onChange={V.setVoCityOther}
                        placeholder="Tell us your city or town"
                        style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 15 }}
                      />
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Starting price (TT$, optional)</span>
                    <input type="number" value={V.voStartingPrice} onChange={V.setVoStartingPrice} placeholder="e.g. 500" style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15 }} />
                    <span style={{ fontSize: 12, color: '#9A9A9A' }}>Rough figure for now — this updates automatically once you add real packages.</span>
                  </label>

                  {V.voStep1Error && <div style={{ fontSize: 13, color: '#B3261E' }}>{V.voStep1Error}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => patch({ voStep: 1 })} style={{ border: 0, background: 'transparent', color: '#5B5B5B', padding: '14px 4px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Previous</button>
                    <button
                      onClick={V.voStep1Next}
                      disabled={V.voStep1Disabled || V.voStep1Submitting}
                      style={{ border: 0, borderRadius: 999, background: ACCENT, color: '#FFFFFF', padding: '14px 26px', cursor: 'pointer', fontSize: 15, fontWeight: 700, opacity: V.voStep1Disabled || V.voStep1Submitting ? 0.5 : 1 }}
                    >
                      {V.voStep1Submitting ? (V.signedIn ? 'Creating your listing…' : 'Creating account…') : 'Continue →'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {V.planModalOpen && (
        <div
          onClick={V.closePlanModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                {V.planStep > 1 && (
                  <button
                    onClick={V.planStepBack}
                    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
                  >
                    ← Back
                  </button>
                )}
                <div style={{ marginTop: V.planStep > 1 ? 10 : 0, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Step {V.planStep} of {V.planTotalSteps}
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                  {V.planStep === 1 && 'What kind of celebration is it?'}
                  {V.planStep === 2 && 'Which occasion?'}
                  {V.planStep === 3 && 'When & where?'}
                  {V.planStep === 4 && 'Which vendors are you looking for?'}
                  {V.planStep === 5 && "What's your budget?"}
                  {V.planStep === 6 && 'Save your plan'}
                </h2>
              </div>
              <button
                onClick={V.closePlanModal}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.planStep === 1 && (
              <>
                <div
                  style={{
                    marginTop: 22,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  {V.celebrationTypeTiles.map((t) => (
                    <button
                      key={t.key}
                      onClick={t.pick}
                      style={{
                        border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 16,
                        background: t.on ? '#171717' : '#FFFFFF',
                        color: t.on ? '#FFFFFF' : '#171717',
                        padding: '18px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.on ? 'rgba(255,255,255,0.7)' : '#8A8A8A' }}>
                        {t.hint}
                      </span>
                    </button>
                  ))}
                </div>
                <p style={{ margin: '16px 0 0', fontSize: 12, fontStyle: 'italic', color: '#9A9A9A' }}>
                  We'll show vendor counts by category here once we've launched.
                </p>
              </>
            )}

            {V.planStep === 2 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Pick the occasion that's closest to what you're planning.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {V.planOccasionTiles.map((o) => (
                    <button
                      key={o.label}
                      onClick={o.pick}
                      style={{
                        border: o.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: o.on ? '#171717' : '#FFFFFF',
                        color: o.on ? '#FFFFFF' : '#171717',
                        padding: '10px 18px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {V.planStep === 3 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Roughly when is your {V.planEventLabel.toLowerCase()}, and where in Trinidad &amp; Tobago?
                </p>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                    Event date (optional)
                  </div>
                  <input
                    type="date"
                    value={V.planEventDate}
                    onChange={V.setPlanEventDate}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      border: '1px solid #E4E4DF',
                      borderRadius: 14,
                      background: '#F7F7F5',
                      padding: '11px 14px',
                      fontFamily: SANS,
                      fontSize: 14,
                      color: '#171717',
                    }}
                  />
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                    Location
                  </div>
                  <select
                    value={V.planLoc}
                    onChange={V.setPlanLoc}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      border: '1px solid #E4E4DF',
                      borderRadius: 14,
                      background: '#F7F7F5',
                      padding: '11px 14px',
                      fontFamily: SANS,
                      fontSize: 14,
                      color: '#171717',
                    }}
                  >
                    {LOCATIONS.map((l, i) => (
                      <option key={l} value={i}>{l}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={V.planWhenWhereNext}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 4 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  We've pre-selected the categories most people book for a {V.planEventLabel.toLowerCase()} — tick or untick anything to match what you need.
                </p>
                <div
                  style={{
                    marginTop: 18,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: 8,
                  }}
                >
                  {V.planCategoryTiles.map((c) => (
                    <button
                      key={c.code}
                      onClick={c.toggle}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        border: c.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 11,
                        background: c.on ? '#F5F6E9' : '#FFFFFF',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          border: c.on ? '2px solid #16A34A' : '2px solid #171717',
                          background: c.on ? '#16A34A' : 'transparent',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                        }}
                      >
                        {c.on ? '✓' : ''}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={V.planServicesNext}
                  disabled={V.planServicesNextDisabled}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: V.planServicesNextDisabled ? 'not-allowed' : 'pointer',
                    opacity: V.planServicesNextDisabled ? 0.4 : 1,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 5 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  Roughly what are you looking to spend? This helps us show you a realistic shortlist.
                </p>
                <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {V.planBudgetTiles.map((b) => (
                    <button
                      key={b.label}
                      onClick={b.pick}
                      style={{
                        border: b.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: b.on ? '#171717' : '#FFFFFF',
                        color: b.on ? '#FFFFFF' : '#171717',
                        padding: '9px 16px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={V.planBudgetNext}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Continue →
                </button>
              </>
            )}

            {V.planStep === 6 && (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                  {V.signedIn
                    ? 'Last step — save this plan to your account so you can pick up where you left off.'
                    : "Last step — sign in to save your plan. We'll email you a link, no password needed."}
                </p>

                {V.signedIn ? (
                  <>
                    <div
                      style={{
                        marginTop: 18,
                        border: '1px solid #ECECEC',
                        borderRadius: 16,
                        padding: '14px 18px',
                        fontSize: 14,
                        color: '#5B5B5B',
                      }}
                    >
                      Signed in as <span style={{ fontWeight: 700, color: '#171717' }}>{V.accountEmail}</span>
                    </div>
                    <button
                      onClick={V.finishPlanning}
                      disabled={V.planSubmitDisabled}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: ACCENT,
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.planSubmitDisabled ? 'not-allowed' : 'pointer',
                        opacity: V.planSubmitDisabled ? 0.5 : 1,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {V.planSubmitting ? 'Saving…' : 'Save & see my matches →'}
                    </button>
                    {V.planSubmitError && (
                      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.planSubmitError}</div>
                    )}
                  </>
                ) : V.planAuthSent ? (
                  <div
                    style={{
                      marginTop: 18,
                      border: '1px solid #16A34A',
                      borderRadius: 16,
                      background: '#F0FDF4',
                      padding: '16px 18px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: '#166534',
                    }}
                  >
                    Check your email — tap the link we sent to {V.planAuthEmail} and your plan will be saved automatically.
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                        Email address
                      </div>
                      <input
                        type="email"
                        value={V.planAuthEmail}
                        onChange={V.setPlanAuthEmail}
                        placeholder="you@example.com"
                        style={{
                          marginTop: 8,
                          width: '100%',
                          border: '1px solid #E4E4DF',
                          borderRadius: 14,
                          background: '#F7F7F5',
                          padding: '11px 14px',
                          fontFamily: SANS,
                          fontSize: 14,
                          color: '#171717',
                        }}
                      />
                    </div>
                    <button
                      onClick={V.planSendMagicLink}
                      disabled={V.planAuthSending}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: ACCENT,
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.planAuthSending ? 'not-allowed' : 'pointer',
                        opacity: V.planAuthSending ? 0.5 : 1,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {V.planAuthSending ? 'Sending…' : 'Email me a magic link →'}
                    </button>
                    {V.planAuthError && (
                      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.planAuthError}</div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {V.waModalOpen && (
        <div
          onClick={V.closeWaModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24, lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 800 }}>
                Message {V.sup.name}
              </h2>
              <button
                onClick={V.closeWaModal}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
              A quick heads-up on what you need helps them reply faster.
            </p>

            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
              {V.waEventTypeTiles.map((t) => (
                <button
                  key={t.key}
                  onClick={t.pick}
                  style={{
                    border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                    borderRadius: 14,
                    background: t.on ? '#171717' : '#FFFFFF',
                    color: t.on ? '#FFFFFF' : '#171717',
                    padding: '11px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {st.waEventType === 'other' && (
              <input
                type="text"
                value={V.waEventTypeOther}
                onChange={V.setWaEventTypeOther}
                placeholder="Tell us what you're planning"
                style={{
                  marginTop: 10,
                  width: '100%',
                  border: '1px solid #E4E4DF',
                  borderRadius: 14,
                  background: '#F7F7F5',
                  padding: '11px 14px',
                  fontFamily: SANS,
                  fontSize: 15,
                  color: '#171717',
                }}
              />
            )}

            {V.waServiceTiles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Service you're interested in (optional)
                </span>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {V.waServiceTiles.map((t) => (
                    <button
                      key={t.key}
                      onClick={t.pick}
                      style={{
                        border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                        borderRadius: 999,
                        background: t.on ? '#171717' : '#FFFFFF',
                        color: t.on ? '#FFFFFF' : '#171717',
                        padding: '9px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Date (optional)
                </span>
                <input
                  type="date"
                  value={V.waEventDate}
                  onChange={V.setWaEventDate}
                  style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                />
              </label>
              <label style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Venue (optional)
                </span>
                <input
                  type="text"
                  value={V.waVenue}
                  onChange={V.setWaVenue}
                  placeholder="e.g. Hyatt Regency"
                  style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                />
              </label>
              <label style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                  Guests (optional)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={V.waAttendees}
                  onChange={V.setWaAttendees}
                  placeholder="e.g. 80"
                  style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '11px 14px', fontFamily: SANS, fontSize: 14, color: '#171717' }}
                />
              </label>
            </div>

            {V.waSendDisabled ? (
              <div
                style={{
                  marginTop: 20,
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  border: 0,
                  borderRadius: 999,
                  background: '#25D366',
                  color: '#FFFFFF',
                  padding: '15px 26px',
                  fontSize: 15,
                  fontWeight: 700,
                  opacity: 0.5,
                }}
              >
                Message on WhatsApp →
              </div>
            ) : (
              <a
                href={V.waSendUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={V.closeWaModal}
                style={{
                  marginTop: 20,
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  border: 0,
                  borderRadius: 999,
                  background: '#25D366',
                  color: '#FFFFFF',
                  padding: '15px 26px',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Message on WhatsApp →
              </a>
            )}
            <a
              href={V.sup.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={V.closeWaModal}
              style={{
                marginTop: 12,
                display: 'block',
                textAlign: 'center',
                fontSize: 13,
                color: '#6E6E6E',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Skip — just message directly
            </a>
          </div>
        </div>
      )}

      {V.quoteModalOpen && (
        <div
          onClick={V.closeQuoteModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            {V.quoteSent ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                    Request sent
                  </h2>
                  <button
                    onClick={V.closeQuoteModal}
                    aria-label="Close"
                    style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.6, color: '#4A4A4A' }}>
                  {V.sup.name} received your quote request and will message you back directly at {V.quoteContactEmail}.
                </p>
                <button
                  onClick={V.closeQuoteModal}
                  style={{
                    marginTop: 22,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    {V.quoteStep > 1 && (
                      <button
                        onClick={V.quoteStepBack}
                        style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}
                      >
                        ← Back
                      </button>
                    )}
                    <div style={{ marginTop: V.quoteStep > 1 ? 10 : 0, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                      Step {V.quoteStep} of {V.quoteTotalSteps} · Quote from {V.sup.name}
                    </div>
                    <h2 style={{ margin: '6px 0 0', fontSize: isMobile ? 22 : 28, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                      {V.quoteStep === 1 && 'What are you planning for?'}
                      {V.quoteStep === 2 && 'When is your event?'}
                      {V.quoteStep === 3 && "What's the venue?"}
                      {V.quoteStep === 4 && 'A few details'}
                      {V.quoteStep === 5 && 'How should they reach you?'}
                      {V.quoteStep === 6 && 'Review & submit'}
                    </h2>
                  </div>
                  <button
                    onClick={V.closeQuoteModal}
                    aria-label="Close"
                    style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>

                {V.quoteStep === 1 && (
                  <>
                    <div
                      style={{
                        marginTop: 22,
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gap: 12,
                      }}
                    >
                      {V.quoteEventTypeTiles.map((t) => (
                        <button
                          key={t.key}
                          onClick={t.pick}
                          style={{
                            border: t.on ? '2px solid #171717' : '1px solid #E4E4DF',
                            borderRadius: 16,
                            background: t.on ? '#171717' : '#FFFFFF',
                            color: t.on ? '#FFFFFF' : '#171717',
                            padding: '18px 16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 15,
                            fontWeight: 700,
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {st.quoteEventType === 'other' && (
                      <input
                        type="text"
                        value={V.quoteEventTypeOther}
                        onChange={V.setQuoteEventTypeOther}
                        placeholder="Tell us what you're planning"
                        style={{
                          marginTop: 14,
                          width: '100%',
                          border: '1px solid #E4E4DF',
                          borderRadius: 14,
                          background: '#F7F7F5',
                          padding: '11px 14px',
                          fontFamily: SANS,
                          fontSize: 14,
                          color: '#171717',
                        }}
                      />
                    )}
                    <button
                      onClick={V.quoteNextStep}
                      disabled={!V.quoteStep1Valid}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.quoteStep1Valid ? 'pointer' : 'not-allowed',
                        opacity: V.quoteStep1Valid ? 1 : 0.4,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {V.quoteStep === 2 && (
                  <>
                    <div style={{ marginTop: 18 }}>
                      <input
                        type="date"
                        value={V.quoteEventDate}
                        onChange={V.setQuoteEventDate}
                        style={{
                          width: '100%',
                          border: '1px solid #E4E4DF',
                          borderRadius: 14,
                          background: '#F7F7F5',
                          padding: '11px 14px',
                          fontFamily: SANS,
                          fontSize: 14,
                          color: '#171717',
                        }}
                      />
                    </div>
                    <button
                      onClick={V.quoteNextStep}
                      disabled={!V.quoteStep2Valid}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.quoteStep2Valid ? 'pointer' : 'not-allowed',
                        opacity: V.quoteStep2Valid ? 1 : 0.4,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {V.quoteStep === 3 && (
                  <>
                    <div style={{ marginTop: 18 }}>
                      <input
                        type="text"
                        value={V.quoteVenue}
                        onChange={V.setQuoteVenue}
                        placeholder="Venue name or address"
                        style={{
                          width: '100%',
                          border: '1px solid #E4E4DF',
                          borderRadius: 14,
                          background: '#F7F7F5',
                          padding: '11px 14px',
                          fontFamily: SANS,
                          fontSize: 14,
                          color: '#171717',
                        }}
                      />
                    </div>
                    <button
                      onClick={V.quoteNextStep}
                      disabled={!V.quoteStep3Valid}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.quoteStep3Valid ? 'pointer' : 'not-allowed',
                        opacity: V.quoteStep3Valid ? 1 : 0.4,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {V.quoteStep === 4 && (
                  <>
                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5B5B5B' }}>
                      Optional — helps {V.sup.name} put together an accurate quote.
                    </p>
                    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {V.quoteCategoryFields.map((f) => (
                        <div key={f.k}>
                          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                            {f.label}
                          </div>
                          {f.type === 'choice' ? (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {f.options.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={V.pickQuoteAnswer(f.k, opt)}
                                  style={{
                                    border: V.quoteAnswer(f.k) === opt ? '2px solid #171717' : '1px solid #E4E4DF',
                                    borderRadius: 999,
                                    background: V.quoteAnswer(f.k) === opt ? '#171717' : '#FFFFFF',
                                    color: V.quoteAnswer(f.k) === opt ? '#FFFFFF' : '#171717',
                                    padding: '9px 16px',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 700,
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={V.quoteAnswer(f.k)}
                              onChange={V.setQuoteAnswer(f.k)}
                              placeholder={f.ph || ''}
                              style={{
                                marginTop: 8,
                                width: '100%',
                                border: '1px solid #E4E4DF',
                                borderRadius: 14,
                                background: '#F7F7F5',
                                padding: '11px 14px',
                                fontFamily: SANS,
                                fontSize: 14,
                                color: '#171717',
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={V.quoteNextStep}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {V.quoteStep === 5 && (
                  <>
                    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                          Your name
                        </div>
                        <input
                          type="text"
                          value={V.quoteContactName}
                          onChange={V.setQuoteContactName}
                          placeholder="Full name"
                          style={{
                            marginTop: 8,
                            width: '100%',
                            border: '1px solid #E4E4DF',
                            borderRadius: 14,
                            background: '#F7F7F5',
                            padding: '11px 14px',
                            fontFamily: SANS,
                            fontSize: 14,
                            color: '#171717',
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                          Email
                        </div>
                        <input
                          type="email"
                          value={V.quoteContactEmail}
                          onChange={V.setQuoteContactEmail}
                          placeholder="you@organisation.tt"
                          style={{
                            marginTop: 8,
                            width: '100%',
                            border: '1px solid #E4E4DF',
                            borderRadius: 14,
                            background: '#F7F7F5',
                            padding: '11px 14px',
                            fontFamily: SANS,
                            fontSize: 14,
                            color: '#171717',
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                          Phone number (optional)
                        </div>
                        <input
                          type="tel"
                          value={V.quoteContactPhone}
                          onChange={V.setQuoteContactPhone}
                          placeholder="e.g. 868 123 4567"
                          style={{
                            marginTop: 8,
                            width: '100%',
                            border: '1px solid #E4E4DF',
                            borderRadius: 14,
                            background: '#F7F7F5',
                            padding: '11px 14px',
                            fontFamily: SANS,
                            fontSize: 14,
                            color: '#171717',
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={V.quoteNextStep}
                      disabled={!V.quoteStep5Valid}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: '#171717',
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.quoteStep5Valid ? 'pointer' : 'not-allowed',
                        opacity: V.quoteStep5Valid ? 1 : 0.4,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Continue →
                    </button>
                  </>
                )}

                {V.quoteStep === 6 && (
                  <>
                    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Event</div>
                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>{V.quoteEventLabel}</div>
                      </div>
                      <div style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Date</div>
                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>{V.quoteEventDate}</div>
                      </div>
                      <div style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Venue</div>
                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>{V.quoteVenue}</div>
                      </div>
                      {V.quoteReviewAnswers.map((r) => (
                        <div key={r.key} style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>{r.label}</div>
                          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>{r.value}</div>
                        </div>
                      ))}
                      <div style={{ borderRadius: 16, background: '#F7F7F5', padding: '14px 16px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>Contact</div>
                        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600 }}>
                          {V.quoteContactName} · {V.quoteContactEmail}
                          {V.quoteContactPhone ? ' · ' + V.quoteContactPhone : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={V.submitQuote}
                      disabled={V.quoteSubmitting}
                      style={{
                        marginTop: 22,
                        width: '100%',
                        border: 0,
                        borderRadius: 999,
                        background: ACCENT,
                        color: '#FFFFFF',
                        padding: '15px 26px',
                        cursor: V.quoteSubmitting ? 'not-allowed' : 'pointer',
                        opacity: V.quoteSubmitting ? 0.6 : 1,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {V.quoteSubmitting ? 'Sending…' : 'Send request →'}
                    </button>
                    {V.quoteSubmitError && (
                      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: '#B3261E' }}>{V.quoteSubmitError}</div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {V.promoPlanOpen && (
        <div
          onClick={V.closePromoPlan}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(23,23,23,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 28,
              padding: isMobile ? 20 : 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 800 }}>
                {V.promoPlanSent ? "You're on the list" : V.promoPlan.name}
              </h2>
              <button
                onClick={V.closePromoPlan}
                aria-label="Close"
                style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6E6E6E', padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {V.promoPlanSent ? (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  Thanks — we'll reach out within one business day to get {V.promoPlan.name} set up and live.
                </p>
                <button
                  onClick={V.closePromoPlan}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: '#171717',
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: '#4A4A4A' }}>
                  {V.promoPlan.price}
                  {V.promoPlan.period ? ' ' + V.promoPlan.period : ''}. Tell us about your business and we'll follow up to set it up.
                </p>

                <label style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                    Business name
                  </span>
                  <input
                    type="text"
                    value={V.promoPlanNameInput}
                    onChange={V.setPromoPlanName}
                    placeholder="Cocoa Pod Catering"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>
                <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={V.promoPlanEmailInput}
                    onChange={V.setPromoPlanEmail}
                    placeholder="bookings@yourbusiness.tt"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>
                <label style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A9A9A', fontWeight: 700 }}>
                    WhatsApp or phone (optional)
                  </span>
                  <input
                    type="tel"
                    value={V.promoPlanPhoneInput}
                    onChange={V.setPromoPlanPhone}
                    placeholder="868 000 0000"
                    style={{ border: '1px solid #E4E4DF', borderRadius: 14, background: '#F7F7F5', padding: '12px 14px', fontFamily: SANS, fontSize: 15, color: '#171717' }}
                  />
                </label>
                <label style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} aria-hidden="true">
                  Company
                  <input type="text" tabIndex={-1} autoComplete="off" value={V.promoPlanCompanyInput} onChange={V.setPromoPlanCompany} />
                </label>

                <button
                  onClick={V.submitPromoPlan}
                  disabled={V.promoPlanSubmitDisabled}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    border: 0,
                    borderRadius: 999,
                    background: PROMO_ACCENT,
                    color: '#FFFFFF',
                    padding: '15px 26px',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    opacity: V.promoPlanSubmitDisabled ? 0.5 : 1,
                  }}
                >
                  {V.promoPlanSubmitting ? 'Sending…' : V.promoPlan.cta}
                </button>
                {V.promoPlanError && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#B3261E' }}>{V.promoPlanError}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>

    <footer style={{ marginTop: isMobile ? 56 : 80, background: '#171717', color: '#FFFFFF' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '40px 16px 28px' : '56px 28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr 1fr', gap: isMobile ? 32 : 40 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>Eventory</div>
            <p style={{ margin: '10px 0 0', maxWidth: 320, fontSize: 14, lineHeight: 1.55, color: '#A8A8A8' }}>
              Discovery and sourcing for events in Trinidad &amp; Tobago. Browse vendors, compare what they offer,
              and message them directly.
            </p>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                aria-label="Instagram"
                title="Instagram"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </button>
              <button
                aria-label="Facebook"
                title="Facebook"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </button>
              <button
                aria-label="X"
                title="X"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #2B2B2B',
                  borderRadius: 999,
                  background: 'transparent',
                  color: '#D7D7D2',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6E6E', fontWeight: 700 }}>
              Explore
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={V.goSuppliers}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Discover Vendors
              </button>
              <button
                onClick={V.goAbout}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                About
              </button>
              <button
                onClick={V.goAccount}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                {V.isSignedIn ? 'Dashboard' : 'Sign in'}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E6E6E', fontWeight: 700 }}>
              Vendors
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={V.goVendorOnboarding}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Join Eventory
              </button>
              <button
                onClick={V.goVendorHowItWorks}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                How It Works
              </button>
              <button
                onClick={V.goVendorSignIn}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Vendor sign in
              </button>
              <button
                onClick={V.goSpotlight}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#D7D7D2' }}
              >
                Spotlight
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: isMobile ? 32 : 44,
            paddingTop: 20,
            borderTop: '1px solid #2B2B2B',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 10 : 18 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#6E6E6E' }}>
              © {new Date().getFullYear()} Eventory. All rights reserved.
            </div>
            <button
              onClick={V.goTerms}
              style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12, color: '#8A8A8A', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Terms of Service
            </button>
            <button
              onClick={V.goPrivacy}
              style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 12, color: '#8A8A8A', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Privacy Policy
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#6E6E6E' }}>
            Eventory never processes payment. You deal directly with each vendor.
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
