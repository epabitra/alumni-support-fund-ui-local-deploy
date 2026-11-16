import { useEffect } from 'react';

/** Header texts that mean "this column holds buttons", so the card shows no label for it */
const ACTION_HEADERS = new Set(['', 'actions', 'action', 'receipt']);

/** Phones always get cards; wider screens only when a table does not fit */
const PHONE_MAX = 720;

/** Without data-card-keys, these columns stay visible on a collapsed card */
const DEFAULT_KEYS = /^(amount|total|total cost|status)$/i;

/*
 * Everything here is marked with data- attributes, never classes: React rewrites a class when it re-renders,
 * but leaves attributes it does not own alone.
 *   table[data-rt]          seen by this script
 *   table[data-rt-cards]    shown as cards; its parent gets [data-rt-wrap]
 *   td[data-label]          column name shown on the card
 *   td[data-rt="title|key|detail|detail-first"]
 *   tr[data-rt-more]        has hidden details; tap to open ([data-rt-open])
 */

const clean = (s: string) => s.replace(/[↕▲▼]/g, '').replace(/\s+/g, ' ').trim();

function headerTexts(table: HTMLTableElement): string[] {
  const row = table.tHead?.rows[table.tHead.rows.length - 1];
  if (!row) return [];
  const out: string[] = [];
  for (const th of Array.from(row.cells)) {
    // textContent works while the header is hidden
    const text = clean(th.textContent || '');
    const span = th.colSpan || 1;
    for (let i = 0; i < span; i++) out.push(i === 0 ? text : '');
  }
  return out;
}

function setAttr(el: Element, name: string, value: string | null) {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}

function prepare(table: HTMLTableElement) {
  setAttr(table, 'data-rt', '');
  const heads = headerTexts(table);
  const wanted = (table.dataset.cardKeys || '').split(',').map((k) => clean(k).toLowerCase()).filter(Boolean);
  const isKey = (head: string) => (wanted.length ? wanted.includes(head.toLowerCase()) : DEFAULT_KEYS.test(head));

  for (const body of Array.from(table.tBodies)) {
    for (const tr of Array.from(body.rows)) {
      const cells = Array.from(tr.cells);
      const single = cells.length === 1 && (cells[0].colSpan || 1) > 1;
      let col = 0;
      let keys = 0;
      let details = 0;
      cells.forEach((cell, i) => {
        const head = heads[col] ?? '';
        setAttr(cell, 'data-label', ACTION_HEADERS.has(head.toLowerCase()) ? '' : head);
        let role: string | null = null;
        if (!single) {
          if (i === 0) role = 'title';
          else if (head && isKey(head) && keys < 2) { role = 'key'; keys++; }
          else if (cell.childNodes.length > 0) { role = details === 0 ? 'detail-first' : 'detail'; details++; }
        }
        setAttr(cell, 'data-rt', role);
        col += cell.colSpan || 1;
      });
      const expandable = !single && details > 0;
      setAttr(tr, 'data-rt-more', expandable ? '' : null);
      setAttr(tr, 'data-rt-keys', expandable ? String(Math.max(1, keys)) : null);
      setAttr(tr, 'tabindex', expandable ? '0' : null);
      setAttr(tr, 'aria-expanded', expandable ? String(tr.hasAttribute('data-rt-open')) : null);
    }
  }
  if (table.tFoot) {
    for (const tr of Array.from(table.tFoot.rows)) {
      let col = 0;
      for (const cell of Array.from(tr.cells)) {
        setAttr(cell, 'data-label', heads[col] ?? '');
        col += cell.colSpan || 1;
      }
    }
  }
}

function setCards(table: HTMLTableElement, on: boolean) {
  setAttr(table, 'data-rt-cards', on ? '' : null);
  if (table.parentElement) setAttr(table.parentElement, 'data-rt-wrap', on ? '' : null);
}

function update() {
  const tables = (Array.from(document.querySelectorAll('table')) as HTMLTableElement[]).filter((t) => t.dataset.noCards === undefined);
  tables.forEach(prepare);
  if (window.innerWidth <= PHONE_MAX) {
    tables.forEach((t) => setCards(t, true));
    return;
  }
  // Measure every table at its natural width first, then switch, so the page is laid out only twice
  tables.forEach((t) => setCards(t, false));
  const tooWide = tables.map((t) => {
    const room = t.parentElement ? t.parentElement.clientWidth : window.innerWidth;
    return t.scrollWidth > room + 2 || t.getBoundingClientRect().right > window.innerWidth + 2;
  });
  tables.forEach((t, i) => setCards(t, tooWide[i]));
}

/** Tap (or Enter / Space) on a collapsed card shows or hides its details; links and buttons inside work as usual */
function toggleFrom(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || el.closest('a, button, input, select, textarea, label, summary, [role="button"]')) return false;
  const tr = el.closest('table[data-rt-cards] tr[data-rt-more]') as HTMLTableRowElement | null;
  if (!tr) return false;
  const open = !tr.hasAttribute('data-rt-open');
  setAttr(tr, 'data-rt-open', open ? '' : null);
  tr.setAttribute('aria-expanded', String(open));
  return true;
}

/**
 * Turns any table into cards when it would not fit (always on phones), so nothing scrolls sideways. A card shows
 * the first column and the table's key columns (data-card-keys="For,Amount"); the rest opens with a tap on +.
 * Runs again when the page changes or the window is resized. A table can opt out with data-no-cards.
 */
export default function ResponsiveTables() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    // Only child-list and text changes are watched, so the attributes set here do not trigger another run
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onClick = (e: MouseEvent) => {
      toggleFrom(e.target);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement)?.matches?.('tr[data-rt-more]') && toggleFrom(e.target)) {
        e.preventDefault();
      }
    };
    window.addEventListener('resize', schedule);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
