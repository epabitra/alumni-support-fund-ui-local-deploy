import { useEffect } from 'react';

/** Header texts that mean "this column holds buttons", so the card shows no label for it */
const ACTION_HEADERS = new Set(['', 'actions', 'action', 'receipt']);

/** Phones always get cards; wider screens only when a table does not fit */
const PHONE_MAX = 720;

function headerTexts(table: HTMLTableElement): string[] {
  const row = table.tHead?.rows[table.tHead.rows.length - 1];
  if (!row) return [];
  const out: string[] = [];
  for (const th of Array.from(row.cells)) {
    // textContent works while the header is hidden; drop sort arrows
    const text = (th.textContent || '').replace(/[↕▲▼]/g, '').replace(/\s+/g, ' ').trim();
    const span = th.colSpan || 1;
    for (let i = 0; i < span; i++) out.push(i === 0 ? text : '');
  }
  return out;
}

function label(table: HTMLTableElement) {
  const heads = headerTexts(table);
  const rows = [
    ...Array.from(table.tBodies).flatMap((b) => Array.from(b.rows)),
    ...(table.tFoot ? Array.from(table.tFoot.rows) : [])
  ];
  for (const tr of rows) {
    let col = 0;
    for (const cell of Array.from(tr.cells)) {
      const text = heads[col] ?? '';
      const value = ACTION_HEADERS.has(text.toLowerCase()) ? '' : text;
      if (cell.getAttribute('data-label') !== value) cell.setAttribute('data-label', value);
      col += cell.colSpan || 1;
    }
  }
}

function setCards(table: HTMLTableElement, on: boolean) {
  table.classList.toggle('rt-cards', on);
  table.parentElement?.classList.toggle('rt-cards-wrap', on);
}

/**
 * Turns any table into a list of cards when it would not fit (always on phones), so nothing scrolls sideways.
 * Each cell gets its column name as a data-label for the card (see mobile-app.css). Runs again when the page
 * changes or the window is resized; tables need no changes of their own. A table can opt out with data-no-cards.
 */
function update() {
  const tables = Array.from(document.querySelectorAll('table')).filter((t) => (t as HTMLTableElement).dataset.noCards === undefined) as HTMLTableElement[];
  const phone = window.innerWidth <= PHONE_MAX;
  tables.forEach((t) => {
    t.classList.add('rt');
    label(t);
  });
  if (phone) {
    tables.forEach((t) => setCards(t, true));
    return;
  }
  // Measure every table at its natural width first, then switch, so the page is laid out only twice
  tables.forEach((t) => setCards(t, false));
  const tooWide = tables.map((t) => {
    const box = t.parentElement;
    const width = t.scrollWidth;
    const room = box ? box.clientWidth : window.innerWidth;
    return width > room + 2 || t.getBoundingClientRect().right > window.innerWidth + 2;
  });
  tables.forEach((t, i) => setCards(t, tooWide[i]));
}

export default function ResponsiveTables() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    // Only child-list and text changes are watched, so the classes and labels set here do not trigger another run
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
