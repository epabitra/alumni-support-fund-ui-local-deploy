import React, { useEffect, useId, useState } from 'react';
import './DataTable.css';

export type SortDir = 'asc' | 'desc';

/** State of a server-side table: paging, search, date range and sort */
export interface TableQuery {
  page: number;
  size: number;
  search: string;
  /** yyyy-MM-dd or '' */
  from: string;
  to: string;
  sortBy: string;
  sortDir: SortDir;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Returns `value` once it has stopped changing for `delay` ms */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Quick date ranges; the financial year runs April to March */
function presetRange(preset: string): { from: string; to: string } {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (preset) {
    case 'this-month':
      return { from: iso(new Date(y, m, 1)), to: iso(today) };
    case 'last-month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'last-3-months':
      return { from: iso(new Date(y, m - 2, 1)), to: iso(today) };
    case 'this-fy': {
      const fyStart = m >= 3 ? y : y - 1;
      return { from: iso(new Date(fyStart, 3, 1)), to: iso(today) };
    }
    case 'last-fy': {
      const fyStart = (m >= 3 ? y : y - 1) - 1;
      return { from: iso(new Date(fyStart, 3, 1)), to: iso(new Date(fyStart + 1, 2, 31)) };
    }
    default:
      return { from: '', to: '' };
  }
}

interface DataTableToolbarProps {
  query: TableQuery;
  onChange: (patch: Partial<TableQuery>) => void;
  searchPlaceholder: string;
  /** Extra filter controls (e.g. a select), rendered after the dates */
  children?: React.ReactNode;
  /** True when a filter besides the defaults is set (shows "Clear filters") */
  hasExtraFilters?: boolean;
  onClear: () => void;
}

/** Search box, date range with presets and a clear button. Changing any filter returns to page 1. */
export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  query,
  onChange,
  searchPlaceholder,
  children,
  hasExtraFilters,
  onClear
}) => {
  const id = useId();
  const [searchInput, setSearchInput] = useState(query.search);
  const debouncedSearch = useDebounced(searchInput);

  useEffect(() => {
    if (debouncedSearch !== query.search) onChange({ search: debouncedSearch, page: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const dateError = query.from && query.to && query.from > query.to ? "'From' date must be on or before 'To' date" : '';
  const filtered = !!(query.search || query.from || query.to || hasExtraFilters);

  return (
    <div className="dt-toolbar">
      <div className="dt-field dt-search">
        <label className="dt-label" htmlFor={`${id}-search`}>Search</label>
        <input
          id={`${id}-search`}
          type="search"
          className="dt-input custom-input"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onChange({ search: searchInput, page: 0 })}
        />
      </div>
      <div className="dt-field">
        <label className="dt-label">Period</label>
        <select
          className="dt-input custom-select"
          value=""
          onChange={(e) => e.target.value && onChange({ ...presetRange(e.target.value), page: 0 })}
          aria-label="Quick date range"
        >
          <option value="">Quick range…</option>
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="last-3-months">Last 3 months</option>
          <option value="this-fy">This financial year</option>
          <option value="last-fy">Last financial year</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div className="dt-field">
        <label className="dt-label">From</label>
        <input
          type="date"
          className="dt-input custom-input"
          value={query.from}
          max={query.to || undefined}
          onChange={(e) => onChange({ from: e.target.value, page: 0 })}
        />
      </div>
      <div className="dt-field">
        <label className="dt-label">To</label>
        <input
          type="date"
          className="dt-input custom-input"
          value={query.to}
          min={query.from || undefined}
          onChange={(e) => onChange({ to: e.target.value, page: 0 })}
        />
      </div>
      {children}
      {filtered && (
        <div className="dt-field dt-clear">
          <button type="button" className="dt-clear-btn" onClick={() => { setSearchInput(''); onClear(); }}>
            Clear filters
          </button>
        </div>
      )}
      {dateError && <div className="dt-error">{dateError}</div>}
    </div>
  );
};

interface SortHeaderProps {
  label: string;
  field: string;
  query: TableQuery;
  onSort: (field: string, dir: SortDir) => void;
  /** Direction used on the first click (amounts and dates usually start with highest / newest) */
  firstDir?: SortDir;
}

/** Column header that sorts the table; clicking again reverses the order */
export const SortHeader: React.FC<SortHeaderProps> = ({ label, field, query, onSort, firstDir = 'desc' }) => {
  const active = query.sortBy === field;
  const nextDir: SortDir = active ? (query.sortDir === 'asc' ? 'desc' : 'asc') : firstDir;
  return (
    <th aria-sort={active ? (query.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`dt-sort ${active ? 'active' : ''}`} onClick={() => onSort(field, nextDir)}>
        <span>{label}</span>
        <span className="dt-sort-icon" aria-hidden>{active ? (query.sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
};

interface DataTablePaginationProps {
  query: TableQuery;
  totalElements: number;
  totalPages: number;
  loading?: boolean;
  onChange: (patch: Partial<TableQuery>) => void;
}

/** "Showing x–y of z", rows per page and first / previous / next / last */
export const DataTablePagination: React.FC<DataTablePaginationProps> = ({ query, totalElements, totalPages, loading, onChange }) => {
  const { page, size } = query;
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);
  const last = Math.max(totalPages - 1, 0);
  return (
    <div className="dt-pagination">
      <span className="dt-pagination-info">
        {totalElements === 0 ? 'No results' : `Showing ${start}–${end} of ${totalElements}`}
      </span>
      <div className="dt-pagination-controls">
        <label className="dt-page-size">
          Rows
          <select className="dt-input custom-select" value={size} onChange={(e) => onChange({ size: Number(e.target.value), page: 0 })}>
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => onChange({ page: 0 })} disabled={page === 0 || loading} aria-label="First page">«</button>
        <button type="button" onClick={() => onChange({ page: page - 1 })} disabled={page === 0 || loading}>Previous</button>
        <span className="dt-page-number">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
        <button type="button" onClick={() => onChange({ page: page + 1 })} disabled={page >= last || loading}>Next</button>
        <button type="button" onClick={() => onChange({ page: last })} disabled={page >= last || loading} aria-label="Last page">»</button>
      </div>
    </div>
  );
};
