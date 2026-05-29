'use client';
import { useEffect } from 'react';

type Gtag = (...args: any[]) => void;

function brandFromHref(href: string): string {
  try {
    const u = new URL(href);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    if (h.includes('amazon.')) return 'Amazon';
    if (h.includes('bhphotovideo')) return "B&H";
    if (h.includes('crutchfield')) return 'Crutchfield';
    if (h.includes('monoprice')) return 'Monoprice';
    if (h.includes('anker')) return 'Anker';
    return h;
  } catch {
    return 'external';
  }
}

export default function AffiliateClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
      if (!a) return;

      const href = a.getAttribute('href') ?? '';
      const rel = (a.getAttribute('rel') ?? '').toLowerCase();

      const isPaid =
        rel.includes('sponsored') ||
        a.dataset.paidLink === '1' ||
        /amazon\./i.test(href) ||
        /bhphotovideo\.com/i.test(href) ||
        /crutchfield\.com/i.test(href) ||
        /monoprice\.com/i.test(href) ||
        /anker\.com/i.test(href);

      if (!isPaid) return;

      const brand = a.dataset.brand || brandFromHref(href);
      const gtag = (window as any).gtag as Gtag | undefined;
      if (typeof gtag === 'function') {
        gtag('event', 'affiliate_click', {
          event_category: 'engagement',
          brand,
          destination: href,
        });
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
