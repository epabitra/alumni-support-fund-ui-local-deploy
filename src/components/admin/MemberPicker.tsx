import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { searchMembers, type AdminUserDTO } from '../../app/modules/auth/core/_user_requests';
import { formatRupees } from './amountWords';
import './admin-payments.css';

export function memberName(u: Pick<AdminUserDTO, 'firstName' | 'lastName' | 'email'>): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

/** "+91 98765 43210" for Indian numbers, as stored otherwise */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}

/** Bold the part of `text` that matches what was typed */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
};

export interface MemberPickerHandle {
  focus: () => void;
}

/**
 * Find a member by name, mobile or email (suggestions as you type, arrow keys and Enter to choose).
 * Once chosen, shows the member's card with a Change button.
 */
export const MemberPicker = forwardRef<MemberPickerHandle, {
  value: AdminUserDTO | null;
  onChange: (member: AdminUserDTO | null) => void;
  disabled?: boolean;
  inputId?: string;
  invalid?: boolean;
}>(({ value, onChange, disabled, inputId, invalid }, ref) => {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState<AdminUserDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);

  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }));

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++request.current;
    setLoading(true);
    const t = setTimeout(() => {
      searchMembers(q)
        .then((list) => { if (id === request.current) { setResults(list); setActive(0); setError(''); } })
        .catch(() => id === request.current && setError('Could not search members. Please try again.'))
        .finally(() => id === request.current && setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [text]);

  const choose = (m: AdminUserDTO) => {
    onChange(m);
    setText('');
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  if (value) {
    const name = memberName(value);
    return (
      <div className="mp-selected" aria-live="polite">
        <span className="mp-avatar" aria-hidden>{initials(name)}</span>
        <div className="mp-selected-text">
          <strong>{name}</strong>
          <span>{value.email}{value.phone ? ` · ${formatPhone(value.phone)}` : ''}</span>
          {value.totalContributed != null && (
            <small>
              {value.contributionCount
                ? `Has given ${formatRupees(value.totalContributed)} in ${value.contributionCount} payment${value.contributionCount === 1 ? '' : 's'}`
                : 'No payments yet'}
              {!value.activated && ' · email not verified'}
            </small>
          )}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={disabled}
          onClick={() => { onChange(null); setTimeout(() => input.current?.focus(), 0); }}>Change</button>
      </div>
    );
  }

  const q = text.trim();
  const showList = open && q.length >= 2;
  return (
    <div className="mp">
      <input
        ref={input}
        id={inputId}
        className={`form-input mp-input ${invalid ? 'invalid' : ''}`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        placeholder="Search name, mobile or email"
        autoComplete="off"
        value={text}
        disabled={disabled}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="mp-list" id={listId} role="listbox">
          {loading && results.length === 0 && <li className="mp-status">Searching…</li>}
          {error && <li className="mp-status error">{error}</li>}
          {!loading && !error && results.length === 0 && (
            <li className="mp-status">No member found for “{q}”. Try part of the name or the last digits of the mobile.</li>
          )}
          {results.map((m, i) => {
            const name = memberName(m);
            return (
              <li
                key={m.id ?? m.email}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`mp-option ${i === active ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); choose(m); }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="mp-avatar" aria-hidden>{initials(name)}</span>
                <span className="mp-option-text">
                  <strong><Highlight text={name} query={q} /></strong>
                  <small>
                    <Highlight text={m.email} query={q} />
                    {m.phone && <> · <Highlight text={formatPhone(m.phone)} query={q} /></>}
                  </small>
                </span>
                {!m.activated && <span className="mp-tag">not verified</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
MemberPicker.displayName = 'MemberPicker';
