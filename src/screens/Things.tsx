import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DealImage } from '../components/DealCard';
import { ACTIVE_COLLS, INK, LILAC, SUN, TODAY, inColl, type Deal } from '../data';
import { useStore } from '../store';

/*
 * Things to Do, as a calendar.
 * Pattern: a compact month grid for picking dates (dots mark busy days) beside an
 * agenda list grouped by day. Quick date chips cover the common asks
 * (today, this weekend, the next 7 days) and topic chips narrow by type.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(d.getDate() + n); return x; };
const same = (a: Date, b: Date) => +a === +b;
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOf = (d: Deal) => d.eventDate!;
const endOf = (d: Deal) => d.eventEnd ?? d.eventDate!;

/** The coming Friday to Sunday (or the rest of this one, if it's the weekend now). */
const WEEKEND = (() => {
  const dow = TODAY.getDay();
  const fri = addDays(TODAY, dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow);
  return { from: fri < TODAY ? TODAY : fri, to: addDays(fri, 2) };
})();

type Range = { label: string; from: Date; to: Date } | null;
const QUICK: { k: string; label: string; range: () => Range }[] = [
  { k: 'all', label: 'All dates', range: () => null },
  { k: 'today', label: 'Today', range: () => ({ label: 'Today', from: TODAY, to: TODAY }) },
  { k: 'tomorrow', label: 'Tomorrow', range: () => ({ label: 'Tomorrow', from: addDays(TODAY, 1), to: addDays(TODAY, 1) }) },
  { k: 'weekend', label: 'This weekend', range: () => ({ label: 'This weekend', from: WEEKEND.from, to: WEEKEND.to }) },
  { k: 'week', label: 'Next 7 days', range: () => ({ label: 'The next 7 days', from: TODAY, to: addDays(TODAY, 6) }) },
];

const overlaps = (d: Deal, from: Date, to: Date) => +startOf(d) <= +to && +endOf(d) >= +from;
const relDay = (d: Date) => (same(d, TODAY) ? 'Today' : same(d, addDays(TODAY, 1)) ? 'Tomorrow' : '');
const countOf = (k: Parameters<typeof inColl>[0]) => inColl(k).filter((d) => d.eventDate).length;

