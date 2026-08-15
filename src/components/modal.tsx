"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} className="modal">
      <div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></div>
      {children}
    </dialog>
  );
}
