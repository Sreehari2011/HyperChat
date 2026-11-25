import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ────────────────────────────────────────────────────────────
   Menu — anchored dropdown replacing all manual rect-math
   portals across the old codebase. Handles outside-click,
   Escape, and viewport clamping in ONE place.
   ──────────────────────────────────────────────────────────── */

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  items: MenuItem[];
  children: (props: { open: boolean; toggle: (e: React.MouseEvent) => void }) => React.ReactNode;
}

export function Menu({ items, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(true);
  };

  return (
    <div ref={anchorRef} className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      {children({ open, toggle })}
      {open && pos && createPortal(
        <div
          ref={panelRef}
          className="menu-panel fixed animate-pop-in"
          style={{
            top: Math.min(pos.top, window.innerHeight - 40),
            left: Math.max(8, Math.min(pos.left, window.innerWidth - 190)),
          }}
          role="menu"
        >
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {item.separatorBefore && <div className="menu-separator" />}
              <button
                role="menuitem"
                onClick={() => { setOpen(false); item.onSelect(); }}
                className={item.danger ? 'menu-item-danger' : 'menu-item'}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Modal — shared overlay for create / rename dialogs.
   ──────────────────────────────────────────────────────────── */

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export function Modal({ title, subtitle, onClose, children, footer, widthClass = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`card w-full ${widthClass} bg-ink-800 shadow-2xl animate-pop-in overflow-hidden`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-base font-medium text-ink-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-200">{subtitle}</p>}
          </div>
          <button className="icon-btn -mt-1 -mr-2" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
        {footer && <div className="flex items-center justify-end gap-3 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ────────────────────────────────────────────────────────────
   ConfirmDialog — destructive action confirmation.
   ──────────────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div className="px-6 pb-2 text-sm text-ink-200">{message}</div>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────
   Field — labeled input row used inside modals.
   ──────────────────────────────────────────────────────────── */

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-6 py-2">
      <label className="field-label">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-ink-300">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Toast — lightweight top-center feedback.
   ──────────────────────────────────────────────────────────── */

export function Toast({ message }: { message: string }) {
  return createPortal(
    <div className="fixed top-4 left-1/2 z-[130] -translate-x-1/2 animate-pop-in">
      <div className="menu-panel px-4 py-2.5 text-[13px] text-ink-50 flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {message}
      </div>
    </div>,
    document.body
  );
}
