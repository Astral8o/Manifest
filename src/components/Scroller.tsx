import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * A sideways-scrolling row with ‹ › arrows for mouse users.
 * Arrows only show on devices with a mouse (phones keep plain swiping),
 * hide at either end, and the edge with more to see gets a soft fade.
 */
export function Scroller({ className, style, children, small, label, role }: {
  className: string; style?: CSSProperties; children: ReactNode; small?: boolean; label?: string; role?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    [...el.children].forEach((c) => ro.observe(c));
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [children]);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const cls = ['scroller', small && 'scroller-sm', !edge.start && 'more-start', !edge.end && 'more-end'].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div ref={ref} className={className} style={style} role={role} aria-label={label}>{children}</div>
      {!edge.start && <button type="button" className="sa sa-prev" aria-label="Scroll left" tabIndex={-1} onClick={() => go(-1)}>‹</button>}
      {!edge.end && <button type="button" className="sa sa-next" aria-label="Scroll right" tabIndex={-1} onClick={() => go(1)}>›</button>}
    </div>
  );
}
