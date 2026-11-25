import type { Deal } from './data';

/*
 * Google Analytics events, built for per-business reports.
 * Every deal event carries the same fields (business, deal, category, type)
 * so one report can be filtered to a single business.
 * Nothing here identifies a person.
 */

type Params = Record<string, string | number>;

export function track(name: string, params: Params = {}) {
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (g) g('event', name, params);
}

export const dealParams = (d: Deal): Params => ({
  business: d.biz,
  deal_id: d.id,
  deal_title: d.title,
  category: d.cat,
  listing_type: d.eventDate ? 'event' : 'deal',
  ...(Number.isFinite(d.price) ? { price: d.price } : {}),
});

export const trackDeal = (name: string, d: Deal, extra: Params = {}) => track(name, { ...dealParams(d), ...extra });
