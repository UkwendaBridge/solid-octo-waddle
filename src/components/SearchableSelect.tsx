import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  hasError?: boolean;
  disabled?: boolean;
  /**
   * Render the dropdown into document.body, positioned over the trigger.
   * Needed inside a scroll container (.table-wrapper sets overflow-x, which
   * makes overflow-y compute to auto and would clip a normally-positioned
   * panel).
   */
  portal?: boolean;
  /**
   * Turn the trigger itself into a text box: click and type straight away to
   * filter, instead of opening a dropdown with a separate search field.
   */
  editable?: boolean;
}

export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  searchPlaceholder = 'Search...',
  emptyText = 'No matches found',
  hasError = false,
  disabled = false,
  portal = false,
  editable = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [panelRect, setPanelRect] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o =>
      `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(q)
    );
  }, [options, query]);

  // Close when clicking outside. When portalled the panel is not a descendant
  // of the wrapper, so it has to be checked separately or the first click on
  // an option would close the panel before selecting.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = wrapperRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Focus the search box as soon as the panel opens. In editable mode the
  // trigger is itself the text box, so there is nothing extra to focus.
  useEffect(() => {
    if (open && !editable) searchRef.current?.focus();
  }, [open, editable]);

  const syncPanelPosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Rows near the bottom of a long table have no room below, so flip above
    // the trigger when that is the roomier side.
    const panelH = panelRef.current?.offsetHeight ?? 300;
    const spaceBelow = window.innerHeight - r.bottom;
    const flipUp = spaceBelow < panelH + 8 && r.top > spaceBelow;
    setPanelRect({
      top: flipUp ? Math.max(8, r.top - panelH - 4) : r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }, []);

  // A fixed-position panel does not travel with the trigger, so re-measure on
  // any scroll (capture, to catch scrolling containers) or resize.
  useLayoutEffect(() => {
    if (!portal || !open) return;
    syncPanelPosition();
    window.addEventListener('scroll', syncPanelPosition, true);
    window.addEventListener('resize', syncPanelPosition);
    return () => {
      window.removeEventListener('scroll', syncPanelPosition, true);
      window.removeEventListener('resize', syncPanelPosition);
    };
  }, [portal, open, syncPanelPosition]);

  // Keep the highlighted option in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, open]);

  const openPanel = () => {
    if (disabled) return;
    setQuery('');
    // Panel opens unfiltered, so index against the full list
    setHighlighted(Math.max(0, options.findIndex(o => o.value === value)));
    // Measure before the first paint so the panel never renders at zero width
    // (which would mismeasure its own height for the flip check below).
    if (portal) syncPanelPosition();
    setOpen(true);
  };

  const select = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      // In editable mode the trigger is a text box, so Space must type a space
      // rather than open the panel (focus already opens it anyway).
      const openKeys = editable ? ['ArrowDown'] : ['Enter', ' ', 'ArrowDown'];
      if (openKeys.includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filtered[highlighted];
      if (option) select(option.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const panel = (
    <div
      className={`searchable-select-panel ${portal ? 'is-portalled' : ''}`}
      ref={panelRef}
      style={portal ? { top: panelRect.top, left: panelRect.left, width: panelRect.width } : undefined}
    >
      {!editable && (
        <div className="searchable-select-search">
          <Search size={16} />
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder={searchPlaceholder}
            onChange={e => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      <div className="searchable-select-list" role="listbox" ref={listRef}>
        {filtered.length === 0 ? (
          <div className="searchable-select-empty">{emptyText}</div>
        ) : (
          filtered.map((o, i) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`searchable-select-option ${i === highlighted ? 'is-highlighted' : ''} ${o.value === value ? 'is-selected' : ''}`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => select(o.value)}
            >
              <span className="searchable-select-option-text">
                <span className="searchable-select-option-label">{o.label}</span>
                {o.sublabel && (
                  <span className="searchable-select-option-sub">{o.sublabel}</span>
                )}
              </span>
              {o.value === value && <Check size={15} />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="searchable-select" ref={wrapperRef}>
      {editable ? (
        <div className={`searchable-select-trigger searchable-select-trigger-input ${hasError ? 'input-error' : ''}`}>
          <input
            id={id}
            ref={triggerInputRef}
            type="text"
            className="searchable-select-typeahead"
            value={open ? query : selected?.label ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            onFocus={() => openPanel()}
            onClick={() => { if (!open) openPanel(); }}
            onChange={e => {
              if (!open) setOpen(true);
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <ChevronDown size={16} className={open ? 'chevron-open' : ''} />
        </div>
      ) : (
        <button
          id={id}
          type="button"
          className={`searchable-select-trigger ${hasError ? 'input-error' : ''}`}
          onClick={() => (open ? setOpen(false) : openPanel())}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selected ? '' : 'searchable-select-placeholder'}>
            {selected ? selected.label : placeholder}
            {selected?.sublabel && (
              <span className="searchable-select-sub"> — {selected.sublabel}</span>
            )}
          </span>
          <ChevronDown size={16} className={open ? 'chevron-open' : ''} />
        </button>
      )}

      {open && (portal ? createPortal(panel, document.body) : panel)}
    </div>
  );
}