export function Things() {
  const { coll: collKey, setColl, openDeal, isMobile } = useStore();
  // "This Weekend" is a date, not a topic, so links to it open the weekend range.
  const [quick, setQuick] = useState<string>(collKey === 'weekend' ? 'weekend' : 'all');
  const [day, setDay] = useState<Date | null>(null);
  const topics = ACTIVE_COLLS.filter((c) => c.k !== 'weekend');
  const topic = topics.find((c) => c.k === collKey) ?? topics.find((c) => c.k === 'all') ?? topics[0];

  const events = useMemo(() => inColl(topic.k).filter((d) => d.eventDate), [topic.k]);
  const range: Range = day
    ? { label: `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}`, from: day, to: day }
    : QUICK.find((q) => q.k === quick)!.range();
  const rangeFrom = range ? +range.from : 0;
  const shown = useMemo(() => (range ? events.filter((d) => overlaps(d, range.from, range.to)) : events), [events, rangeFrom, range?.to && +range.to]); // eslint-disable-line react-hooks/exhaustive-deps

  // The month on screen follows the chosen dates; otherwise it starts on this month.
  const lastEvent = events.reduce((m, d) => (+endOf(d) > +m ? endOf(d) : m), TODAY);
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  useEffect(() => {
    if (range) setMonth(new Date(range.from.getFullYear(), range.from.getMonth(), 1));
  }, [rangeFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  const listRef = useRef<HTMLDivElement>(null);
  const pickDay = (d: Date) => {
    if (day && same(d, day)) { setDay(null); return; }
    setDay(d);
    if (isMobile) setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  const pickQuick = (k: string) => { setQuick(k); setDay(null); };

  // Group by day. Events that run over several days sit under the first day in view.
  const groups = useMemo(() => {
    const from = range?.from ?? TODAY;
    const m = new Map<string, { date: Date; items: Deal[] }>();
    shown.forEach((d) => {
      const at = +startOf(d) < +from ? from : startOf(d);
      const g = m.get(key(at)) ?? { date: at, items: [] };
      g.items.push(d);
      m.set(key(at), g);
    });
    return [...m.values()].sort((a, b) => +a.date - +b.date);
  }, [shown, rangeFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <section style={{ background: LILAC, borderBottom: `2px solid ${INK}` }}>
        <div className="wrap" style={{ paddingTop: 28, paddingBottom: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="eyebrow">Events, nights out and days out</span>
          <h1 className="display" style={{ fontSize: 'clamp(48px,8vw,96px)', lineHeight: 0.85 }}>Things to do</h1>
          <p className="hide-sm" style={{ margin: 0, fontSize: 17, lineHeight: 1.45, maxWidth: 560, fontWeight: 500 }}>
            Parang, concerts, tours and parties across Trinidad &amp; Tobago. Pick a date, or see what’s coming up.
          </p>
          <div className="chip-scroll" role="group" aria-label="When">
            {QUICK.map((q) => (
              <button key={q.k} type="button" className="qchip" aria-pressed={!day && quick === q.k} onClick={() => pickQuick(q.k)}>{q.label}</button>
            ))}
          </div>
          <div className="chip-scroll" role="group" aria-label="Type of event">
            {topics.map((c) => (
              <button key={c.k} type="button" className="qchip" aria-pressed={c.k === topic.k} onClick={() => setColl(c.k)}>
                {c.k === 'all' ? 'Everything' : c.label} <span className="n">{countOf(c.k)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap things-layout" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <aside className="things-cal">
          <MonthGrid month={month} setMonth={setMonth} events={events} range={range} picked={day} onPick={pickDay} last={lastEvent} big={!isMobile} onOpen={openDeal} />
        </aside>

        <div ref={listRef} style={{ minWidth: 0, scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <h2 className="display" style={{ fontSize: 'clamp(32px,5vw,52px)', lineHeight: 0.95 }}>{range ? range.label : topic.k === 'all' ? 'Coming up' : topic.label}</h2>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{shown.length} {shown.length === 1 ? 'event' : 'events'}</span>
            {range && <button type="button" className="link-btn" onClick={() => pickQuick('all')}>Show all dates</button>}
          </div>
          {topic.k !== 'all' && <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 15 }}>{topic.intro}</p>}

          {groups.length === 0 && (
            <div style={{ border: `2px dashed ${INK}`, borderRadius: 20, padding: 28, marginTop: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <span className="display" style={{ fontSize: 28 }}>Nothing listed yet</span>
              <span style={{ fontSize: 15, color: 'var(--muted)' }}>Try another date, or see everything coming up.</span>
              <button type="button" className="pill btn-dark" onClick={() => { pickQuick('all'); setColl('all'); }} style={{ minHeight: 46, padding: '0 20px' }}>See everything</button>
            </div>
          )}

          {groups.map((g) => (
            <section key={key(g.date)} aria-label={`${DAYS[g.date.getDay()]} ${g.date.getDate()} ${MONTHS[g.date.getMonth()]}`}>
              {!day && <div className="day-head">
                <span className="day-head-num">{g.date.getDate()}</span>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{DAYS[g.date.getDay()]}{relDay(g.date) && <span className="day-head-tag">{relDay(g.date)}</span>}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{MONTHS[g.date.getMonth()]} {g.date.getFullYear()} · {g.items.length} {g.items.length === 1 ? 'event' : 'events'}</span>
                </span>
              </div>}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.items.map((t) => <EventRow key={t.id} t={t} onOpen={() => openDeal(t.id)} />)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function EventRow({ t, onOpen }: { t: Deal; onOpen: () => void }) {
  const e = endOf(t);
  const multi = +e !== +startOf(t);
  const meta = [t.eventTime, multi && `Until ${DAYS[e.getDay()].slice(0, 3)} ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)}`].filter(Boolean).join(' · ');
  return (
    <li>
      <button type="button" className="event-row" onClick={onOpen}>
        <span className="event-row-img"><DealImage d={t} compact /></span>
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="mono" style={{ fontSize: 11.5, letterSpacing: '.04em', color: 'var(--muted-2)' }}>{meta || t.catLabel}</span>
          <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{t.title}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{t.area}</span>
          <span className="clamp-2 event-row-blurb" style={{ fontSize: 14, lineHeight: 1.45, color: '#3A342E', textWrap: 'pretty' } as CSSProperties}>{t.blurb}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 20 }}>{t.priceLabel}</span>
            <span className="event-row-cta">{t.action} →</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function MonthGrid({ month, setMonth, events, range, picked, onPick, last, big, onOpen }: {
  month: Date; setMonth: (d: Date) => void; events: Deal[]; range: Range; picked: Date | null; onPick: (d: Date) => void; last: Date;
  big: boolean; onOpen: (id: string) => void;
}) {
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  // Skip weeks that are already over, so the useful days sit at the top.
  // (On a full-size calendar, keep the whole month, like a wall calendar.)
  while (!big && cells.length > 7 && cells.slice(0, 7).every((c) => !c || +c < +TODAY)) cells.splice(0, 7);
  const canBack = +first > +new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const canFwd = +new Date(y, m + 1, 1) <= +last;
  const on = (d: Date) => events.filter((e) => overlaps(e, d, d));
  const inMonth = events.filter((e) => overlaps(e, first, new Date(y, m, days))).length;

  return (
    <div className="cal">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" className="cal-nav" aria-label="Previous month" disabled={!canBack} onClick={() => setMonth(new Date(y, m - 1, 1))}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="display" style={{ fontSize: big ? 40 : 26, lineHeight: 1 }}>{MONTHS[m]} {y}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginTop: 2 }}>{inMonth} {inMonth === 1 ? 'event' : 'events'}</div>
        </div>
        <button type="button" className="cal-nav" aria-label="Next month" disabled={!canFwd} onClick={() => setMonth(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className={big ? 'cal-grid big' : 'cal-grid'}>
        {(big ? DOW_LONG : DOW).map((d, i) => <span key={i} className="cal-dow" aria-hidden="true">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`x${i}`} />;
          const list = on(d);
          const past = +d < +TODAY;
          const sel = picked ? same(d, picked) : false;
          const inRange = !picked && !!range && +d >= +range.from && +d <= +range.to;
          const label = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[m]}: ${list.length ? `${list.length} ${list.length === 1 ? 'event' : 'events'}` : 'nothing listed'}`;
          const cls = ['cal-day', past && 'past', list.length && 'busy', sel && 'sel', inRange && 'range', same(d, TODAY) && 'today'].filter(Boolean).join(' ');
          if (big) {
            return (
              <div key={key(d)} className={cls + ' big'} onClick={() => !past && list.length && onPick(d)}>
                <button type="button" className="cal-num" aria-label={label} aria-pressed={sel} disabled={past || !list.length} onClick={(e) => { e.stopPropagation(); onPick(d); }}>
                  {d.getDate()}{same(d, TODAY) && <span className="cal-today">Today</span>}
                </button>
                {list.slice(0, 2).map((e) => (
                  <button key={e.id} type="button" className="cal-ev" onClick={(ev) => { ev.stopPropagation(); onOpen(e.id); }} title={e.title}>
                    <span className="cal-ev-img"><DealImage d={e} compact /></span>
                    <span className="cal-ev-t">{e.title}</span>
                  </button>
                ))}
                {list.length > 2 && <button type="button" className="cal-more" onClick={(e) => { e.stopPropagation(); onPick(d); }}>+{list.length - 2} more</button>}
              </div>
            );
          }
          return (
            <button key={key(d)} type="button" aria-label={label} aria-pressed={sel}
              className={cls}
              disabled={past || !list.length} onClick={() => onPick(d)}>
              <span>{d.getDate()}</span>
              {list.length > 0 && (
                <span className="cal-dots" aria-hidden="true">
                  {list.slice(0, 3).map((e) => <i key={e.id} style={{ background: sel ? SUN : e.color }} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '10px 2px 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>{big ? 'Click a day to see everything on, or an event to open it.' : 'Dots mark days with events. Tap a day to see what’s on.'}</p>
    </div>
  );
}

