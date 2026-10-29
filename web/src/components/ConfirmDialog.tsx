import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useScrollLock } from "@/hooks/useScrollLock";

import { Button } from "./ui";

type Props = {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "dark";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Centred "Are you sure?" dialog. Rendered into <body> so it sits above drawers and sheets.
export function ConfirmDialog(props: Props) {
  return createPortal(
    <AnimatePresence>{props.open ? <Dialog {...props} /> : null}</AnimatePresence>,
    document.body,
  );
}

function Dialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useScrollLock(true);

  useEffect(() => {
    // Safest choice gets focus first
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-5">
      <motion.div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        className="relative w-full max-w-sm rounded-[28px] bg-card p-6 text-center shadow-2xl"
      >
        <span
          className={`mx-auto mb-4 grid size-14 place-items-center rounded-full ${
            tone === "danger" ? "bg-danger-soft text-danger" : "bg-lime-soft text-lime-ink"
          }`}
        >
          <AlertTriangle size={24} />
        </span>
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        {body ? <div className="mt-1.5 text-sm text-muted">{body}</div> : null}
        <div className="mt-6 flex gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-full border border-line bg-card text-sm font-semibold transition hover:border-ink"
          >
            {cancelLabel}
          </button>
          <Button
            variant="dark"
            size="md"
            loading={loading}
            onClick={onConfirm}
            className={`h-12 flex-1 ${tone === "danger" ? "!bg-danger hover:!brightness-95" : ""}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
