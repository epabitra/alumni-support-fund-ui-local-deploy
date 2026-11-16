import React from 'react';

// iPhone / iPad Safari: draw our own hint and icon (it shows neither for an empty date)
if (typeof document !== 'undefined' && typeof CSS !== 'undefined' && CSS.supports('-webkit-touch-callout', 'none')) {
  document.documentElement.classList.add('ios-dates');
}

/**
 * A date field that says "Select date" while empty. iPhone Safari shows an empty date box with no text or icon,
 * so the hint and a calendar icon are drawn on top there (other browsers already show their own; see mobile-app.css).
 * Takes the same props as <input>; the type is always "date".
 */
const DateInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { hint?: string }>(
  ({ hint = 'Select date', value, style, ...rest }, ref) => {
    const empty = value === undefined || value === null || value === '';
    return (
      <span className={`date-input ${empty ? 'is-empty' : ''}`} style={style}>
        <input ref={ref} type="date" value={value ?? ''} {...rest} />
        <span className="date-input-hint" aria-hidden>{hint}</span>
        <svg className="date-input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9.5h18M8 3v3M16 3v3" />
        </svg>
      </span>
    );
  }
);
DateInput.displayName = 'DateInput';

export default DateInput;
